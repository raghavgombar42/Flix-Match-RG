import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { PreferencesForm } from '../components/PreferencesForm'
import { useSession } from '../state/SessionContext'

export default function JoinSession() {
  const navigate = useNavigate()
  const { code = '' } = useParams<{ code: string }>()
  const { joinSession, submitGuestPreferences, dbSessionId, prefsB, joinError, match, pool } = useSession()
  const [resolving, setResolving] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400" />
          <p className="font-display text-lg text-parchment-100">Joining session…</p>
        </div>
      </Screen>
    )
  }

  if (joinError || !dbSessionId) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
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
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400" />
          <p className="font-display text-lg text-parchment-100">Finding titles you&apos;ll both like…</p>
          <p className="max-w-xs text-sm text-parchment-300/65">Matching moods, languages, and ratings from both of your profiles.</p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <header className="mb-6 mt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">Step 2 of 2 · Partner B</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-parchment-100">Your turn</h1>
        <p className="mt-1 text-sm text-parchment-300/70">Partner A can&apos;t see this. Answer for yourself.</p>
      </header>
      <PreferencesForm
        partnerLabel="Partner B"
        submitLabel="Find our titles"
        submitting={submitting}
        onSubmit={async (prefs) => {
          setSubmitting(true)
          await submitGuestPreferences(prefs)
        }}
      />
    </Screen>
  )
}
