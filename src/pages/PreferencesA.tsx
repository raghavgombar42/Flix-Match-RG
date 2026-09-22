import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { PreferencesForm } from '../components/PreferencesForm'
import { StepIndicator } from '../components/ui/StepIndicator'
import { PicksSummary } from '../components/ui/PicksSummary'
import { useSession } from '../state/SessionContext'
import { emptyPreferences } from '../types'

export default function PreferencesA() {
  const navigate = useNavigate()
  const { submitHostPreferences } = useSession()
  const [livePrefs, setLivePrefs] = useState(emptyPreferences)

  return (
    <Screen
      wide
      side={
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-parchment-100">Where you&apos;re headed</h2>
            <p className="mt-1 text-sm text-parchment-300/65">
              Once you submit, you&apos;ll get a QR code and link to bring your partner in — they answer the same
              questions privately, then you both swipe.
            </p>
          </div>
          <PicksSummary prefs={livePrefs} />
        </div>
      }
    >
      <header className="mb-6 mt-2">
        <StepIndicator current={1} className="mb-4" />
        <h1 className="font-display text-2xl font-semibold text-parchment-100">Set your preferences</h1>
        <p className="mt-1 text-sm text-parchment-300/70">Your partner will fill this out separately, without seeing your answers.</p>
      </header>
      <PreferencesForm
        partnerLabel="Partner A"
        submitLabel="Continue to invite"
        onPrefsChange={setLivePrefs}
        onSubmit={(prefs) => {
          submitHostPreferences(prefs)
          navigate('/invite')
        }}
      />
    </Screen>
  )
}
