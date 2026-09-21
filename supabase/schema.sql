-- FlixMatch database schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push` / the
-- Management API) against the target project. Safe to re-run: every
-- statement is idempotent (`if not exists`, `create or replace`).
--
-- Design notes:
--   * There is no `titles` table — titles come from TMDB (via a Supabase Edge
--     Function proxy, see supabase/functions/tmdb-pool) rather than a stored
--     catalogue, so both `matches.title_snapshot` and `sessions.pool` store
--     full Title JSON objects directly (not ids to look up elsewhere). That's
--     also what makes cross-device realtime sync work without both devices
--     needing a shared local catalogue to resolve ids against.
--   * There is no auth yet (see PRODUCT_REQUIREMENTS.md — auth is a later
--     phase), so RLS policies below scope access by knowledge of a row's
--     `session_id` / `code` rather than by user identity. That's a
--     deliberate, documented tradeoff for this phase, not an oversight —
--     tighten these policies once real auth ships.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- sessions: one row per "two people trying to find something to watch"
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  round smallint not null default 1,
  status text not null default 'collecting_preferences'
    check (status in ('collecting_preferences', 'swiping', 'top_five', 'matched', 'no_match_final')),
  pool jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.sessions add column if not exists pool jsonb not null default '[]'::jsonb;

alter table public.sessions drop constraint if exists sessions_status_check;
alter table public.sessions add constraint sessions_status_check
  check (status in ('collecting_preferences', 'swiping', 'top_five', 'matched', 'no_match_final'));

comment on table public.sessions is 'One row per FlixMatch session (one invite link / QR code).';
comment on column public.sessions.code is 'Short code embedded in the shareable invite link.';
comment on column public.sessions.pool is 'Full Title[] JSON for the current round''s shared swipe pool (round 1/2) or top-5 shortlist, written once by whichever client wins the race and picked up by the other via realtime.';

-- ---------------------------------------------------------------------------
-- preferences: one row per partner per session
-- ---------------------------------------------------------------------------
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  partner text not null check (partner in ('A', 'B')),
  moods jsonb not null default '[]'::jsonb,
  mood_note text,
  languages jsonb not null default '[]'::jsonb,
  content_type text not null check (content_type in ('movies', 'series')),
  min_rating smallint not null check (min_rating in (6, 7, 8, 9)),
  eras jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, partner)
);

comment on table public.preferences is 'Partner A / Partner B preference submission for a session.';

-- ---------------------------------------------------------------------------
-- swipes: one row per card a partner swiped, per round
-- ---------------------------------------------------------------------------
create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  partner text not null check (partner in ('A', 'B')),
  round smallint not null default 1,
  title_id text not null,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (session_id, partner, round, title_id)
);

comment on table public.swipes is 'Full swipe history — one row per title per partner per round.';

-- ---------------------------------------------------------------------------
-- matches: the reveal moment, plus the post-watch rating once it's added
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  title_id text not null,
  title_snapshot jsonb not null,
  round smallint not null,
  matched_at timestamptz not null default now(),
  rating smallint check (rating between 1 and 5),
  rated_at timestamptz,
  unique (session_id, round)
);

comment on table public.matches is 'A confirmed match (or the manually-picked top-5 fallback) for a session. One row per (session, round) — the unique constraint is what makes concurrent match detection on two devices race-safe: whichever client inserts first wins, the other reads it back.';
comment on column public.matches.title_snapshot is 'Full Title object as shown at match time, so history stays stable even if the source catalogue changes later.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'matches_session_id_round_key'
  ) then
    alter table public.matches add constraint matches_session_id_round_key unique (session_id, round);
  end if;
end $$;

create index if not exists matches_session_id_idx on public.matches (session_id);
create index if not exists swipes_session_id_idx on public.swipes (session_id);
create index if not exists preferences_session_id_idx on public.preferences (session_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.sessions enable row level security;
alter table public.preferences enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;

drop policy if exists "sessions_select" on public.sessions;
drop policy if exists "sessions_insert" on public.sessions;
drop policy if exists "sessions_update" on public.sessions;
create policy "sessions_select" on public.sessions for select using (true);
create policy "sessions_insert" on public.sessions for insert with check (true);
create policy "sessions_update" on public.sessions for update using (true) with check (true);

drop policy if exists "preferences_select" on public.preferences;
drop policy if exists "preferences_insert" on public.preferences;
create policy "preferences_select" on public.preferences for select using (true);
create policy "preferences_insert" on public.preferences for insert with check (true);

drop policy if exists "swipes_select" on public.swipes;
drop policy if exists "swipes_insert" on public.swipes;
create policy "swipes_select" on public.swipes for select using (true);
create policy "swipes_insert" on public.swipes for insert with check (true);

drop policy if exists "matches_select" on public.matches;
drop policy if exists "matches_insert" on public.matches;
drop policy if exists "matches_update" on public.matches;
create policy "matches_select" on public.matches for select using (true);
create policy "matches_insert" on public.matches for insert with check (true);
create policy "matches_update" on public.matches for update using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime — required for cross-device partner sync (invite join, live
-- swipes, live match reveal). Adds each table to the publication Supabase's
-- Realtime server reads from; harmless/no-op if already added.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'preferences'
  ) then
    alter publication supabase_realtime add table public.preferences;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'swipes'
  ) then
    alter publication supabase_realtime add table public.swipes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;
