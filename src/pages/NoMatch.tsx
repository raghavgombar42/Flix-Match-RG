import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { useSession } from '../state/SessionContext'

export default function NoMatch() {
  const navigate = useNavigate()
  const { round, topFive, finishRoundWithNoMatch } = useSession()
  const [loading, setLoading] = useState(false)
  const roundOnEntry = useRef(round).current

  // The other partner tapping their own "start round two" / "see top 5" button advances this
  // session's state too (via realtime) — follow it even if I never clicked anything myself.
  useEffect(() => {
    if (round !== roundOnEntry) navigate('/swipe')
    else if (topFive) navigate('/top-five')
  }, [round, roundOnEntry, topFive, navigate])

  async function handleContinue() {
    setLoading(true)
    await finishRoundWithNoMatch()
    setLoading(false)
  }

  return (
    <Screen contentClassName="justify-center">
      <div className="flex flex-col items-center gap-5 py-8 text-center lg:mx-auto lg:max-w-lg">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ink-500 bg-ink-800/70">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" className="text-parchment-300/60" />
            <path d="M9 9.5l6 5M15 9.5l-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-rose-400" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-parchment-100">No match this round</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-parchment-300/70 lg:max-w-sm">
            {round === 1
              ? 'You both swiped through all 30 without a shared like. We’ll sharpen the picks based on what you each responded to.'
              : 'Still no overlap after round two. Let’s narrow it down to the five titles you both leaned toward, so you can pick together.'}
          </p>
        </div>
        <Button size="lg" onClick={handleContinue} disabled={loading} className="mt-2 w-full max-w-xs">
          {loading ? 'Refining picks…' : round === 1 ? 'Start round two' : 'See top 5 picks'}
        </Button>
        <p className="text-xs text-parchment-300/45">Either of you can tap this — it&apos;ll sync for both.</p>
      </div>
    </Screen>
  )
}
