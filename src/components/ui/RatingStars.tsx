interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  readOnly?: boolean
}

export function RatingStars({ value, onChange, size = 'md', readOnly = false }: RatingStarsProps) {
  const dims = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7'
  return (
    <div className="flex items-center gap-1" role={readOnly ? undefined : 'radiogroup'} aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        if (readOnly) {
          return (
            <svg key={star} viewBox="0 0 24 24" className={`${dims} ${filled ? 'text-ember-400' : 'text-ink-500'}`} fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17l-5.9 3.4 1.3-6.6-4.9-4.5 6.6-.7z" />
            </svg>
          )
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange?.(star)}
            className={`btn-focus rounded-full p-0.5 transition-transform hover:scale-110 ${filled ? 'text-ember-400' : 'text-ink-500 hover:text-ink-400'}`}
          >
            <svg viewBox="0 0 24 24" className={dims} fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17l-5.9 3.4 1.3-6.6-4.9-4.5 6.6-.7z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
