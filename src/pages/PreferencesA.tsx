import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { PreferencesForm } from '../components/PreferencesForm'
import { useSession } from '../state/SessionContext'

export default function PreferencesA() {
  const navigate = useNavigate()
  const { submitHostPreferences } = useSession()

  return (
    <Screen>
      <header className="mb-6 mt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">Step 1 of 2 · Partner A</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-parchment-100">Set your preferences</h1>
        <p className="mt-1 text-sm text-parchment-300/70">
          Your partner will fill this out separately, without seeing your answers.
        </p>
      </header>
      <PreferencesForm
        partnerLabel="Partner A"
        submitLabel="Continue to invite"
        onSubmit={(prefs) => {
          submitHostPreferences(prefs)
          navigate('/invite')
        }}
      />
    </Screen>
  )
}
