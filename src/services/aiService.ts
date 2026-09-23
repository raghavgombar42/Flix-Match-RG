import type { PartnerPreferences } from '../types'

/**
 * ------------------------------------------------------------------
 * FUTURE INTEGRATION POINT — Claude / Gemini
 * ------------------------------------------------------------------
 * `generateSearchBrief` currently returns a locally-computed placeholder.
 * In the real build it should call a server-side endpoint (never the
 * model API directly from the browser) that sends both partners'
 * structured preferences plus free-text mood notes to the model and
 * gets back a refined search brief (genres, tone, keywords) used to
 * query TMDB.
 * ------------------------------------------------------------------
 */

export interface SearchBrief {
  summary: string
  keywords: string[]
  toneNotes: string[]
}

function extractKeywords(note: string): string[] {
  return note
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5)
}

/** Mock stand-in for an AI call that merges two preference profiles into one brief. */
export async function generateSearchBrief(prefsA: PartnerPreferences, prefsB: PartnerPreferences): Promise<SearchBrief> {
  await new Promise((resolve) => setTimeout(resolve, 700))

  const sharedMoods = prefsA.moods.filter((mood) => prefsB.moods.includes(mood))
  const allMoods = Array.from(new Set([...prefsA.moods, ...prefsB.moods]))
  const keywords = Array.from(new Set([...extractKeywords(prefsA.moodNote), ...extractKeywords(prefsB.moodNote)]))

  const moodPhrase = sharedMoods.length > 0 ? sharedMoods.join(' and ') : allMoods.join(' or ') || 'something for everyone'

  return {
    summary: `Looking for ${moodPhrase.toLowerCase()} titles that satisfy both partners' language, era, and rating bars.`,
    keywords,
    toneNotes: [prefsA.moodNote, prefsB.moodNote].filter(Boolean),
  }
}
