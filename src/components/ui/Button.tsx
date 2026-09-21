import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-ember-400 to-ember-600 text-ink-950 font-semibold shadow-glow hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100',
  secondary:
    'bg-ink-700/80 text-parchment-100 border border-ink-500 hover:bg-ink-600/80 active:bg-ink-700 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-parchment-200 hover:bg-ink-800/70 active:bg-ink-700/70 disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'bg-rose-600/90 text-parchment-100 hover:bg-rose-500 active:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`btn-focus inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 ease-out ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
