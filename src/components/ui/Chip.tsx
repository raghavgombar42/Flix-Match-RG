import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  caveat?: string
}

export function Chip({ selected = false, caveat, className = '', children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`btn-focus relative inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
        selected
          ? 'border-ember-400/70 bg-ember-500/15 text-ember-400 shadow-[0_0_0_1px_rgba(244,166,91,0.25)]'
          : 'border-ink-500 bg-ink-800/60 text-parchment-200 hover:border-ink-400 hover:bg-ink-700/60'
      } ${className}`}
      {...props}
    >
      {children}
      {caveat && (
        <span className="text-[11px] font-normal text-parchment-300/60 italic">{caveat}</span>
      )}
    </button>
  )
}
