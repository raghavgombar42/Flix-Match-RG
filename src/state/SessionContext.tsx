import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { generateSearchBrief, refinePoolForRoundTwo } from '../services/aiService'
import { fetchTitlePool, shuffleForPartner } from '../services/tmdbService'
import {
  claimSessionTransition,
  createSession,
  getPreferences,
  getSessionByCode,
  getSwipesForRound,
  saveRating,
  savePreferences,
  saveSwipe,
  subscribeToSessionActivity,
  tryInsertMatch,
  unsubscribeChannel,
  type SessionRow,
} from '../services/supabaseService'
import type { PartnerKey, PartnerPreferences, SwipeDirection, Title } from '../types'

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

interface SessionState {
  role: PartnerKey | null
  sessionId: string
  dbSessionId: string | null
  inviteLink: string
  prefsA: PartnerPreferences | null
  prefsB: PartnerPreferences | null
  round: 1 | 2
  pool: Title[]
  cursor: number
  seenIds: string[]
  yourLikeIds: Set<string>
  partnerLikeIds: Set<string>
  partnerSwipedIds: Set<string>
  allYourLikes: Title[]
  allPartnerLikes: Title[]
  match: { title: Title; round: 1 | 2 } | null
  matchDbId: string | null
  topFive: Title[] | null
  isLoadingPool: boolean
  briefSummary: string | null
  joinError: string | null
  /** Ephemeral realtime presence — is the other partner's tab currently open on this session. */
  partnerOnline: boolean
}

function freshState(): SessionState {
  const sessionId = randomCode()
  return {
    role: null,
    sessionId,
    dbSessionId: null,
    inviteLink: `${window.location.origin}${window.location.pathname}#/join/${sessionId}`,
    prefsA: null,
    prefsB: null,
    round: 1,
    pool: [],
    cursor: 0,
    seenIds: [],
    yourLikeIds: new Set(),
    partnerLikeIds: new Set(),
    partnerSwipedIds: new Set(),
    allYourLikes: [],
    allPartnerLikes: [],
    match: null,
    matchDbId: null,
    topFive: null,
    isLoadingPool: false,
    briefSummary: null,
    joinError: null,
    partnerOnline: false,
  }
}

