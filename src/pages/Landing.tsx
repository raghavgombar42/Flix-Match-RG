import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { PosterImage } from '../components/ui/PosterImage'
import { useSession } from '../state/SessionContext'
import { MOCK_TITLES } from '../data/movies'

const SHOWCASE = MOCK_TITLES.filter((t) => ['rrr', 'la-la-land', 'kantara', '3-idiots'].includes(t.id))

export default function Landing() {
  const navigate = useNavigate()
  const { startNewSession } = useSession()

  return (
    <Screen showHistoryLink contentClassName="justify-center">
      <div className="flex flex-col items-center gap-10 py-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <span className="rounded-full border border-ink-500 bg-ink-800/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ember-400">
            FlixMatch
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] text-parchment-100 text-balance sm:text-5xl">
            Two people.
            <br />
            One great watch.
          </h1>
          <p className="max-w-xs text-balance text-[15px] leading-relaxed text-parchment-300/80 sm:max-w-sm">
            Stop scrolling. Stop negotiating. Set your mood, swipe together, and land on something you&apos;ll
            both actually watch tonight — with exactly where to stream it in India.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-52 w-full max-w-sm"
        >
          {SHOWCASE.map((title, i) => {
            const offsets = [
              { rotate: -8, x: -78, z: 0 },
              { rotate: -2.5, x: -26, z: 1 },
              { rotate: 3.5, x: 26, z: 1 },
              { rotate: 9, x: 78, z: 0 },
            ]
            const o = offsets[i]
            return (
              <div
                key={title.id}
                className="absolute left-1/2 top-0 h-52 w-32 overflow-hidden rounded-2xl border border-ink-600 shadow-card"
                style={{ transform: `translateX(-50%) translateX(${o.x}px) rotate(${o.rotate}deg)`, zIndex: o.z }}
              >
                <PosterImage seed={title.posterSeed} title={title.name} className="h-full w-full" priority />
              </div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full flex-col items-center gap-3"
        >
          <Button
            size="lg"
            className="w-full max-w-xs"
            onClick={() => {
              startNewSession()
              navigate('/preferences/a')
            }}
          >
            Start a session
          </Button>
          <p className="text-xs text-parchment-300/55">No account needed. Takes about a minute.</p>
        </motion.div>
      </div>
    </Screen>
  )
}
