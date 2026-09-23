import { useMemo } from 'react'
import { PosterImage } from './PosterImage'
import { MOCK_TITLES } from '../../data/movies.ts'
import type { Title } from '../../types.ts'

interface PosterMosaicProps {
  /** Real titles to feature (e.g. the session's own pool) — falls back to the curated catalogue. */
  titles?: Title[]
  tileCount?: number
  className?: string
}

/** Decorative, blurred poster grid used behind hero/reveal moments. Never interactive,
 *  never the only source of a real title's artwork — purely ambience. */
export function PosterMosaic({ titles, tileCount = 18, className = '' }: PosterMosaicProps) {
  const tiles = useMemo(() => {
    const source = titles && titles.length > 0 ? titles : MOCK_TITLES
    const out: Title[] = []
    for (let i = 0; i < tileCount; i++) out.push(source[i % source.length])
    return out
  }, [titles, tileCount])

  return (
    <div className={`poster-mosaic ${className}`} aria-hidden="true">
      {tiles.map((title, i) => (
        <div key={`${title.id}-${i}`} className="aspect-[2/3] overflow-hidden rounded-md">
          <PosterImage seed={title.posterSeed} url={title.posterUrl} title={title.name} className="h-full w-full" />
        </div>
      ))}
    </div>
  )
}
