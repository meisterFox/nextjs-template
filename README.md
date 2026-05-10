# Luminescence

> Meet the soul, before the face.

Luminescence is a blind dating app for people who are tired of swipes and want
to meet someone before knowing what they look like. There are no profile
photos in the lounge, no name, no height — just a candle, a vibe title, and a
slow conversation. Identity is revealed only when **both** parties light their
candle.

## The philosophy

> "Bütün date uygulamaları match olmak üzerine kurulu ama bu uygulama tam da
> hiç fotoğraf paylaşmayan, efor sarf etmeyen ama hayatlarının aşkının gelip
> kendilerini bulmalarını bekleyenler için. Loş ışıktaki bir masada iki taraf
> da kendini görmeyecek şekilde bir tasarım — karşısındaki ile ilgili hiçbir
> fiziksel özelliği kendi reveal etmedikçe göremeyecek."

## The progression

| Phase | Trigger | What you see |
|------|--------|-------------|
| 🕯️ **Whisper** | start of every chat | Text only. No name, no age, no city — just a vibe title and a one-line bio. |
| 👤 **Outline** | 50 messages exchanged | A blurred silhouette and the rough shape (height, body type) appear. |
| 🔥 **Reveal** | both tap *Light the candle* | Full identity, photos, and locked details unfold — only between you two. |

## Tech

- **Next.js 15** (App Router, React 19, Server Components)
- **Tailwind CSS v4** with a hand-rolled candlelight theme
- **Framer Motion** for the dimly-lit transitions and reveal blur
- **shadcn-style** primitives built on **Radix UI**
- **Supabase** — auth, Postgres, RLS, real-time chat, storage for locked photos
- **lucide-react** icons
- **zod** validation

No analytics, no trackers, no third-party chat — the entire stack runs on
Supabase + Vercel.

## Setting it up

### 1 · Create a Supabase project

1. Go to <https://app.supabase.com> and create a new project.
2. **SQL Editor → New query** — paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the
   `profiles`, `matches`, `messages` tables, the `light_candle` and
   `create_match` RPCs, RLS policies, and enables real-time on chat tables.
3. **Authentication → Providers** — enable **Email**. (For dev, turn off email
   confirmation under *Email Auth* so you can test without checking your inbox.)
4. **Storage → New bucket** — create a *private* bucket called `locked-photos`.
   This is where Soul-Sync stores photos that stay invisible until reveal.
5. **Project Settings → API** — copy the project URL and the *anon* public key.

### 2 · Configure env

Copy `.env.example` to `.env.local` and fill in the Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey…
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3 · Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, reserve a table, and you'll be walked through
**Soul-Sync** — the multi-step onboarding that captures your values, interests,
personality, and the locked physical descriptors used by the matchmaker.

## Deploying to Vercel

1. Push this repo to GitHub.
2. <https://vercel.com/new> — import the repo.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `NEXT_PUBLIC_SITE_URL` (set to your production URL) under
   *Environment Variables*.
4. Deploy. Set up a custom domain and update `NEXT_PUBLIC_SITE_URL` accordingly.

That's it — there are no build flags or extra config to set.

## How matchmaking works

The matchmaker (see [`lib/matchmaker.ts`](lib/matchmaker.ts)) is a pure
heuristic. It computes:

```
score = 0.55 · jaccard(values)
      + 0.30 · jaccard(interests)
      + 0.15 · personality_affinity
```

Proximity, age, and physical attributes are **deliberately ignored** — the
whole point of Luminescence is that you cannot see the person, so the matcher
cannot weight what they look like.

## Project shape

```
app/
  (auth)/login              email/password sign-in
  (auth)/signup             create account → triggers onboarding
  onboarding                multi-step Soul-Sync wizard
  lounge                    The Dim Table — silhouettes + ranked candidates
  lounge/chats              your tables, sorted by recency
  lounge/profile            your own profile preview
  chat/[matchId]            ChatRoom with reveal progression + real-time
  api/health                deploy smoke check
  api/matchmake             JSON endpoint exposing the heuristic ranking
components/
  ui/*                      Radix-based shadcn primitives (button, dialog, …)
  atmospheric/*             candle, silhouette, dim-room, ambient-sound
  onboarding/*              wizard + step screens
  lounge/*                  dim-table grid
  chat/*                    chat-room (real-time + reveal logic)
lib/
  supabase/{client,server,middleware}.ts
  matchmaker.ts             heuristic scoring
  reveal.ts                 reveal-level derivation + projection
  types.ts                  shared domain types + Database<->TS shape
supabase/schema.sql         full migration (run once in SQL editor)
middleware.ts               Supabase session refresh + protected route guard
```

## Ambient sound

The bottom-right toggle synthesises ambient audio in pure Web Audio (no MP3s
to ship): a slow major-7 piano-bell loop ("Jazz Café") or rolling brown-noise
("Soft Rain"). Pick a mood, set the volume, and dim the room.

## Caveats

- **Photo privacy** — Supabase RLS is column-blind, so the application layer
  uses `lib/reveal.ts → project()` to strip `photos`, `hair_color` etc. before
  sending data to a peer who hasn't yet earned the reveal. **Always go through
  `project()`** when displaying another user.
- **Storage policy** — for production, add an RLS policy on the
  `storage.objects` table so that `locked-photos` are only readable by the
  uploader and by users with whom they share a `revealed` match.
- **Email confirmation** — when enabled, the magic link redirects users back
  to `/onboarding` automatically.

---

Built quietly, by candlelight.
