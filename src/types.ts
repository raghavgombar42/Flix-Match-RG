export type Mood = 'Light & fun' | 'Intense & gripping' | 'Scary' | 'Romantic' | 'Other'

export type Language = 'Hindi' | 'English' | 'Tamil' | 'Telugu' | 'Kannada' | 'Any'

export type ContentType = 'movies' | 'series'

export type MinRating = 6 | 7 | 8 | 9

export type Era = 'Any' | 'Classic (pre-2000)' | '2000–2020' | 'Recent (2021–2026)'

export interface PartnerPreferences {
  moods: Mood[]
  moodNote: string
  languages: Language[]
  contentType: ContentType
  minRating: MinRating
  eras: Era[]
}

export type PartnerKey = 'A' | 'B'

export type SwipeDirection = 'like' | 'pass'

export interface Title {
  id: string
  name: string
  year: number
  type: 'movie' | 'series'
  imdbRating: number
  runtimeMinutes: number
  seasons?: number
  genres: string[]
  languages: Language[]
  era: Exclude<Era, 'Any'>
  moodTags: Mood[]
  synopsis: string
  posterSeed: string
  /** Real TMDB poster URL when the title came from tmdbService's live fetch; absent for mock titles. */
  posterUrl?: string | null
  ottAvailability: OttListing[]
}

export interface OttListing {
  platform: string
  colorFrom: string
  colorTo: string
  linkLabel: string
  url: string
}

export interface SwipeRecord {
  titleId: string
  direction: SwipeDirection
}

export interface MatchResult {
  title: Title
  matchedAt: string
  round: number
}

export interface HistoryEntry {
  id: string
  title: Title
  matchedAt: string
  rating: number | null
  partnerALabel: string
  partnerBLabel: string
}

export const emptyPreferences = (): PartnerPreferences => ({
  moods: [],
  moodNote: '',
  languages: [],
  contentType: 'movies',
  minRating: 6,
  eras: [],
})
