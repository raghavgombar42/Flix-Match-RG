import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { HistoryEntry, PartnerKey, PartnerPreferences, SwipeDirection, Title } from '../types'

/**
 * Live Supabase persistence + realtime layer — see supabase/schema.sql for
 * the table definitions this maps onto. Plain writes here are best-effort:
 * if a call fails (offline, RLS misconfigured, etc.) we log and let the
 * local experience keep working rather than blocking the UI on network
 * state. The pool-claiming and match-inserting functions are the exception —
 * they're deliberately race-safe (see comments) because two real devices
 * can call them at close to the same instant.
 */

const UNIQUE_VIOLATION = '23505'

function logPersistenceFailure(action: string, error: unknown) {
  console.warn(`[supabaseService] ${action} failed — continuing without it.`, error)
}

export type SessionStatus = 'collecting_preferences' | 'swiping' | 'top_five' | 'matched' | 'no_match_final'

export interface SessionRow {
  id: string
  code: string
  round: number
  status: SessionStatus
  /** Full Title objects for the current round/shortlist — not ids, since TMDB results aren't in a static catalogue both devices share. */
  pool: Title[]
}

export async function createSession(code: string): Promise<SessionRow | null> {
  const { data, error } = await supabase.from('sessions').insert({ code }).select('id, code, round, status, pool').single()
  if (error) {
    logPersistenceFailure('createSession', error)
    return null
  }
  return data as SessionRow
}

export async function getSessionByCode(code: string): Promise<SessionRow | null> {
  const { data, error } = await supabase.from('sessions').select('id, code, round, status, pool').eq('code', code).maybeSingle()
  if (error || !data) {
    if (error) logPersistenceFailure('getSessionByCode', error)
    return null
  }
  return data as SessionRow
}

export async function getSession(sessionId: string): Promise<SessionRow | null> {
  const { data, error } = await supabase.from('sessions').select('id, code, round, status, pool').eq('id', sessionId).maybeSingle()
  if (error || !data) {
    if (error) logPersistenceFailure('getSession', error)
    return null
  }
  return data as SessionRow
}

/**
 * Compare-and-swap: writes `next` only if the row currently matches `guard`.
 * Two devices can both decide "we should generate the pool now" at once —
 * whichever UPDATE reaches Postgres first wins (returns true); the loser's
 * WHERE clause matches zero rows (returns false) and should instead pick up
 * the winner's write via the realtime subscription.
 */
export async function claimSessionTransition(
  sessionId: string,
  guard: { round: number; status: SessionStatus },
  next: { round: number; status: SessionStatus; pool: Title[] },
): Promise<boolean> {
  const { data, error } = await supabase
    .from('sessions')
    .update(next)
    .eq('id', sessionId)
    .eq('round', guard.round)
    .eq('status', guard.status)
    .select('id')
  if (error) {
    logPersistenceFailure('claimSessionTransition', error)
    return false
  }
  return (data?.length ?? 0) > 0
}

export async function savePreferences(sessionId: string, partner: PartnerKey, prefs: PartnerPreferences): Promise<void> {
  const { error } = await supabase.from('preferences').upsert(
    {
      session_id: sessionId,
      partner,
      moods: prefs.moods,
      mood_note: prefs.moodNote || null,
      languages: prefs.languages,
      content_type: prefs.contentType,
      min_rating: prefs.minRating,
      eras: prefs.eras,
    },
    { onConflict: 'session_id,partner' },
  )
  if (error) logPersistenceFailure('savePreferences', error)
}

export async function getPreferences(sessionId: string, partner: PartnerKey): Promise<PartnerPreferences | null> {
  const { data, error } = await supabase
    .from('preferences')
    .select('moods, mood_note, languages, content_type, min_rating, eras')
    .eq('session_id', sessionId)
    .eq('partner', partner)
    .maybeSingle()
  if (error || !data) {
    if (error) logPersistenceFailure('getPreferences', error)
    return null
  }
  return {
    moods: data.moods as PartnerPreferences['moods'],
    moodNote: data.mood_note ?? '',
    languages: data.languages as PartnerPreferences['languages'],
    contentType: data.content_type,
    minRating: data.min_rating,
    eras: data.eras as PartnerPreferences['eras'],
  }
}

