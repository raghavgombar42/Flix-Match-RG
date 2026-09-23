import type { PartnerPreferences, Title } from '../types.ts'

/**
 * Ranks the titles both partners liked ("the overlap") by a transparent combined
 * score — every title here already has the maximum possible "both liked it" signal
 * (that's what makes it part of the overlap), so the score differentiates on real
 * quality (its own rating) plus how well it fits what either partner asked for.
 * `reasons` is surfaced in the UI so the ranking is explainable, not a black box.
 */

export interface RankedOverlapTitle {
  title: Title
  score: number
  reasons: string[]
}

function combinedMoods(prefsA: PartnerPreferences, prefsB: PartnerPreferences): Set<string> {
  return new Set([...prefsA.moods, ...prefsB.moods])
}

function wantsAnyLanguage(prefs: PartnerPreferences): boolean {
  return prefs.languages.length === 0 || prefs.languages.includes('Any')
}

function wantsAnyEra(prefs: PartnerPreferences): boolean {
  return prefs.eras.length === 0 || prefs.eras.includes('Any')
}

export function rankOverlap(mutualTitles: Title[], prefsA: PartnerPreferences, prefsB: PartnerPreferences): RankedOverlapTitle[] {
  const wantedMoods = combinedMoods(prefsA, prefsB)

  return mutualTitles
    .map((title) => {
      const reasons: string[] = ['Liked by both of you']
      let score = title.imdbRating

      const moodMatches = title.moodTags.filter((tag) => wantedMoods.has(tag))
      if (moodMatches.length > 0) {
        score += moodMatches.length * 0.6
        reasons.push(`Fits the ${moodMatches[0].toLowerCase()} mood`)
      }

      const languageOk =
        (wantsAnyLanguage(prefsA) || title.languages.some((l) => prefsA.languages.includes(l))) &&
        (wantsAnyLanguage(prefsB) || title.languages.some((l) => prefsB.languages.includes(l)))
      if (languageOk && !(wantsAnyLanguage(prefsA) && wantsAnyLanguage(prefsB))) {
        score += 0.4
        reasons.push('Matches your language pick')
      }

      const eraOk = (wantsAnyEra(prefsA) || prefsA.eras.includes(title.era)) && (wantsAnyEra(prefsB) || prefsB.eras.includes(title.era))
      if (eraOk && !(wantsAnyEra(prefsA) && wantsAnyEra(prefsB))) {
        score += 0.3
        reasons.push('Right era for you both')
      }

      reasons.push(`★ ${title.imdbRating.toFixed(1)} rated`)

      return { title, score: Math.round(score * 100) / 100, reasons }
    })
    .sort((a, b) => b.score - a.score || b.title.imdbRating - a.title.imdbRating)
}
