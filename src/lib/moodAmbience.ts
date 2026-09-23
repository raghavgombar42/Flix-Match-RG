import type { MoodAmbience } from '../components/Screen'
import type { PartnerPreferences } from '../types'

/** Picks one dominant ambience for the session's combined moods — priority order
 *  matters more than completeness here, so a mixed pick still reads as intentional. */
export function moodAmbienceFrom(prefsA: PartnerPreferences | null, prefsB: PartnerPreferences | null): MoodAmbience {
  const moods = new Set([...(prefsA?.moods ?? []), ...(prefsB?.moods ?? [])])
  if (moods.has('Scary')) return 'scary'
  if (moods.has('Romantic')) return 'romantic'
  if (moods.has('Intense & gripping')) return 'intense'
  if (moods.has('Light & fun')) return 'light'
  return undefined
}
