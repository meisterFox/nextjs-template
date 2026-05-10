-- Luminescence — Supabase schema.
-- Run this once in the Supabase SQL editor of a fresh project, then enable Email auth.

-- =========================================================================
-- Enums
-- =========================================================================
do $$ begin
  create type reveal_level as enum ('whisper', 'outline', 'revealed');
exception when duplicate_object then null; end $$;

-- =========================================================================
-- profiles — every authenticated user has exactly one row.
-- Sensitive columns (hair_color, photos, etc.) are exposed only via RPC + RLS.
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  vibe_title text,
  age int,
  gender text,
  seeking text,
  city text,
  bio_short text,
  hair_color text,
  eye_color text,
  height_cm int,
  body_type text,
  ethnicity text,
  values text[] not null default '{}',
  interests text[] not null default '{}',
  personality jsonb not null default '{}'::jsonb,
  love_language text,
  photos text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_onboarding_idx on public.profiles (onboarding_complete);
create index if not exists profiles_values_idx on public.profiles using gin (values);
create index if not exists profiles_interests_idx on public.profiles using gin (interests);

-- =========================================================================
-- matches — one row per pairing. Reveal state lives here.
-- =========================================================================
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  reveal_level reveal_level not null default 'whisper',
  candle_lit_by_a boolean not null default false,
  candle_lit_by_b boolean not null default false,
  message_count int not null default 0,
  compatibility numeric(4,3) not null default 0,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint matches_distinct_users check (user_a <> user_b),
  constraint matches_ordered check (user_a < user_b),
  unique (user_a, user_b)
);

create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);

-- =========================================================================
-- messages — text-only chat. Real-time enabled below.
-- =========================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_match_idx on public.messages (match_id, created_at);

-- =========================================================================
-- Trigger: auto-create profile row on signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Trigger: keep matches.message_count + last_message_at + reveal_level fresh
-- =========================================================================
create or replace function public.bump_match_on_message()
returns trigger
language plpgsql
as $$
declare
  new_count int;
begin
  update public.matches
  set
    message_count = message_count + 1,
    last_message_at = now(),
    reveal_level = case
      when candle_lit_by_a and candle_lit_by_b then 'revealed'::reveal_level
      when message_count + 1 >= 50 then 'outline'::reveal_level
      else reveal_level
    end
  where id = new.match_id
  returning message_count into new_count;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.bump_match_on_message();

-- =========================================================================
-- RPC: light_candle — sets the candle flag for the calling user and flips
-- reveal_level when both have lit.
-- =========================================================================
create or replace function public.light_candle(match_id uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.matches;
begin
  select * into m from public.matches where id = match_id;
  if m is null then
    raise exception 'Match not found';
  end if;

  if auth.uid() = m.user_a then
    update public.matches
      set candle_lit_by_a = true,
          reveal_level = case when candle_lit_by_b then 'revealed'::reveal_level else reveal_level end
      where id = match_id
      returning * into m;
  elsif auth.uid() = m.user_b then
    update public.matches
      set candle_lit_by_b = true,
          reveal_level = case when candle_lit_by_a then 'revealed'::reveal_level else reveal_level end
      where id = match_id
      returning * into m;
  else
    raise exception 'Not your match';
  end if;

  return m;
end;
$$;

-- =========================================================================
-- RPC: create_match — atomically creates a match between the caller and target.
-- =========================================================================
create or replace function public.create_match(target uuid, score numeric default 0)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  a uuid;
  b uuid;
  m public.matches;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if target = auth.uid() then raise exception 'Cannot match yourself'; end if;

  -- Always store the lexicographically smaller uuid in user_a so the unique
  -- constraint covers (a,b) and (b,a) as one row.
  if auth.uid() < target then
    a := auth.uid(); b := target;
  else
    a := target; b := auth.uid();
  end if;

  insert into public.matches (user_a, user_b, compatibility)
  values (a, b, score)
  on conflict (user_a, user_b) do update set compatibility = excluded.compatibility
  returning * into m;

  return m;
end;
$$;

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- Profiles: anyone authenticated can read the *non-sensitive* slice; updates only by owner.
-- (We rely on the application layer + project() to strip sensitive fields. Supabase RLS
--  is column-blind, so app code MUST avoid leaking hair_color/photos to non-revealed peers.)
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- Matches: visible only to participants.
drop policy if exists "matches_select_participants" on public.matches;
create policy "matches_select_participants" on public.matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "matches_update_participants" on public.matches;
create policy "matches_update_participants" on public.matches
  for update using (auth.uid() = user_a or auth.uid() = user_b);

-- Messages: insert if you own the sender id and you are part of the match.
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Allow participants to delete their own match (leaving the table).
drop policy if exists "matches_delete_participants" on public.matches;
create policy "matches_delete_participants" on public.matches
  for delete using (auth.uid() = user_a or auth.uid() = user_b);

-- =========================================================================
-- blocks — one user can block another. Hides them from the lounge and
-- prevents future matches.
-- =========================================================================
create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint blocks_distinct check (blocker <> blocked)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked);

alter table public.blocks enable row level security;

drop policy if exists "blocks_select_self" on public.blocks;
create policy "blocks_select_self" on public.blocks
  for select using (auth.uid() = blocker or auth.uid() = blocked);

drop policy if exists "blocks_insert_self" on public.blocks;
create policy "blocks_insert_self" on public.blocks
  for insert with check (auth.uid() = blocker);

drop policy if exists "blocks_delete_self" on public.blocks;
create policy "blocks_delete_self" on public.blocks
  for delete using (auth.uid() = blocker);

-- =========================================================================
-- Rate limit on message inserts: max 8 messages in any 10-second window.
-- =========================================================================
create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.messages
  where sender = new.sender
    and created_at > now() - interval '10 seconds';
  if recent_count >= 8 then
    raise exception 'Rate limit: too many messages. Slow down.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists rate_limit_messages on public.messages;
create trigger rate_limit_messages
  before insert on public.messages
  for each row execute function public.enforce_message_rate_limit();

-- =========================================================================
-- Storage: lock the locked-photos bucket so only revealed match peers can read.
-- (Run ONLY after creating the bucket: Storage → New bucket → "locked-photos", Private.)
-- =========================================================================
do $$ begin
  if exists (select 1 from storage.buckets where id = 'locked-photos') then
    -- Owners can do everything to objects under their own user-id folder.
    drop policy if exists "locked_photos_owner_all" on storage.objects;
    create policy "locked_photos_owner_all" on storage.objects
      for all using (
        bucket_id = 'locked-photos'
        and split_part(name, '/', 1) = auth.uid()::text
      ) with check (
        bucket_id = 'locked-photos'
        and split_part(name, '/', 1) = auth.uid()::text
      );

    -- Peers in a fully-revealed match can read the other party's photos.
    drop policy if exists "locked_photos_revealed_read" on storage.objects;
    create policy "locked_photos_revealed_read" on storage.objects
      for select using (
        bucket_id = 'locked-photos'
        and exists (
          select 1 from public.matches m
          where m.reveal_level = 'revealed'
            and (
              (m.user_a = auth.uid() and m.user_b::text = split_part(name, '/', 1))
              or (m.user_b = auth.uid() and m.user_a::text = split_part(name, '/', 1))
            )
        )
      );
  end if;
end $$;

-- =========================================================================
-- Realtime: enable for messages + matches
-- =========================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
