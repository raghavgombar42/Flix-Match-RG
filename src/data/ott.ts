import type { Language, OttListing } from '../types'

/**
 * Mock Indian OTT platform catalogue. Real availability will come from the
 * RapidAPI "OTT Details" integration — see services/ottService.ts.
 */
const PLATFORM_STYLES: Record<string, { colorFrom: string; colorTo: string }> = {
  Netflix: { colorFrom: '#8B0000', colorTo: '#1A0505' },
  'Amazon Prime Video': { colorFrom: '#1F5C99', colorTo: '#0B2540' },
  'Disney+ Hotstar': { colorFrom: '#1638A8', colorTo: '#0A1B57' },
  JioCinema: { colorFrom: '#7A1FA2', colorTo: '#33003E' },
  ZEE5: { colorFrom: '#6A2C9E', colorTo: '#2B0F4A' },
  SonyLIV: { colorFrom: '#C24914', colorTo: '#4A1B06' },
  Aha: { colorFrom: '#C9A227', colorTo: '#4A3A0A' },
  'Sun NXT': { colorFrom: '#D9531E', colorTo: '#4E1C08' },
}

const LANGUAGE_PLATFORM_BIAS: Partial<Record<Language, string[]>> = {
  Tamil: ['Sun NXT', 'Netflix', 'Amazon Prime Video'],
  Telugu: ['Aha', 'Netflix', 'Amazon Prime Video'],
  Kannada: ['Amazon Prime Video', 'Disney+ Hotstar', 'Netflix'],
  Hindi: ['Netflix', 'Amazon Prime Video', 'JioCinema', 'ZEE5', 'SonyLIV'],
  English: ['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar'],
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Deterministically builds a believable 1–3 platform mock availability list. */
export function mockOttAvailability(titleName: string, languages: Language[], seed: number): OttListing[] {
  const pool = new Set<string>()
  languages.forEach((lang) => {
    LANGUAGE_PLATFORM_BIAS[lang]?.forEach((platform) => pool.add(platform))
  })
  if (pool.size === 0) Object.keys(PLATFORM_STYLES).forEach((p) => pool.add(p))

  const platforms = Array.from(pool)
  const count = 1 + (seed % 3)
  const chosen: string[] = []
  for (let i = 0; i < count && i < platforms.length; i++) {
    chosen.push(platforms[(seed + i * 7) % platforms.length])
  }

  const slug = slugify(titleName)
  return Array.from(new Set(chosen)).map((platform) => ({
    platform,
    colorFrom: PLATFORM_STYLES[platform].colorFrom,
    colorTo: PLATFORM_STYLES[platform].colorTo,
    linkLabel: `Watch on ${platform}`,
    url: `https://example.com/watch/${slugify(platform)}/${slug}`,
  }))
}
