import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
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
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14], { clamp: false })
  const likeOpacity = useTransform(x, [20, 120], [0, 1])
  const passOpacity = useTransform(x, [-120, -20], [1, 0])

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onDragDecision('like')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onDragDecision('pass')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  const scale = 1 - Math.min(stackIndex, 2) * 0.04
  const yOffset = Math.min(stackIndex, 2) * 14

  const flyTarget = pendingDirection ? { x: pendingDirection === 'like' ? 500 : -500, opacity: 0 } : undefined

  return (
    <motion.article
      className="absolute inset-0 flex select-none flex-col overflow-hidden rounded-[28px] border border-ink-600/80 bg-ink-800 shadow-card"
      style={isTop ? { x, rotate } : undefined}
      initial={false}
      animate={isTop ? flyTarget : { scale, y: yOffset, opacity: stackIndex > 2 ? 0 : 1 - stackIndex * 0.15 }}
      transition={isTop && flyTarget ? { duration: 0.32, ease: 'easeIn' } : undefined}
      drag={isTop && !pendingDirection ? 'x' : false}
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
              className="pointer-events-none absolute right-5 top-5 rotate-6 rounded-lg border-[3px] border-sage-400 px-3 py-1 text-lg font-extrabold uppercase tracking-wide text-sage-400"
            >
              Like
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="pointer-events-none absolute left-5 top-5 -rotate-6 rounded-lg border-[3px] border-rose-400 px-3 py-1 text-lg font-extrabold uppercase tracking-wide text-rose-400"
            >
              Pass
            </motion.div>
          </>
        )}

        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
          <span className="rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-ember-400 backdrop-blur">
            ★ {title.imdbRating.toFixed(1)}
          </span>
          <span className="rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-medium text-parchment-200 backdrop-blur">
            {title.year}
          </span>
          <span className="rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-medium text-parchment-200 backdrop-blur">
            {title.type === 'series' ? `${title.seasons} seasons` : `${title.runtimeMinutes} min`}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
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
    </motion.article>
  )
}
