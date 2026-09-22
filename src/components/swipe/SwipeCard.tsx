import { useState } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'framer-motion'
import { PosterImage } from '../ui/PosterImage'
import type { Title } from '../../types'

interface SwipeCardProps {
  title: Title
  isTop: boolean
  stackIndex: number
  pendingDirection: 'like' | 'pass' | null
  onDragDecision: (direction: 'like' | 'pass') => void
}

const SWIPE_THRESHOLD = 110

export function SwipeCard({ title, isTop, stackIndex, pendingDirection, onDragDecision }: SwipeCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const [showDetails, setShowDetails] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], prefersReducedMotion ? [0, 0] : [-14, 14], { clamp: false })
  const likeOpacity = useTransform(x, [20, 120], [0, 1])
  const passOpacity = useTransform(x, [-120, -20], [1, 0])

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onDragDecision('like')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onDragDecision('pass')
    } else {
      animate(x, 0, prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  const scale = 1 - Math.min(stackIndex, 2) * 0.04
  const yOffset = Math.min(stackIndex, 2) * 14
  const canDrag = isTop && !pendingDirection && !showDetails

  const flyTarget = pendingDirection ? { x: pendingDirection === 'like' ? 500 : -500, opacity: 0 } : undefined

  return (
    <motion.article
      className="absolute inset-0 flex select-none flex-col overflow-hidden rounded-[28px] border border-ink-600/80 bg-ink-800 shadow-card"
      style={isTop ? { x, rotate } : undefined}
      initial={false}
      animate={isTop ? flyTarget : { scale, y: yOffset, opacity: stackIndex > 2 ? 0 : 1 - stackIndex * 0.15 }}
      transition={isTop && flyTarget ? { duration: prefersReducedMotion ? 0.12 : 0.32, ease: 'easeIn' } : undefined}
      drag={canDrag ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={isTop ? handleDragEnd : undefined}
      aria-hidden={!isTop}
    >
      <div className="relative h-[62%] w-full shrink-0 overflow-hidden">
        <PosterImage seed={title.posterSeed} url={title.posterUrl} title={title.name} className="h-full w-full" priority={isTop} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/10 to-transparent" />

        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute right-5 top-5 rotate-6 rounded-lg border-2 border-sage-400/90 px-3 py-1 text-base font-bold uppercase tracking-wide text-sage-400"
            >
              Like
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="pointer-events-none absolute left-5 top-5 -rotate-6 rounded-lg border-2 border-rose-400/90 px-3 py-1 text-base font-bold uppercase tracking-wide text-rose-400"
            >
              Pass
            </motion.div>
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              aria-label={`Full details for ${title.name}`}
              className="btn-focus absolute bottom-3 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/70 text-parchment-100 backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 11v5.5M12 8v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink-700/70 px-2.5 py-1 text-xs font-semibold text-ember-400">★ {title.imdbRating.toFixed(1)}</span>
          <span className="rounded-full bg-ink-700/70 px-2.5 py-1 text-xs font-medium text-parchment-300">{title.year}</span>
          <span className="rounded-full bg-ink-700/70 px-2.5 py-1 text-xs font-medium text-parchment-300">
            {title.type === 'series' ? `${title.seasons} seasons` : `${title.runtimeMinutes} min`}
          </span>
        </div>
        <h3 className="font-display text-xl font-semibold leading-tight text-parchment-100">{title.name}</h3>
        <div className="flex flex-wrap gap-1.5">
          {title.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="rounded-full bg-ink-700/70 px-2.5 py-0.5 text-[11px] font-medium text-parchment-300">
              {genre}
            </span>
          ))}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-parchment-300/85">{title.synopsis}</p>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
            className="absolute inset-0 z-10 flex flex-col justify-end bg-ink-950/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${title.name} details`}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ y: prefersReducedMotion ? 0 : 24, opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0.05 : 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full flex-col gap-3 overflow-y-auto p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-parchment-100">{title.name}</h3>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  aria-label="Close details"
                  className="btn-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-800/80 text-parchment-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-parchment-300/80">
                <span>★ {title.imdbRating.toFixed(1)}</span>
                <span aria-hidden="true">·</span>
                <span>{title.year}</span>
                <span aria-hidden="true">·</span>
                <span>{title.type === 'series' ? `${title.seasons} seasons` : `${title.runtimeMinutes} min`}</span>
                <span aria-hidden="true">·</span>
                <span>{title.languages.join(', ')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {title.genres.map((genre) => (
                  <span key={genre} className="rounded-full bg-ink-700/70 px-2.5 py-0.5 text-[11px] font-medium text-parchment-300">
                    {genre}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-parchment-200/90">{title.synopsis}</p>
              {title.ottAvailability.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {title.ottAvailability.map((ott) => (
                    <span key={ott.platform} className="rounded-full border border-ink-500 bg-ink-800/70 px-2.5 py-1 text-[11px] font-medium text-parchment-200">
                      {ott.platform}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
