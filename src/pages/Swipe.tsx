import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { SwipeDeck } from '../components/swipe/SwipeDeck'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PosterImage } from '../components/ui/PosterImage'
import { useSession } from '../state/SessionContext'

export default function Swipe() {
  const navigate = useNavigate()
  const { pool, cursor, progress, round, isLoadingPool, match, swipe, dbSessionId, partnerFinishedRound } = useSession()

  useEffect(() => {
    if (!dbSessionId) {
      navigate('/', { replace: true })
    }
  }, [dbSessionId, navigate])

  useEffect(() => {
    if (match) {
      navigate('/match')
    }
  }, [match, navigate])

  const iAmDone = pool.length > 0 && cursor >= pool.length

  useEffect(() => {
    if (!isLoadingPool && iAmDone && partnerFinishedRound && !match) {
      navigate('/no-match')
    }
  }, [iAmDone, partnerFinishedRound, isLoadingPool, match, navigate])

  const upcoming = pool.slice(cursor)

  if (isLoadingPool) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400 motion-reduce:animate-none motion-reduce:border-t-ink-600" />
          <p className="font-display text-lg text-parchment-100">Finding titles you&apos;ll both like…</p>
          <p className="max-w-xs text-sm text-parchment-300/65">
            Matching moods, languages, and ratings from both of your profiles. Up to 30 titles, picked just for
            tonight.
          </p>
        </div>
      </Screen>
    )
  }

  // Only reachable if live title fetching genuinely came back empty (e.g. TMDB
  // unreachable) — a distinct, honest error state rather than a spinner that
  // never resolves.
  if (pool.length === 0) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="alert">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 8v5M12 16h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-semibold text-parchment-100">Couldn&apos;t load titles</h1>
          <p className="max-w-xs text-sm text-parchment-300/70">
            We couldn&apos;t reach our title database just now. Please try again in a moment.
          </p>
        </div>
      </Screen>
    )
  }

  if (iAmDone && !partnerFinishedRound) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-ember-400 motion-reduce:hidden" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-ember-400" />
          </span>
          <p className="font-display text-lg text-parchment-100">Waiting for your partner to finish…</p>
          <p className="max-w-xs text-sm text-parchment-300/65">
            You&apos;ve swiped through all {pool.length}. We&apos;ll reveal a match the moment you both like the same
            one.
          </p>
        </div>
      </Screen>
    )
  }

  const nextUp = upcoming.slice(1, 4)

  return (
    <Screen
      wide
      contentClassName="justify-start"
      side={
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-parchment-100">Up next</h2>
            <p className="mt-1 text-sm text-parchment-300/65">A peek at what&apos;s coming after this one.</p>
          </div>
          {nextUp.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {nextUp.map((title) => (
                <div key={title.id} className="flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-800/40 p-2">
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg">
                    <PosterImage seed={title.posterSeed} url={title.posterUrl} title={title.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-parchment-100">{title.name}</p>
                    <p className="text-xs text-parchment-300/55">
                      ★ {title.imdbRating.toFixed(1)} · {title.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-parchment-300/50">You&apos;re near the end of this round.</p>
          )}
        </div>
      }
    >
      <div className="mb-5 mt-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">
            {round === 1 ? 'Round 1' : 'Round 2 · Refined for you'}
          </p>
        </div>
        <ProgressBar current={progress.current} total={progress.total} label="Swiping" />
      </div>

      <SwipeDeck upcoming={upcoming} onSwipe={(title, direction) => swipe(title, direction)} />

      <p className="mx-auto mt-6 max-w-xs text-center text-xs text-parchment-300/50 lg:max-w-none">
        Swipe right or tap the heart to like. Swipe left or tap the cross to pass. Arrow keys work too.
      </p>
    </Screen>
  )
}
