import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { PosterImage } from '../components/ui/PosterImage'
import { useSession } from '../state/SessionContext'

export default function TopFive() {
  const navigate = useNavigate()
  const { topFive, match, pickFinalTitle } = useSession()

  useEffect(() => {
    if (!topFive && !match) navigate('/', { replace: true })
  }, [topFive, match, navigate])

  useEffect(() => {
    if (match) navigate('/match')
  }, [match, navigate])

  if (!topFive) return null

  return (
    <Screen>
      <header className="mb-5 mt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">Final round</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-parchment-100">Choose together</h1>
        <p className="mt-1 text-sm text-parchment-300/70">
          Your top combined picks across both rounds. Tap the one you&apos;ll watch tonight.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {topFive.map((title, i) => (
          <button
            key={title.id}
            type="button"
            onClick={() => {
              void pickFinalTitle(title)
            }}
            className="btn-focus group flex items-center gap-4 rounded-2xl border border-ink-600 bg-ink-800/60 p-3 text-left transition-all hover:border-ember-400/50 hover:bg-ink-700/60"
          >
            <span className="w-5 shrink-0 text-center font-display text-lg text-parchment-300/40">{i + 1}</span>
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg">
              <PosterImage seed={title.posterSeed} url={title.posterUrl} title={title.name} className="h-full w-full" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="truncate font-display text-base font-semibold text-parchment-100">{title.name}</h2>
              <p className="text-xs text-parchment-300/70">
                {title.year} · ★ {title.imdbRating.toFixed(1)} · {title.type === 'series' ? `${title.seasons} seasons` : `${title.runtimeMinutes} min`}
              </p>
              <p className="line-clamp-1 text-xs text-parchment-300/55">{title.genres.join(', ')}</p>
            </div>
            <span className="shrink-0 rounded-full border border-ink-500 px-3 py-1.5 text-xs font-semibold text-ember-400 transition-colors group-hover:border-ember-400/60">
              Pick
            </span>
          </button>
        ))}
      </div>
    </Screen>
  )
}
