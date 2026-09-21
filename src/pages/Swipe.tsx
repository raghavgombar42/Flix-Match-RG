import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { SwipeDeck } from '../components/swipe/SwipeDeck'
import { ProgressBar } from '../components/ui/ProgressBar'
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

  if (isLoadingPool || pool.length === 0) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400" />
          <p className="font-display text-lg text-parchment-100">Finding titles you&apos;ll both like…</p>
          <p className="max-w-xs text-sm text-parchment-300/65">
            Matching moods, languages, and ratings from both of your profiles.
          </p>
        </div>
      </Screen>
    )
  }

  if (iAmDone && !partnerFinishedRound) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-ember-400" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-ember-400" />
          </span>
          <p className="font-display text-lg text-parchment-100">Waiting for your partner to finish…</p>
          <p className="max-w-xs text-sm text-parchment-300/65">
            You&apos;ve swiped through all {pool.length}. We&apos;ll reveal a match the moment you both like the same one.
          </p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen contentClassName="justify-start">
      <div className="mb-5 mt-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">
            {round === 1 ? 'Round 1' : 'Round 2 · Refined for you'}
          </p>
        </div>
        <ProgressBar current={progress.current} total={progress.total} label="Swiping" />
      </div>

      <SwipeDeck upcoming={upcoming} onSwipe={(title, direction) => swipe(title, direction)} />

      <p className="mx-auto mt-6 max-w-xs text-center text-xs text-parchment-300/50">
        Swipe right or tap the heart to like. Swipe left or tap the cross to pass. Arrow keys work too.
      </p>
    </Screen>
  )
}