export async function saveSwipe(
  sessionId: string,
  partner: PartnerKey,
  round: number,
  titleId: string,
  direction: SwipeDirection,
): Promise<void> {
  const { error } = await supabase.from('swipes').upsert(
    { session_id: sessionId, partner, round, title_id: titleId, direction },
    { onConflict: 'session_id,partner,round,title_id' },
  )
  if (error) logPersistenceFailure('saveSwipe', error)
}

export async function getSwipesForRound(
  sessionId: string,
  round: number,
): Promise<Array<{ partner: PartnerKey; titleId: string; direction: SwipeDirection }>> {
  const { data, error } = await supabase.from('swipes').select('partner, title_id, direction').eq('session_id', sessionId).eq('round', round)
  if (error || !data) {
    if (error) logPersistenceFailure('getSwipesForRound', error)
    return []
  }
  return data.map((row) => ({ partner: row.partner, titleId: row.title_id, direction: row.direction }))
}

/**
 * Insert-or-fetch: tries to record the match; if the other partner's device
 * already recorded the same (session, round) match a moment earlier, the
 * unique constraint rejects this insert and we just read their row back
 * instead of treating it as a failure.
 */
export async function tryInsertMatch(sessionId: string, title: Title, round: number): Promise<{ id: string; title: Title } | null> {
  const { data, error } = await supabase
    .from('matches')
    .insert({ session_id: sessionId, title_id: title.id, title_snapshot: title, round })
    .select('id, title_snapshot')
    .single()

  if (!error && data) return { id: data.id, title: data.title_snapshot as Title }

  if (error?.code === UNIQUE_VIOLATION) return getMatchForRound(sessionId, round)

  logPersistenceFailure('tryInsertMatch', error)
  return null
}

export async function getMatchForRound(sessionId: string, round: number): Promise<{ id: string; title: Title } | null> {
  const { data, error } = await supabase.from('matches').select('id, title_snapshot').eq('session_id', sessionId).eq('round', round).maybeSingle()
  if (error || !data) {
    if (error) logPersistenceFailure('getMatchForRound', error)
    return null
  }
  return { id: data.id, title: data.title_snapshot as Title }
}

export async function saveRating(matchId: string, rating: number): Promise<void> {
  const { error } = await supabase.from('matches').update({ rating, rated_at: new Date().toISOString() }).eq('id', matchId)
  if (error) logPersistenceFailure('saveRating', error)
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase.from('matches').select('id, title_snapshot, matched_at, rating').order('matched_at', { ascending: false }).limit(50)
  if (error || !data) {
    if (error) logPersistenceFailure('getHistory', error)
    return []
  }
  return data.map((row) => ({
    id: row.id,
    title: row.title_snapshot as Title,
    matchedAt: row.matched_at,
    rating: row.rating,
    partnerALabel: 'You',
    partnerBLabel: 'Partner',
  }))
}

interface SessionActivityHandlers {
  onSessionUpdate?: (row: SessionRow) => void
  onPreferenceInsert?: (partner: PartnerKey) => void
  onSwipeInsert?: (row: { partner: PartnerKey; round: number; titleId: string; direction: SwipeDirection }) => void
  onMatchInsert?: (row: { id: string; titleId: string; title: Title; round: number }) => void
}

/** One realtime channel per session covering every table the other partner's device can change. */
export function subscribeToSessionActivity(sessionId: string, handlers: SessionActivityHandlers): RealtimeChannel {
  return supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
      (payload) => handlers.onSessionUpdate?.(payload.new as SessionRow),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'preferences', filter: `session_id=eq.${sessionId}` },
      (payload) => handlers.onPreferenceInsert?.((payload.new as { partner: PartnerKey }).partner),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'swipes', filter: `session_id=eq.${sessionId}` },
      (payload) => {
        const row = payload.new as { partner: PartnerKey; round: number; title_id: string; direction: SwipeDirection }
        handlers.onSwipeInsert?.({ partner: row.partner, round: row.round, titleId: row.title_id, direction: row.direction })
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'matches', filter: `session_id=eq.${sessionId}` },
      (payload) => {
        const row = payload.new as { id: string; title_id: string; title_snapshot: Title; round: number }
        handlers.onMatchInsert?.({ id: row.id, titleId: row.title_id, title: row.title_snapshot, round: row.round })
      },
    )
    .subscribe()
}

export function unsubscribeChannel(channel: RealtimeChannel | null | undefined): void {
  if (channel) void supabase.removeChannel(channel)
}
