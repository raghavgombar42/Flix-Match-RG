import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { RatingStars } from '../components/ui/RatingStars'
import { PosterImage } from '../components/ui/PosterImage'
import { Button } from '../components/ui/Button'
import { getHistory, saveRating } from '../services/supabaseService'
import type { HistoryEntry } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function History() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)

  useEffect(() => {
    let active = true
    getHistory().then((data) => {
      if (active) setEntries(data)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleRate(id: string, rating: number) {
    setEntries((prev) => prev?.map((e) => (e.id === id ? { ...e, rating } : e)) ?? prev)
    await saveRating(id, rating)
  }

  return (
    <Screen>
      <header className="mb-5 mt-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-400">Your history</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-parchment-100">Past matches</h1>
        </div>
        <Button variant="ghost" size="md" onClick={() => navigate('/')}>
          Close
        </Button>
      </header>

      {entries === null && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-parchment-300/60">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-ember-400" />
          <p className="text-sm">Loading history…</p>
        </div>
      )}

      {entries?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-display text-lg text-parchment-100">No matches yet</p>
          <p className="max-w-xs text-sm text-parchment-300/65">Start a session to find your first shared watch.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {entries?.map((entry) => (
          <div key={entry.id} className="flex gap-4 rounded-2xl border border-ink-600 bg-ink-800/50 p-3">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg">
              <PosterImage seed={entry.title.posterSeed} url={entry.title.posterUrl} title={entry.title.name} className="h-full w-full" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
              <div>
                <h2 className="truncate font-display text-base font-semibold text-parchment-100">{entry.title.name}</h2>
                <p className="text-xs text-parchment-300/60">Matched {formatDate(entry.matchedAt)}</p>
              </div>
              <RatingStars
                value={entry.rating ?? 0}
                onChange={(rating) => handleRate(entry.id, rating)}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </Screen>
  )
}
