interface Option<T extends string> {
  value: T
  label: string
  caveat?: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  name: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, name }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`btn-focus flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.97] ${
              selected
                ? 'border-ember-400 bg-ember-500/20 text-ember-300 shadow-[0_0_0_1px_rgba(244,166,91,0.4)]'
                : 'border-ink-500 bg-ink-800/60 text-parchment-200 hover:border-ink-400 hover:bg-ink-700/60'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${selected ? 'bg-ember-400' : 'bg-transparent'}`}
              />
              {option.label}
            </span>
            {option.caveat && <span className="text-[10.5px] font-normal text-parchment-300/55 italic">{option.caveat}</span>}
          </button>
        )
      })}
    </div>
  )
}
