import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui/Button'
import { PosterImage } from '../components/ui/PosterImage'
import { useSession } from '../state/SessionContext'
import { moodAmbienceFrom } from '../lib/moodAmbience'

export default function Overlap() {
  const navigate = useNavigate()
  const { dbSessionId, prefsA, prefsB, overlapTitles, match, pickFinalTitle, startNewSession } = useSession()
  const prefersReducedMotion = useReducedMotion()
  const [pending, setPending] = useState<string | null>(null)
  const ambience = moodAmbienceFrom(prefsA, prefsB)

  useEffect(() => {
    if (!dbSessionId) navigate('/', { replace: true })
  }, [dbSessionId, navigate])

  useEffect(() => {
    if (match) navigate('/match')
  }, [match, navigate])

  async function choose(titleId: string) {
    const entry = overlapTitles.find((o) => o.title.id === titleId)
    if (!entry) return
    setPending(titleId)
    await pickFinalTitle(entry.title)
    setPending(null)
  }

  if (overlapTitles.length === 0) {
    return (
      <Screen contentClassName="justify-center" ambience={ambience}>
        <div className="flex flex-col items-center gap-5 py-8 text-center lg:mx-auto lg:max-w-lg">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ink-500 bg-ink-800/70">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" className="text-parchment-300/60" />
              <path d="M9 9.5l6 5M15 9.5l-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-rose-400" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-parchment-100">No overlap this time</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm text-parchment-300/70 lg:max-w-sm">
              You both swiped through all 30 without liking the same title. Different nights call for different
              picks — start fresh with a new session.
            </p>
          </div>
          <Button
            size="lg"
            className="mt-2 w-full max-w-xs"
            onClick={() => {
              startNewSession()
              navigate('/preferences/a')
            }}
          >
            Start a new session
          </Button>
        </div>
      </Screen>
    )
  }

  const [topPick, ...rest] = overlapTitles

  return (
    <Screen wide contentClassName="justify-start" ambience={ambience}>
      <header className="mb-6 mt-2 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">The Overlap</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-parchment-100">
          {overlapTitles.length === 1 ? 'You found one perfect match' : `You both liked ${overlapTitles.length} of the same titles`}
        </h1>
        <p className="mt-1 text-sm text-parchment-300/70">Ranked by rating and how well each fits what you both asked for.</p>
      </header>

      {/* Tonight's Pick — cinematic reveal of the top-ranked overlap title. */}
      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.94, y: prefersReducedMotion ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: prefersReducedMotion ? 0 : 0.1 }}
        className="relative overflow-hidden rounded-[28px] border border-violet-400/30 bg-ink-800 shadow-glow-violet lg:flex lg:flex-row"
      >
        <div className="relative h-72 w-full shrink-0 lg:h-auto lg:w-80">
          <PosterImage seed={topPick.title.posterSeed} url={topPick.title.posterUrl} title={topPick.title.name} className="h-full w-full" priority />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/10 to-transparent lg:bg-gradient-to-r" />
        </div>
        <div className="relative flex flex-col gap-3 px-6 py-6">
          <span className="w-fit rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300 animate-glow-pulse motion-reduce:animate-none">
            Tonight&apos;s Pick
          </span>
          <h2 className="font-display text-2xl font-semibold text-parchment-100">{topPick.title.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-parchment-300/75">
            <span className="font-semibold text-ember-400">★ {topPick.title.imdbRating.toFixed(1)}</span>
            <span>·</span>
            <span>{topPick.title.year}</span>
            <span>·</span>
            <span>{topPick.title.type === 'series' ? `${topPick.title.seasons} seasons` : `${topPick.title.runtimeMinutes} min`}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topPick.reasons.map((reason) => (
              <span key={reason} className="rounded-full bg-ink-700/70 px-2.5 py-0.5 text-[11px] font-medium text-parchment-300">
                {reason}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-parchment-300/85">{topPick.title.synopsis}</p>
          <Button
            size="lg"
            className="mt-2 w-full lg:w-auto"
            disabled={pending !== null}
            onClick={() => choose(topPick.title.id)}
          >
            {pending === topPick.title.id ? 'Locking it in…' : 'Choose Tonight’s Pick'}
          </Button>
        </div>
      </motion.div>

      {rest.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-display text-lg font-semibold text-parchment-100">Or pick another from our shortlist</h3>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
            {rest.map((entry, i) => (
              <button
                key={entry.title.id}
                type="button"
                disabled={pending !== null}
                onClick={() => choose(entry.title.id)}
                className="btn-focus group flex items-center gap-4 rounded-2xl border border-ink-600 bg-ink-800/60 p-3 text-left transition-all hover:border-violet-400/50 hover:bg-ink-700/60 disabled:opacity-60 lg:flex-col lg:items-stretch lg:gap-3"
              >
                <div className="flex items-center gap-4 lg:hidden">
                  <span className="w-5 shrink-0 text-center font-display text-lg text-parchment-300/40">{i + 2}</span>
                  <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg">
                    <PosterImage seed={entry.title.posterSeed} url={entry.title.posterUrl} title={entry.title.name} className="h-full w-full" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h4 className="truncate font-display text-base font-semibold text-parchment-100">{entry.title.name}</h4>
                    <p className="text-xs text-parchment-300/70">
                      {entry.title.year} · ★ {entry.title.imdbRating.toFixed(1)}
                    </p>
                    <p className="line-clamp-1 text-xs text-parchment-300/55">{entry.reasons.join(' · ')}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-ink-500 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors group-hover:border-violet-400/60">
                    {pending === entry.title.id ? '…' : 'Pick'}
                  </span>
                </div>

                <div className="hidden lg:flex lg:flex-col lg:gap-3">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl">
                    <PosterImage seed={entry.title.posterSeed} url={entry.title.posterUrl} title={entry.title.name} className="h-full w-full" />
                    <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/80 font-display text-xs font-bold text-violet-300">
                      {i + 2}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="truncate font-display text-base font-semibold text-parchment-100">{entry.title.name}</h4>
                    <p className="text-xs text-parchment-300/70">
                      {entry.title.year} · ★ {entry.title.imdbRating.toFixed(1)}
                    </p>
                    <p className="line-clamp-1 text-xs text-parchment-300/55">{entry.reasons.join(' · ')}</p>
                  </div>
                  <span className="rounded-full border border-ink-500 px-3 py-1.5 text-center text-xs font-semibold text-violet-300 transition-colors group-hover:border-violet-400/60">
                    {pending === entry.title.id ? 'Locking it in…' : 'Pick this one'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto mt-8 lg:mx-0">
        <Button
          variant="ghost"
          onClick={() => {
            startNewSession()
            navigate('/preferences/a')
          }}
        >
          Start a new session
        </Button>
      </div>
    </Screen>
  )
}
