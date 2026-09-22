const STEPS = ['Preferences', 'Invite', 'Discover']

interface StepIndicatorProps {
  current: 1 | 2 | 3
  className?: string
}

export function StepIndicator({ current, className = '' }: StepIndicatorProps) {
  return (
    <ol className={`flex items-center ${className}`} aria-label="Session progress">
      {STEPS.map((label, i) => {
        const step = i + 1
        const state = step < current ? 'done' : step === current ? 'active' : 'upcoming'
        return (
          <li key={label} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  state === 'active'
                    ? 'bg-ember-400 text-ink-950'
                    : state === 'done'
                      ? 'border border-ember-400/50 bg-ember-500/20 text-ember-300'
                      : 'border border-ink-500 bg-ink-700 text-parchment-300/50'
                }`}
                aria-hidden="true"
              >
                {state === 'done' ? '✓' : step}
              </span>
              <span className={`text-xs font-medium ${state === 'upcoming' ? 'text-parchment-300/40' : 'text-parchment-200'}`}>{label}</span>
            </div>
            {step < STEPS.length && <span className="mx-2 h-px w-4 shrink-0 bg-ink-500 sm:w-6" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
