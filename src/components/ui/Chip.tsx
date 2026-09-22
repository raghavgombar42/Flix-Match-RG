import type { ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  caveat?: string
}

export function Chip({ selected = false, caveat, className = '', children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`btn-focus relative inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.97] ${
        selected
          ? 'border-ember-400 bg-ember-500/20 text-ember-300 shadow-[0_0_0_1px_rgba(244,166,91,0.4)]'
          : 'border-ink-500 bg-ink-800/60 text-parchment-200 hover:border-ink-400 hover:bg-ink-700/60'
      } ${className}`}
      {...props}
    >
      <motion.span
        initial={false}
        animate={selected ? { width: 16, opacity: 1, marginRight: 2 } : { width: 0, opacity: 0, marginRight: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="flex shrink-0 items-center justify-center overflow-hidden motion-reduce:transition-none"
        aria-hidden="true"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.span>
      {children}
      {caveat && <span className="text-[11px] font-normal text-parchment-300/60 italic">{caveat}</span>}
    </button>
  )
}
