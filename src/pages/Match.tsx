import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { PosterImage } from '../components/ui/PosterImage'
import { OttBadge } from '../components/ui/OttBadge'
import { RatingStars } from '../components/ui/RatingStars'
import { useSession } from '../state/SessionContext'

export default function Match() {
  const navigate = useNavigate()
  const { match, rateActiveMatch, startNewSession } = useSession()
  const prefersReducedMotion = useReducedMotion()
  const [rating, setRating] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!match) navigate('/', { replace: true })
  }, [match, navigate])

  if (!match) {
    return (
      <Screen contentClassName="justify-center">
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" aria-live="polite">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400 motion-reduce:animate-none motion-reduce:border-t-ink-600" />
          <p className="font-display text-lg text-parchment-100">Loading your match…</p>
        </div>
      </Screen>
    )
  }

  const { title } = match

  async function handleRate(value: number) {
    setRating(value)
    await rateActiveMatch(value)
    setSaved(true)
  }

  const sidePanel = (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-parchment-100">Stream it now in India</h2>
        <div className="flex flex-col gap-2">
          {title.ottAvailability.map((listing) => (
            <OttBadge key={listing.platform} listing={listing} />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink-600 bg-ink-800/50 px-4 py-5 text-center">
        <h2 className="font-display text-base font-semibold text-parchment-100">Rate after watching</h2>
        <RatingStars value={rating} onChange={handleRate} />
        {saved && (
          <p className="text-xs text-sage-400" role="status">
            Saved to your history ✓
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          onClick={() => {
            startNewSession()
            navigate('/preferences/a')
          }}
        >
          Find another match
        </Button>
        <Button variant="ghost" onClick={() => navigate('/history')}>
          View history
        </Button>
      </div>
    </div>
  )

  return (
    <Screen wide contentClassName="justify-start" side={sidePanel}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 mt-3 flex flex-col items-center gap-1 text-center lg:items-start lg:text-left"
      >
        <span className="bg-gradient-to-r from-ember-400 via-rose-400 to-ember-400 bg-clip-text font-display text-3xl font-bold text-transparent">
          It&apos;s a match!
        </span>
        <p className="text-sm text-parchment-300/75">You both liked this one.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.92, y: prefersReducedMotion ? 0 : 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20, delay: prefersReducedMotion ? 0 : 0.1 }}
        className="overflow-hidden rounded-[28px] border border-ember-400/30 bg-ink-800 shadow-glow lg:flex lg:flex-row"
      >
        <div className="relative h-72 w-full shrink-0 lg:h-auto lg:w-72">
          <PosterImage seed={title.posterSeed} url={title.posterUrl} title={title.name} className="h-full w-full" priority />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/10 to-transparent lg:bg-gradient-to-r" />
        </div>
        <div className="flex flex-col gap-3 px-5 py-5">
          <div>
            <h1 className="font-display text-2xl font-semibold text-parchment-100">{title.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-parchment-300/75">
              <span className="font-semibold text-ember-400">★ {title.imdbRating.toFixed(1)} IMDb</span>
              <span>·</span>
              <span>{title.year}</span>
              <span>·</span>
              <span>{title.type === 'series' ? `${title.seasons} seasons` : `${title.runtimeMinutes} min`}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {title.genres.map((genre) => (
              <span key={genre} className="rounded-full bg-ink-700/70 px-2.5 py-0.5 text-[11px] font-medium text-parchment-300">
                {genre}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-parchment-300/85">{title.synopsis}</p>
        </div>
      </motion.div>

      {/* Mobile: streaming links, rating, and actions stack below the poster (side panel is desktop-only). */}
      <div className="mt-6 flex flex-col gap-6 lg:hidden">{sidePanel}</div>
    </Screen>
  )
}
