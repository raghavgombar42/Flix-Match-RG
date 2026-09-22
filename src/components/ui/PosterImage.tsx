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
  const [loaded, setLoaded] = useState(false)

  const failed = attempt >= sources.length

  return (
    <div className={`relative overflow-hidden bg-ink-800 ${className}`}>
      {/* Skeleton — visible until the image reports loaded, or permanently if every source failed. */}
      {(!loaded || failed) && (
        <div
          aria-hidden={!failed}
          className={`absolute inset-0 bg-ink-700 bg-[length:200%_100%] ${!failed ? 'animate-shimmer bg-gradient-to-r from-ink-700 via-ink-600/70 to-ink-700' : ''}`}
        />
      )}

      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={`Poster unavailable for ${title}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientFor(seed)}`} />
          <div className="relative flex flex-col items-center gap-3 px-6 text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-70">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" className="text-parchment-100" />
              <path d="M2.5 8.5h19M7 4.5v4M17 4.5v4" stroke="currentColor" strokeWidth="1.4" className="text-parchment-100" />
            </svg>
            <p className="font-display text-base leading-snug text-parchment-100/90 text-balance">{title}</p>
          </div>
        </div>
      ) : (
        <img
          key={sources[attempt]}
          src={sources[attempt]}
          alt={`${title} poster`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false)
            setAttempt((a) => a + 1)
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
