import { useState } from 'react'
import { Chip } from './ui/Chip'
import { SegmentedControl } from './ui/SegmentedControl'
import { Button } from './ui/Button'
import type { ContentType, Era, Language, MinRating, Mood, PartnerPreferences } from '../types'
import { emptyPreferences } from '../types'

const MOODS: Mood[] = ['Light & fun', 'Intense & gripping', 'Scary', 'Romantic', 'Other']
const LANGUAGES: Language[] = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Any']
const ERAS: Era[] = ['Any', 'Classic (pre-2000)', '2000–2020', 'Recent (2021–2026)']
const RATINGS: { value: MinRating; label: string; caveat?: string }[] = [
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+', caveat: 'Very few titles' },
]

interface PreferencesFormProps {
  partnerLabel: string
  onSubmit: (prefs: PartnerPreferences) => void
  submitLabel: string
  submitting?: boolean
}

export function PreferencesForm({ partnerLabel, onSubmit, submitLabel, submitting = false }: PreferencesFormProps) {
  const [prefs, setPrefs] = useState<PartnerPreferences>(emptyPreferences)

  function toggleMood(mood: Mood) {
    setPrefs((p) => ({
      ...p,
      moods: p.moods.includes(mood) ? p.moods.filter((m) => m !== mood) : [...p.moods, mood],
    }))
  }

  function toggleLanguage(lang: Language) {
    setPrefs((p) => {
      if (lang === 'Any') return { ...p, languages: p.languages.includes('Any') ? [] : ['Any'] }
      const withoutAny = p.languages.filter((l) => l !== 'Any')
      const next = withoutAny.includes(lang) ? withoutAny.filter((l) => l !== lang) : [...withoutAny, lang]
      return { ...p, languages: next }
    })
  }

  function toggleEra(era: Era) {
    setPrefs((p) => {
      if (era === 'Any') return { ...p, eras: p.eras.includes('Any') ? [] : ['Any'] }
      const withoutAny = p.eras.filter((e) => e !== 'Any')
      const next = withoutAny.includes(era) ? withoutAny.filter((e) => e !== era) : [...withoutAny, era]
      return { ...p, eras: next }
    })
  }

  const canSubmit = prefs.moods.length > 0 && prefs.languages.length > 0 && prefs.eras.length > 0

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit(prefs)
      }}
    >
      <section aria-labelledby="mood-heading" className="flex flex-col gap-3">
        <div>
          <h2 id="mood-heading" className="font-display text-lg font-semibold text-parchment-100">
            What's the mood, {partnerLabel}?
          </h2>
          <p className="text-sm text-parchment-300/70">Pick as many as fit tonight.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <Chip key={mood} selected={prefs.moods.includes(mood)} onClick={() => toggleMood(mood)}>
              {mood}
            </Chip>
          ))}
        </div>
        <textarea
          value={prefs.moodNote}
          onChange={(e) => setPrefs((p) => ({ ...p, moodNote: e.target.value }))}
          placeholder="Describe what you're in the mood for tonight"
          rows={2}
          maxLength={240}
          className="btn-focus w-full resize-none rounded-2xl border border-ink-500 bg-ink-800/60 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-300/40 focus:border-ember-400/60"
        />
      </section>

      <section aria-labelledby="language-heading" className="flex flex-col gap-3">
        <h2 id="language-heading" className="font-display text-lg font-semibold text-parchment-100">
          Language
        </h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <Chip key={lang} selected={prefs.languages.includes(lang)} onClick={() => toggleLanguage(lang)}>
              {lang}
            </Chip>
          ))}
        </div>
      </section>

      <section aria-labelledby="content-heading" className="flex flex-col gap-3">
        <h2 id="content-heading" className="font-display text-lg font-semibold text-parchment-100">
          Content type
        </h2>
        <SegmentedControl<ContentType>
          name="Content type"
          value={prefs.contentType}
          onChange={(v) => setPrefs((p) => ({ ...p, contentType: v }))}
          options={[
            { value: 'movies', label: 'Movies only' },
            { value: 'series', label: 'Include series' },
          ]}
        />
      </section>

      <section aria-labelledby="rating-heading" className="flex flex-col gap-3">
        <h2 id="rating-heading" className="font-display text-lg font-semibold text-parchment-100">
          Minimum IMDb rating
        </h2>
        <SegmentedControl<string>
          name="Minimum IMDb rating"
          value={String(prefs.minRating)}
          onChange={(v) => setPrefs((p) => ({ ...p, minRating: Number(v) as MinRating }))}
          options={RATINGS.map((r) => ({ value: String(r.value), label: r.label, caveat: r.caveat }))}
        />
      </section>

      <section aria-labelledby="era-heading" className="flex flex-col gap-3">
        <h2 id="era-heading" className="font-display text-lg font-semibold text-parchment-100">
          Era
        </h2>
        <div className="flex flex-wrap gap-2">
          {ERAS.map((era) => (
            <Chip key={era} selected={prefs.eras.includes(era)} onClick={() => toggleEra(era)}>
              {era}
            </Chip>
          ))}
        </div>
      </section>

      <Button type="submit" size="lg" disabled={!canSubmit || submitting} className="mt-2 w-full">
        {submitting ? 'Setting things up…' : submitLabel}
      </Button>
      {!canSubmit && (
        <p className="-mt-4 text-center text-xs text-parchment-300/50">Pick at least one mood, language, and era to continue.</p>
      )}
    </form>
  )
}
