import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { PosterImage } from '../components/ui/PosterImage'
import { PosterMosaic } from '../components/ui/PosterMosaic'
import { useSession } from '../state/SessionContext'
import { MOCK_TITLES } from '../data/movies'

const SHOWCASE = MOCK_TITLES.filter((t) => ['rrr', 'la-la-land', 'kantara', '3-idiots'].includes(t.id))

export default function Landing() {
  const navigate = useNavigate()
  const { startNewSession } = useSession()
  const [showJoin, setShowJoin] = useState(false)
  const [code, setCode] = useState('')

  const startAction = (
    <>
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

      {showJoin ? (
        <form
          className="flex w-full max-w-xs flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = code.trim()
            if (trimmed) navigate(`/join/${trimmed.toUpperCase()}`)
          }}
        >
          <label htmlFor="session-code" className="sr-only">
            Session code
          </label>
          <input
            id="session-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter session code"
            autoCapitalize="characters"
            maxLength={8}
            className="btn-focus min-h-[44px] w-full rounded-xl border border-ink-500 bg-ink-800/70 px-4 text-center font-mono text-sm uppercase tracking-[0.2em] text-parchment-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-parchment-300/40 focus:border-violet-400/60"
          />
          <Button type="submit" variant="secondary" size="md" disabled={!code.trim()}>
            Join session
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowJoin(true)}
          className="btn-focus min-h-[44px] rounded-lg px-2 text-xs font-medium text-parchment-300/60 underline decoration-ink-500 underline-offset-4 transition-colors hover:text-violet-300"
        >
          Have a code? Join a session
        </button>
      )}
    </>
  )

  return (
    <Screen
      showHistoryLink
      wide
      contentClassName="justify-center"
      side={
        <div className="relative hidden aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-ink-600 shadow-card lg:block">
          <PosterMosaic tileCount={24} className="!inset-0 grid-cols-4 opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="font-display text-lg font-semibold text-parchment-100">Every night, a new lineup.</p>
            <p className="mt-1 text-sm text-parchment-300/70">30 real titles, picked for exactly what you both want tonight.</p>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-10 py-6 text-center lg:items-start lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 lg:items-start"
        >
          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            FlixMatch
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] text-parchment-100 text-balance sm:text-5xl">
            Two people.
            <br />
            One great watch.
          </h1>
          <p className="max-w-xs text-balance text-[15px] leading-relaxed text-parchment-300/80 sm:max-w-sm lg:max-w-md">
            Stop scrolling. Stop negotiating. Set your mood, swipe together, and land on something you&apos;ll
            both actually watch tonight — with exactly where to stream it in India.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-52 w-full max-w-sm lg:hidden"
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
          className="flex w-full flex-col items-center gap-3 lg:items-start"
        >
          {startAction}
        </motion.div>
      </div>
    </Screen>
  )
}
