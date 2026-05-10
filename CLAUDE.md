# CLAUDE.md

Briefing for the next Claude Code session. Read this first.

## What this app is

**Luminescence** — a blind dating app whose entire premise is *minds before
faces*. The user's locked physical descriptors and photos exist in the DB
from signup, but never leak to peers until **both** parties have lit the
candle. Conversations progress through three reveal phases:

| Phase    | Trigger                | Visibility                                                       |
|----------|-----------------------|------------------------------------------------------------------|
| Whisper  | start                 | Vibe title + 1-line bio. No name, no age, no city.               |
| Outline  | 50 messages exchanged | Blurred silhouette + height/body type.                           |
| Reveal   | both light the candle | Display name, age, city, hair, eyes, photos (signed URLs).       |

Whatever you do, **do not violate this contract.** It is the product.

## Tech stack

Next.js 15 (App Router, RSC) · React 19 · TypeScript strict · Tailwind v4
(no `tailwind.config.ts` — theme lives in `app/globals.css` via `@theme`) ·
Framer Motion · Radix UI primitives (shadcn-style components in `components/ui`) ·
lucide-react · zod · **Supabase** (auth, Postgres, Realtime, Storage).

No analytics, no third-party chat. The whole stack is Supabase + Vercel.

## Run / build / typecheck

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npx tsc --noEmit     # strict typecheck (CI gate)
npm run lint
```

`.env.local` needs:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Project structure (only the parts that matter)

```
app/
  layout.tsx                  # root, fonts, ambient sound mount
  page.tsx                    # landing
  (auth)/login, signup        # email/password
  onboarding/page.tsx         # multi-step Soul-Sync wizard
  lounge/
    layout.tsx                # auth gate + nav
    page.tsx                  # Dim Table — server-side ranking + filters
    chats/page.tsx            # list of active matches
    profile/page.tsx          # own profile (read-only)
    profile/edit/page.tsx     # reuses wizard with editMode
  chat/[matchId]/page.tsx     # server-resolves signed URLs + projects peer
  api/health, api/matchmake   # JSON endpoints