type Action =
  | { type: 'SET_GUEST_SESSION'; sessionId: string; row: SessionRow }
  | { type: 'SET_JOIN_ERROR'; message: string }
  | { type: 'SET_DB_SESSION'; row: SessionRow }
  | { type: 'SET_PREFS'; partner: PartnerKey; prefs: PartnerPreferences }
  | { type: 'SET_LOADING_POOL'; loading: boolean }
  | { type: 'SET_ROUND_POOL'; pool: Title[]; round: 1 | 2; briefSummary: string }
  | { type: 'SWIPE'; title: Title; direction: SwipeDirection }
  | { type: 'PARTNER_SWIPE'; titleId: string; direction: SwipeDirection; title?: Title }
  | { type: 'SET_MATCH'; title: Title; round: 1 | 2 }
  | { type: 'SET_MATCH_DB_ID'; id: string }
  | { type: 'SET_TOP_FIVE'; titles: Title[] }
  | { type: 'SET_PARTNER_ONLINE'; online: boolean }
  | { type: 'RESET' }

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'SET_GUEST_SESSION':
      return {
        ...state,
        role: 'B',
        sessionId: action.sessionId,
        dbSessionId: action.row.id,
        inviteLink: `${window.location.origin}${window.location.pathname}#/join/${action.sessionId}`,
        round: (action.row.round as 1 | 2) ?? 1,
        joinError: null,
      }
    case 'SET_JOIN_ERROR':
      return { ...state, joinError: action.message }
    case 'SET_DB_SESSION':
      return { ...state, dbSessionId: action.row.id }
    case 'SET_PREFS':
      return action.partner === 'A' ? { ...state, prefsA: action.prefs, role: state.role ?? 'A' } : { ...state, prefsB: action.prefs }
    case 'SET_LOADING_POOL':
      return { ...state, isLoadingPool: action.loading }
    case 'SET_ROUND_POOL':
      return {
        ...state,
        pool: action.pool,
        round: action.round,
        cursor: 0,
        yourLikeIds: new Set(),
        partnerLikeIds: new Set(),
        partnerSwipedIds: new Set(),
        seenIds: [...state.seenIds, ...action.pool.map((t) => t.id)],
        isLoadingPool: false,
        briefSummary: action.briefSummary,
        match: null,
        matchDbId: null,
        topFive: null,
      }
    case 'SWIPE': {
      const nextCursor = state.cursor + 1
      if (action.direction === 'pass') return { ...state, cursor: nextCursor }
      const yourLikeIds = new Set(state.yourLikeIds)
      yourLikeIds.add(action.title.id)
      return { ...state, cursor: nextCursor, yourLikeIds, allYourLikes: [...state.allYourLikes, action.title] }
    }
    case 'PARTNER_SWIPE': {
      const partnerSwipedIds = new Set(state.partnerSwipedIds)
      partnerSwipedIds.add(action.titleId)
      if (action.direction === 'pass') return { ...state, partnerSwipedIds }
      const partnerLikeIds = new Set(state.partnerLikeIds)
      partnerLikeIds.add(action.titleId)
      const title = action.title ?? state.pool.find((t) => t.id === action.titleId)
      return {
        ...state,
        partnerSwipedIds,
        partnerLikeIds,
        allPartnerLikes: title ? [...state.allPartnerLikes, title] : state.allPartnerLikes,
      }
    }
    case 'SET_MATCH':
      return state.match ? state : { ...state, match: { title: action.title, round: action.round } }
    case 'SET_MATCH_DB_ID':
      return { ...state, matchDbId: action.id }
    case 'SET_TOP_FIVE':
      return state.topFive ? state : { ...state, topFive: action.titles }
    case 'SET_PARTNER_ONLINE':
      return state.partnerOnline === action.online ? state : { ...state, partnerOnline: action.online }
    case 'RESET':
      return freshState()
    default:
      return state
  }
}

