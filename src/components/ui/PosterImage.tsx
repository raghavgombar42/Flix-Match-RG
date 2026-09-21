import { useMemo, useState } from 'react'

interface PosterImageProps {
  seed: string
  title: string
  /** Real poster URL (e.g. from TMDB) to try before the picsum placeholder. */
  url?: string | null
  className?: string
  priority?: boolean
}

const GRADIENTS = [
  'from-ember-700 via-ink-800 to-ink-950',
  'from-rose-700 via-ink-800 to-ink-950',
  'from-sage-500/60 via-ink-800 to-ink-950',
  'from-ember-600 via-rose-700/60 to-ink-950',
]

function gradientFor(seed: string) {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

export function PosterImage({ seed, title, url, className = '', priority = false }: PosterImageProps) {
  const sources = useMemo(() => {
    const list: string[] = []
    if (url) list.push(url)
    list.push(`https://picsum.photos/seed/${encodeURIComponent(seed)}/600/900`)
    return list
  }, [url, seed])
  const [attempt, setAttempt] = useState(0)

  if (attempt >= sources.length) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(seed)} ${className}`}
        role="img"
        aria-label={`Poster unavailable for ${title}`}
      >
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-70">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" className="text-parchment-100" />
            <path d="M2.5 8.5h19M7 4.5v4M17 4.5v4" stroke="currentColor" strokeWidth="1.4" className="text-parchment-100" />
          </svg>
          <p className="font-display text-base leading-snug text-parchment-100/90 text-balance">{title}</p>
        </div>
      </div>
    )
  }

  return (
    <img
      key={sources[attempt]}
      src={sources[attempt]}
      alt={`${title} poster`}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setAttempt((a) => a + 1)}
      className={`bg-ink-800 object-cover ${className}`}
    />
  )
}