components/
  ui/*                        # shadcn-on-Radix primitives
  atmospheric/*               # candle, silhouette, dim-room, ambient-sound
  onboarding/wizard.tsx       # the wizard; supports `editMode` prop
  onboarding/steps/*          # 6 step screens
  lounge/dim-table.tsx        # client-side cards + skip/reshuffle/approach
  chat/chat-room.tsx          # client realtime + reveal UI + leave/block menu

lib/
  supabase/{client,server,middleware}.ts   # SSR-safe clients (no Database<T> generic)
  matchmaker.ts               # heuristic ranking — pure
  reveal.ts                   # deriveRevealLevel() + project()
  storage.ts                  # signedUrls() helper for locked-photos bucket
  types.ts                    # domain types + tag enums
  utils.ts                    # cn() + vibeFromInterests()

supabase/schema.sql           # idempotent migration: tables, RPCs, RLS, storage policies, rate limit
middleware.ts                 # Supabase session refresh + protected-route gate
```

## Security invariants — DO NOT BREAK

1. **`lib/reveal.ts → project(profile, level)` is the only sanctioned way to
   send a peer's profile to the client.** It strips photos, hair_color, etc.
   based on the reveal level. Never bypass it.
2. **Photos are private.** The `locked-photos` Supabase storage bucket is
   private and gated by RLS in `supabase/schema.sql`. The chat page resolves
   *signed URLs* (1-hour TTL) **server-side**, only when level is `revealed`.
   Don't expose raw paths or make the bucket public.
3. **Storage path convention** is `<userId>/<filename>`. The RLS policies
   parse `split_part(name, '/', 1) = auth.uid()::text`. If you change the path
   shape, update the policies.
4. **Reveal level is computed in two places** that must stay in sync:
   - `lib/reveal.ts → deriveRevealLevel()` (TS, used in app code)
   - The DB trigger `bump_match_on_message` and the `light_candle` RPC in
     `supabase/schema.sql` (SQL, the source of truth)
   If you change the threshold (currently 50) or rules, change both.
5. **Matchmaker deliberately ignores age, location, and physical fields.**
   That's a product decision, not an oversight. If a heuristic uses anything
   visible, it's wrong.
6. **Realtime channel filter** in `chat-room.tsx` is `match_id=eq.${match.id}`.
   Without that filter, peers leak each other's messages.

## What's done (post-MVP-hardening, commit 95616c4)

- ✅ Auth (email/password) + auto-create profile via `handle_new_user` trigger
- ✅ 6-step Soul-Sync wizard (basics, values, interests + custom vibe title,
     personality sliders, locked physical, locked photos)
- ✅ Lounge with heuristic ranking, reshuffle, per-card skip via `?skip=`
- ✅ Real-time chat via Supabase channels (`match-${id}`)
- ✅ Three-phase reveal with mutual `light_candle` RPC + celebration modal
- ✅ Storage RLS, signed URLs, message rate limit (8/10s)
- ✅ Blocks table + leave-table / block-and-leave from chat menu
- ✅ Profile edit page (reuses wizard with `editMode` prop)
- ✅ Ambient sound — Web Audio synth (jazz / rain), no MP3s shipped

## What's still missing (pick from this list)

### Important polish
- **Loading skeletons** in lounge/chats while server data lands
- **Mobile QA** — sticky chat composer, lounge grid wrap, header overflow
- **i18n** — landing manifesto is Turkish, rest is English. Pick one.
- **User-friendly error mapping** — `auth.api.errors` → human strings
- **Onboarding photos step copy** — make "skip for now" explicit
- **Edit page nav** — currently lands user back on `/lounge/profile`, but
  changing onboarding-required fields should be guarded

### Tests (none exist yet)
- `lib/matchmaker.ts` and `lib/reveal.ts` are pure → trivial unit tests
- `OUTLINE_THRESHOLD` constant should be unit-tested + matched against schema

### Architecture / scale
- **Matchmaker is client-pulled then ranked in JS.** Pool capped at 96
  profiles. Past ~5K active users this needs a Postgres-side ranking function
  (probably a SQL view + RPC).
- **`message_count` increment is not race-safe** under concurrent inserts.
  Trigger uses `update … set message_count = message_count + 1`. Switch to
  advisory lock or recompute via `count(*)` if it becomes a problem.
- **No `unlight_candle` RPC.** Once you light, you can't undo. Decide if
  that's intentional (it is a one-way reveal, by design) or add it.
- **No GDPR export / delete-my-account flow** — `auth.users` cascades to
  profiles, but we don't expose a UI for it.

### Notifications / engagement
- No push or email notifications for new messages. Browser tab must be open.
- Vercel Cron job for daily "you have a new resonance" digest could ride
  the existing `/api/matchmake` endpoint.

## Workflow notes for the next session

- **The branch you push to is `main`** in `meisterFox/blind-date`. The earlier
  branch `claude/build-app-from-prompt-PFjhS` only existed in the old
  `nextjs-template` repo from which this one was forked manually. Don't try
  to push there.
- **Schema changes** must be appended to `supabase/schema.sql` *and* applied
  by hand in the Supabase SQL editor. There's no migration runner. Keep
  every statement idempotent (`drop … if exists`, `create or replace`,
  `if not exists`).
- **Type generation** — types in `lib/types.ts` are hand-rolled. Supabase
  clients intentionally don't pass a `Database` generic (the typed query
  builder fights us; we lean on `project()` for safety instead). If you
  later wire up `supabase gen types`, do it as one cohesive PR and re-add
  the generic.
- **Tailwind v4** uses `@theme` in `app/globals.css`. There's no
  `tailwind.config.*`. Token names live as CSS vars (`--candle`,
  `--ember`, …) and as `--color-*` aliases under `@theme inline`.
- **`tsc --noEmit` is the gate.** Build also runs ESLint with two
  pre-existing warnings about `useMemo` deps in `chat-room.tsx`. Don't add
  new ones.

## Design north star

The lounge is *dim*, not dark. Amber `#FFBF00` is reserved for candlelight
and only earned moments (active state, mutual reveal, candle flame). Most
of the UI sits in deep charcoal `#0a0908` with low-contrast muted text.
Animations are slow (2.4s flicker, 6s drift) — never bouncy. When in doubt,
make it quieter.