interface SessionContextValue extends SessionState {
  submitHostPreferences: (prefs: PartnerPreferences) => void
  joinSession: (code: string) => Promise<void>
  submitGuestPreferences: (prefs: PartnerPreferences) => Promise<void>
  swipe: (title: Title, direction: SwipeDirection) => void
  currentCard: Title | null
  progress: { current: number; total: number }
  partnerFinishedRound: boolean
  finishRoundWithNoMatch: () => Promise<'round-two' | 'top-five'>
  pickFinalTitle: (title: Title) => Promise<void>
  rateActiveMatch: (rating: number) => Promise<void>
  startNewSession: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, freshState)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const applyRoundPool = useCallback((pool: Title[], round: 1 | 2, briefSummary: string) => {
    dispatch({ type: 'SET_ROUND_POOL', pool, round, briefSummary })
    const dbId = stateRef.current.dbSessionId
    const myRole = stateRef.current.role
    if (!dbId) return
    const byId = new Map(pool.map((t) => [t.id, t]))
    void getSwipesForRound(dbId, round).then((rows) => {
      rows
        .filter((r) => r.partner !== myRole)
        .forEach((r) => dispatch({ type: 'PARTNER_SWIPE', titleId: r.titleId, direction: r.direction, title: byId.get(r.titleId) }))
    })
  }, [])

  /** Either partner can call this once both preference rows exist — Postgres resolves the race. */
  const attemptGeneratePool = useCallback(async () => {
    const s = stateRef.current
    if (!s.dbSessionId || !s.prefsA || !s.prefsB || s.pool.length > 0) return
    const brief = await generateSearchBrief(s.prefsA, s.prefsB)
    const pool = await fetchTitlePool({ prefsA: s.prefsA, prefsB: s.prefsB, seed: Date.now() })
    const claimed = await claimSessionTransition(
      s.dbSessionId,
      { round: 1, status: 'collecting_preferences' },
      { round: 1, status: 'swiping', pool },
    )
    if (claimed) applyRoundPool(pool, 1, brief.summary)
    // If we lost the race, the realtime session-update handler picks up the winner's pool.
  }, [applyRoundPool])

  const attemptAdvanceRound = useCallback(async () => {
    const s = stateRef.current
    if (!s.dbSessionId || !s.prefsA || !s.prefsB) return
    if (s.round === 1) {
      const brief = await refinePoolForRoundTwo([...s.allYourLikes, ...s.allPartnerLikes])
      const pool = await fetchTitlePool({ prefsA: s.prefsA, prefsB: s.prefsB, excludeIds: s.seenIds, seed: Date.now() })
      const claimed = await claimSessionTransition(
        s.dbSessionId,
        { round: 1, status: 'swiping' },
        { round: 2, status: 'swiping', pool },
      )
      if (claimed) applyRoundPool(pool, 2, brief.summary)
    } else {
      const combined = new Map<string, { title: Title; score: number }>()
      ;[...s.allYourLikes, ...s.allPartnerLikes].forEach((title) => {
        const existing = combined.get(title.id)
        combined.set(title.id, { title, score: (existing?.score ?? 0) + 1 })
      })
      const top = Array.from(combined.values())
        .sort((a, b) => b.score - a.score || b.title.imdbRating - a.title.imdbRating)
        .slice(0, 5)
        .map((entry) => entry.title)
      const fallback = top.length > 0 ? top : shuffleForPartner(s.pool, Date.now()).slice(0, 5)
      const claimed = await claimSessionTransition(
        s.dbSessionId,
        { round: 2, status: 'swiping' },
        { round: 2, status: 'top_five', pool: fallback },
      )
      if (claimed) dispatch({ type: 'SET_TOP_FIVE', titles: fallback })
    }
  }, [applyRoundPool])

  // One realtime channel per DB session, covering every table the other partner's device can change.
  useEffect(() => {
    const dbId = state.dbSessionId
    if (!dbId) return
    const channel = subscribeToSessionActivity(dbId, state.role, {
      onPresenceChange: (otherPartnerOnline) => dispatch({ type: 'SET_PARTNER_ONLINE', online: otherPartnerOnline }),
      onPreferenceInsert: (partner) => {
        const s = stateRef.current
        if (partner === s.role) return
        void getPreferences(dbId, partner).then((prefs) => {
          if (prefs) dispatch({ type: 'SET_PREFS', partner, prefs })
          void attemptGeneratePool()
        })
      },
      onSwipeInsert: ({ partner, round, titleId, direction }) => {
        const s = stateRef.current
        if (partner === s.role || round !== s.round) return
        const title = s.pool.find((t) => t.id === titleId)
        dispatch({ type: 'PARTNER_SWIPE', titleId, direction, title })
        if (direction === 'like' && title && s.yourLikeIds.has(titleId)) {
          void tryInsertMatch(dbId, title, s.round)
        }
      },
      onMatchInsert: ({ id, title, round }) => {
        dispatch({ type: 'SET_MATCH', title, round: round as 1 | 2 })
        dispatch({ type: 'SET_MATCH_DB_ID', id })
      },
      onSessionUpdate: (row) => {
        const s = stateRef.current
        if (row.status === 'swiping' && (row.round > s.round || (row.round === s.round && s.pool.length === 0))) {
          const titles = shuffleForPartner(row.pool, Date.now())
          applyRoundPool(titles, row.round as 1 | 2, 'Refined for both of you.')
        } else if (row.status === 'top_five' && !s.topFive) {
          dispatch({ type: 'SET_TOP_FIVE', titles: shuffleForPartner(row.pool, Date.now()) })
        }
      },
    })
    return () => unsubscribeChannel(channel)
  }, [state.dbSessionId, state.role, applyRoundPool, attemptGeneratePool])

  const submitHostPreferences = useCallback(
    (prefs: PartnerPreferences) => {
      dispatch({ type: 'SET_PREFS', partner: 'A', prefs })
      void createSession(state.sessionId).then((row) => {
        if (!row) return
        dispatch({ type: 'SET_DB_SESSION', row })
        void savePreferences(row.id, 'A', prefs)
      })
    },
    [state.sessionId],
  )

  const joinSession = useCallback(async (code: string) => {
    const row = await getSessionByCode(code)
    if (!row) {
      dispatch({ type: 'SET_JOIN_ERROR', message: "This invite link isn't valid or has expired." })
      return
    }
    dispatch({ type: 'SET_GUEST_SESSION', sessionId: code, row })
    const prefsA = await getPreferences(row.id, 'A')
    if (prefsA) dispatch({ type: 'SET_PREFS', partner: 'A', prefs: prefsA })
    if (row.status === 'swiping' && row.pool.length > 0) {
      applyRoundPool(shuffleForPartner(row.pool, Date.now()), row.round as 1 | 2, 'Matching moods, languages, and ratings from both of your profiles.')
    } else if (row.status === 'top_five' && row.pool.length > 0) {
      dispatch({ type: 'SET_TOP_FIVE', titles: shuffleForPartner(row.pool, Date.now()) })
    }
  }, [applyRoundPool])

  const submitGuestPreferences = useCallback(
    async (prefs: PartnerPreferences) => {
      dispatch({ type: 'SET_PREFS', partner: 'B', prefs })
      dispatch({ type: 'SET_LOADING_POOL', loading: true })
      const dbId = stateRef.current.dbSessionId
      if (dbId) await savePreferences(dbId, 'B', prefs)
      await attemptGeneratePool()
    },
    [attemptGeneratePool],
  )

  const swipe = useCallback((title: Title, direction: SwipeDirection) => {
    dispatch({ type: 'SWIPE', title, direction })
    const s = stateRef.current
    if (!s.dbSessionId) return
    void saveSwipe(s.dbSessionId, s.role ?? 'A', s.round, title.id, direction)
    if (direction === 'like' && s.partnerLikeIds.has(title.id)) {
      void tryInsertMatch(s.dbSessionId, title, s.round)
    }
  }, [])

  const finishRoundWithNoMatch = useCallback(async (): Promise<'round-two' | 'top-five'> => {
    const outcome = stateRef.current.round === 1 ? 'round-two' : 'top-five'
    await attemptAdvanceRound()
    return outcome
  }, [attemptAdvanceRound])

  const pickFinalTitle = useCallback(async (title: Title) => {
    const s = stateRef.current
    if (!s.dbSessionId) return
    const result = await tryInsertMatch(s.dbSessionId, title, s.round)
    if (result) {
      dispatch({ type: 'SET_MATCH', title: result.title, round: s.round })
      dispatch({ type: 'SET_MATCH_DB_ID', id: result.id })
    }
  }, [])

  const rateActiveMatch = useCallback(async (rating: number) => {
    if (stateRef.current.matchDbId) await saveRating(stateRef.current.matchDbId, rating)
  }, [])

  const startNewSession = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const currentCard = state.pool[state.cursor] ?? null
  const progress = { current: Math.min(state.cursor + 1, state.pool.length), total: state.pool.length }
  const partnerFinishedRound = state.pool.length > 0 && state.partnerSwipedIds.size >= state.pool.length

  const value: SessionContextValue = {
    ...state,
    submitHostPreferences,
    joinSession,
    submitGuestPreferences,
    swipe,
    currentCard,
    progress,
    partnerFinishedRound,
    finishRoundWithNoMatch,
    pickFinalTitle,
    rateActiveMatch,
    startNewSession,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
