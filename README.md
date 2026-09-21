# FlixMatch

Two people. One great watch.

FlixMatch helps two people who can't agree on what to watch tonight land on one movie or show they'll both like — and shows exactly where to stream it in India.

Titles come from **live TMDB data** (posters, ratings, genres, synopses — see [TMDB integration](#tmdb-integration)), and the two-partner experience is real: two different devices can open a session, join it, set preferences privately, swipe independently, and see a match reveal live on both screens at once, all synced through Supabase realtime. AI-brief generation and real Indian OTT availability are still mocked — see [Future integrations](#future-integrations).

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling (warm, cinematic dark theme)
- [Framer Motion](https://www.framer.com/motion/) for swipe gestures and transitions
- [React Router](https://reactrouter.com/) (hash routing, so it works from a static file with no server config)
- [qrcode.react](https://github.com/zpao/qrcode.react) for the mock invite QR code
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) for session/preference/swipe/match persistence

## Getting started

```bash
npm install
cp .env.example .env   # fill in your own Supabase project values
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

```bash
npm run build     # type-check + production build
npm run preview   # preview the production build locally
npm run lint      # eslint
```

## Project structure

```
src/
  components/       Reusable UI: buttons, chips, cards, the swipe deck, the preferences form
    ui/             Small presentational primitives (Button, Chip, PosterImage, OttBadge, ...)
    swipe/          Swipe-specific card + deck components
  pages/            One file per screen in the user journey (routed in App.tsx)
  state/            SessionContext — the single source of truth for the in-progress session
  data/             Mock movie catalogue (fallback only) + mock OTT platform data
  services/         Service functions — supabaseService and tmdbService are live; ai/ott are still mocked
  lib/              supabaseClient.ts (frontend client) + database.types.ts
  types.ts          Shared TypeScript types for preferences, titles, swipes, history
supabase/
  schema.sql               Full table + RLS definitions — source of truth for the database
  functions/tmdb-pool/     Edge Function that proxies TMDB server-side (see below)
```

Mock data lives entirely under `src/data/`, separate from the UI components that render it. The `src/services/` files define the function signatures the real integrations will fill in — every one of them is already called from the UI with the right shape of data going in and out, so swapping the implementation later shouldn't require touching any page or component.

## User journey implemented

1. **Landing** — value proposition + "Start a session".
2. **Partner A preferences** — mood, language, content type, minimum rating, era. Creates the session in Supabase.
3. **Invite** — real QR code and link (`/#/join/<code>`) pointing at this session; a genuine "waiting for partner" state that clears the moment Partner B's preferences land in the database (via realtime, not a timer).
4. **Partner B preferences** — opened via the link on a second device (or "Continue as Partner B on this device" for one-device testing); same form, independently, without ever fetching or displaying Partner A's answers.
5. **Swipe** — both partners swipe the same shared pool (in independently shuffled order) with drag, buttons, or arrow keys. Every swipe is written to Supabase and broadcast to the other partner's device in real time.
6. **Match** — the instant both partners have liked the same title (in either order, from either device), a `matches` row is written and both screens navigate to the reveal simultaneously — full title details, mock Indian OTT availability, and "rate after watching."
7. **No match → round two → top 5** — if a round ends with no shared like on either side, either partner can advance to a refined round two (or, after that, the top-5 shortlist); Postgres resolves the case where both tap the button at once, and the other device follows along automatically.
8. **History** — past matches with editable post-watch ratings, loaded live from Supabase (empty on first run for a fresh project).

Race conditions between two real devices are handled at the database level, not by convention: `matches` has a `unique (session_id, round)` constraint, and pool-advancing writes are conditional updates (`claimSessionTransition`) that only succeed if the row is still in the expected state — so whichever device acts first wins, and the other picks up the result via realtime instead of writing a conflicting second copy. See `src/state/SessionContext.tsx` and `src/services/supabaseService.ts`.

## Database (Supabase)

`supabase/schema.sql` is the source of truth for the schema — `sessions`, `preferences`, `swipes`, `matches` (rating lives inline on the match row), all with Row Level Security enabled. It's idempotent, so re-running it is safe.

To apply it to a project: paste it into the Supabase Dashboard → SQL Editor → Run, or push it via the Management API / Supabase CLI. There's no auth yet (see `PRODUCT_REQUIREMENTS.md`), so RLS policies currently scope access by knowledge of a row's `session_id` rather than by user identity — documented in the SQL file, and the first thing to tighten once real auth ships.

`src/lib/supabaseClient.ts` is the only place the frontend touches Supabase, and it uses **only** the publishable key (safe to ship in browser code, protected by RLS). The secret key and management access token live in `.env` for schema/admin work only — never imported under `src/`.

**Known limitation:** session state lives only in memory (React context), not in `localStorage`/the URL beyond the invite code — so refreshing mid-session currently loses local progress (the Supabase rows themselves are unaffected). Resuming a session after a reload would be the next thing to add here.

## TMDB integration

`supabase/functions/tmdb-pool` is a Supabase Edge Function that's the only thing that ever calls `api.themoviedb.org` — the TMDB Read Access Token lives in Supabase's function secrets (`supabase secrets set`), never in frontend code or the browser bundle, per the security requirements in `PRODUCT_REQUIREMENTS.md`. `src/services/tmdbService.ts` calls this function (`supabase.functions.invoke('tmdb-pool', ...)`) and falls back to the local mock catalogue if the call fails for any reason (offline, function down, TMDB rate-limited), so swiping never breaks.

What the function does, given both partners' preferences: queries TMDB's `/discover/movie` (and `/discover/tv` if both partners chose "Include series") filtered by minimum rating and language(s) (hard filters, matching the original preference semantics — AND across both partners), fetches per-title detail for runtime, ranks results by mood/genre overlap (soft signal, same as the original mock scoring), and maps everything to this app's `Title` shape — including real posters (`image.tmdb.org`), real synopses, and a still-mocked `ottAvailability` (RapidAPI hasn't landed yet, see below).

A few explicit simplifications, worth knowing about:
- **Era filtering** happens client-side in the function (by release year) rather than as a TMDB API date-range parameter, to avoid needing one API call per selected era.
- **TMDB's TV genre list has no Horror or Romance category** — Mystery and Soap are used as the closest stand-ins, so mood matching for series is approximate on those two moods specifically.
- **The "IMDb rating" label is kept** (matching the product spec's named feature), but the number itself is TMDB's own `vote_average` — TMDB has no public API for actual IMDb scores. The two are usually close but not identical.
- To redeploy the function after editing it: `npx supabase functions deploy tmdb-pool --project-ref <ref> --use-api` (the `--use-api` flag bundles server-side, so it works without Docker installed locally).

## Future integrations

These are the seams still left for the services described in `PRODUCT_REQUIREMENTS.md`. Supabase and TMDB are connected (see above); nothing else below is wired up yet.

| Service | Where it plugs in | Notes |
| --- | --- | --- |
| **AI model (Claude or Gemini)** | `src/services/aiService.ts` — `generateSearchBrief()` and `refinePoolForRoundTwo()` | Currently returns a locally-computed summary. Real version should call a server-side endpoint (a second Edge Function, following the same pattern as `tmdb-pool`) that sends both partners' structured preferences + free-text mood notes to the model and returns a refined search brief the TMDB function's ranking could use directly. |
| **RapidAPI (OTT Details)** | `src/services/ottService.ts` — `getIndianAvailability()`, and the `mockOttAvailability` mapping inside `supabase/functions/tmdb-pool/index.ts` | Currently returns plausible mock platforms/links. Real version should call the RapidAPI OTT Details endpoint from within the `tmdb-pool` function (or a new one) server-side, keyed by title + `IN` region, replacing the mock mapping at the point titles are built. |

When these are connected, all secret keys must be stored in environment variables (never committed) or Supabase function secrets, kept out of git via `.gitignore` (already configured), and called only from server-side endpoints — never directly from this frontend.
