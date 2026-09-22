import type { PartnerPreferences } from '../../types'

interface PicksSummaryProps {
  prefs: PartnerPreferences
  className?: string
  compact?: boolean
}

const RATING_LABEL: Record<number, string> = { 6: '6+', 7: '7+', 8: '8+', 9: '9+' }

/** Compact rundown of the in-progress preference selections — used as the mobile pre-submit
 * summary and reused verbatim as the desktop side panel content. */
export function PicksSummary({ prefs, className = '', compact = false }: PicksSummaryProps) {
  const hasAny = prefs.moods.length > 0 || prefs.languages.length > 0 || prefs.eras.length > 0
  const tags = [
    ...prefs.moods,
    ...prefs.languages,
    ...prefs.eras,
    prefs.contentType === 'movies' ? 'Movies only' : 'Include series',
    `${RATING_LABEL[prefs.minRating]} rating`,
  ]

  return (
    <div className={`rounded-2xl border border-ink-600 bg-ink-800/60 ${compact ? 'p-3' : 'p-4'} ${className}`}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-parchment-300/55">Your picks</p>
      {!hasAny ? (
        <p className="text-sm text-parchment-300/45">Nothing selected yet — start with mood.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={`${tag}-${i}`} className="rounded-full bg-ink-700/80 px-2.5 py-1 text-[11px] font-medium text-parchment-200">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
