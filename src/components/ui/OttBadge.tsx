import type { OttListing } from '../../types'

interface OttBadgeProps {
  listing: OttListing
}

export function OttBadge({ listing }: OttBadgeProps) {
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noreferrer"
      className="btn-focus group flex items-center justify-between gap-3 rounded-xl border border-ink-500 bg-ink-800/70 px-4 py-3 transition-colors hover:border-ember-400/50 hover:bg-ink-700/70"
      style={{
        backgroundImage: `linear-gradient(120deg, ${listing.colorFrom}22, transparent 70%)`,
      }}
    >
      <span className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-parchment-100"
          style={{ background: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})` }}
        >
          {listing.platform
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)}
        </span>
        <span className="text-sm font-medium text-parchment-100">{listing.platform}</span>
      </span>
      <span className="text-xs font-semibold text-ember-400 opacity-90 transition-transform group-hover:translate-x-0.5">
        Open →
      </span>
    </a>
  )
}
