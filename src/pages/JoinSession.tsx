import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { PreferencesForm } from '../components/PreferencesForm'
import { StepIndicator } from '../components/ui/StepIndicator'
import { PicksSummary } from '../components/ui/PicksSummary'
import { useSession } from '../state/SessionContext'
import { emptyPreferences } from '../types'

export default function JoinSession() {
  const navigate = useNavigate()
  const { code = '' } = useParams<{ code: string }>()
  const { joinSession, submitGuestPreferences, dbSessionId, prefsB, joinError, match, pool } = useSession()
  const [resolving, setResolving] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [livePrefs, setLivePrefs] = useState(emptyPreferences)

  useEffect(() => {
    let active = true
    joinSession(code).finally(() => {
      if (active) setResolving(false)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  useEffect(() => {
    if (match) navigate('/match')
    else if (pool.length > 0) navigate('/swipe')
  }, [match, pool.length, navigate])

  if (resolving) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400 motion-reduce:animate-none motion-reduce:border-t-ink-600" />
          <p className="font-display text-lg text-parchment-100">Joining session…</p>
          <p className="text-xs text-parchment-300/50">Code: {code}</p>
        </div>
      </Screen>
    )
  }

  if (joinError || !dbSessionId) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="alert">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 8v5M12 16h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-parchment-100">Link not valid</h1>
          <p className="max-w-xs text-sm text-parchment-300/70">{joinError ?? "This invite link isn't valid or has expired."}</p>
          <Button onClick={() => navigate('/')}>Back to start</Button>
        </div>
      </Screen>
    )
  }

  if (prefsB) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400 motion-reduce:animate-none motion-reduce:border-t-ink-600" />
          <p className="font-display text-lg text-parchment-100">Finding titles you&apos;ll both like…</p>
          <p className="max-w-xs text-sm text-parchment-300/65">Matching moods, languages, and ratings from both of your profiles.</p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      wide
      side={
        <div className="flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-2xl border border-sage-500/30 bg-sage-500/10 px-4 py-3 text-sm font-medium text-sage-400"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-sage-400" aria-hidden="true" />
            You&apos;re connected to your partner&apos;s session
          </motion.div>
          <PicksSummary prefs={livePrefs} />
        </div>
      }
    >
      <header className="mb-6 mt-2">
        <StepIndicator current={1} className="mb-4" />
        <h1 className="font-display text-2xl font-semibold text-parchment-100">Your turn</h1>
        <p className="mt-1 text-sm text-parchment-300/70">Partner A can&apos;t see this. Answer for yourself.</p>
      </header>
      <PreferencesForm
        partnerLabel="Partner B"
        submitLabel="Find our titles"
        submitting={submitting}
        onPrefsChange={setLivePrefs}
        onSubmit={async (prefs) => {
          setSubmitting(true)
          await submitGuestPreferences(prefs)
        }}
      />
    </Screen>
  )
}
