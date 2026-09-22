// Supabase Edge Function — server-side TMDB proxy.
//
// The TMDB Read Access Token must never reach the browser (see
// PRODUCT_REQUIREMENTS.md security requirements), so this function is the
// only thing that ever calls api.themoviedb.org. The frontend calls this
// function instead (with the publishable/anon key as its Bearer token,
// which Supabase verifies as a normal request — nothing TMDB-specific is
// ever exposed client-side).
//
// Request body: { prefsA, prefsB, excludeIds?: string[], poolSize?: number }
// Response: { titles: Title[] }  — already shaped to match src/types.ts's
// Title interface, so the frontend can use the result directly.

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Mood = 'Light & fun' | 'Intense & gripping' | 'Scary' | 'Romantic' | 'Other'
type LanguageName = 'Hindi' | 'English' | 'Tamil' | 'Telugu' | 'Kannada'
type Era = 'Classic (pre-2000)' | '2000–2020' | 'Recent (2021–2026)'

interface PartnerPreferences {
  moods: Mood[]
  moodNote: string
  languages: (LanguageName | 'Any')[]
  contentType: 'movies' | 'series'
  minRating: 6 | 7 | 8 | 9
  eras: (Era | 'Any')[]
}

const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller',
  10752: 'War', 37: 'Western',
}

const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
}

// TMDB's TV genre list has no Horror/Romance categories — Mystery/Soap are the closest
// available stand-ins, so mood matching for series is approximate on those two moods.
const MOOD_GENRES: Record<Mood, string[]> = {
  'Light & fun': ['Comedy', 'Family', 'Animation'],
  'Intense & gripping': ['Action', 'Action & Adventure', 'Thriller', 'Crime'],
  Scary: ['Horror', 'Mystery'],
  Romantic: ['Romance', 'Soap'],
  Other: [],
}

const LANGUAGE_CODES: Record<LanguageName, string> = { Hindi: 'hi', English: 'en', Tamil: 'ta', Telugu: 'te', Kannada: 'kn' }
const CODE_TO_LANGUAGE: Record<string, LanguageName> = Object.fromEntries(Object.entries(LANGUAGE_CODES).map(([k, v]) => [v, k as LanguageName])) as Record<string, LanguageName>

const OTT_PLATFORMS: Record<string, { colorFrom: string; colorTo: string }> = {
  Netflix: { colorFrom: '#8B0000', colorTo: '#1A0505' },
  'Amazon Prime Video': { colorFrom: '#1F5C99', colorTo: '#0B2540' },
  'Disney+ Hotstar': { colorFrom: '#1638A8', colorTo: '#0A1B57' },
  JioCinema: { colorFrom: '#7A1FA2', colorTo: '#33003E' },
  ZEE5: { colorFrom: '#6A2C9E', colorTo: '#2B0F4A' },
  SonyLIV: { colorFrom: '#C24914', colorTo: '#4A1B06' },
  Aha: { colorFrom: '#C9A227', colorTo: '#4A3A0A' },
  'Sun NXT': { colorFrom: '#D9531E', colorTo: '#4E1C08' },
}
const LANGUAGE_PLATFORM_BIAS: Partial<Record<LanguageName, string[]>> = {
  Tamil: ['Sun NXT', 'Netflix', 'Amazon Prime Video'],
  Telugu: ['Aha', 'Netflix', 'Amazon Prime Video'],
  Kannada: ['Amazon Prime Video', 'Disney+ Hotstar', 'Netflix'],
  Hindi: ['Netflix', 'Amazon Prime Video', 'JioCinema', 'ZEE5', 'SonyLIV'],
  English: ['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar'],
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function mockOttAvailability(titleName: string, language: LanguageName, seed: number) {
  const platforms = LANGUAGE_PLATFORM_BIAS[language] ?? Object.keys(OTT_PLATFORMS)
  const count = 1 + (seed % 3)
  const chosen = new Set<string>()
  for (let i = 0; i < count && i < platforms.length; i++) chosen.add(platforms[(seed + i * 7) % platforms.length])
  const slug = slugify(titleName)
  return Array.from(chosen).map((platform) => ({
    platform,
    colorFrom: OTT_PLATFORMS[platform].colorFrom,
    colorTo: OTT_PLATFORMS[platform].colorTo,
    linkLabel: `Watch on ${platform}`,
    url: `https://example.com/watch/${slugify(platform)}/${slug}`,
  }))
}

function eraFor(year: number): Era {
  if (year < 2000) return 'Classic (pre-2000)'
  if (year <= 2020) return '2000–2020'
  return 'Recent (2021–2026)'
}

function moodTagsFor(genres: string[]): Mood[] {
  const tags = (Object.keys(MOOD_GENRES) as Mood[]).filter((mood) => MOOD_GENRES[mood].some((g) => genres.includes(g)))
  return tags.length > 0 ? tags : ['Other']
}

function moodScore(genres: string[], wantedMoods: Set<Mood>): number {
  let score = 0
  for (const mood of wantedMoods) {
    if (MOOD_GENRES[mood]?.some((g) => genres.includes(g))) score += 1
  }
  return score
}

/** Combined preferences use AND semantics (a title must satisfy both partners), so a specific
 *  list on one side intersected with "Any" on the other just keeps the specific list; two
 *  specific lists intersect. */
function effectiveLanguages(a: PartnerPreferences, b: PartnerPreferences): LanguageName[] | null {
  const specific = (langs: PartnerPreferences['languages']) => langs.filter((l): l is LanguageName => l !== 'Any')
  const aAny = a.languages.length === 0 || a.languages.includes('Any')
  const bAny = b.languages.length === 0 || b.languages.includes('Any')
  if (aAny && bAny) return null
  if (aAny) return specific(b.languages)
  if (bAny) return specific(a.languages)
  const setB = new Set(specific(b.languages))
  const intersection = specific(a.languages).filter((l) => setB.has(l))
  return intersection.length > 0 ? intersection : specific(a.languages)
}

function effectiveEras(a: PartnerPreferences, b: PartnerPreferences): Set<Era> | null {
  const specific = (eras: PartnerPreferences['eras']) => eras.filter((e): e is Era => e !== 'Any')
  const aAny = a.eras.length === 0 || a.eras.includes('Any')
  const bAny = b.eras.length === 0 || b.eras.includes('Any')
  if (aAny && bAny) return null
  if (aAny) return new Set(specific(b.eras))
  if (bAny) return new Set(specific(a.eras))
  const setB = new Set(specific(b.eras))
  const intersection = specific(a.eras).filter((e) => setB.has(e))
  return new Set(intersection.length > 0 ? intersection : specific(a.eras))
}

interface RawResult {
  __type: 'movie' | 'tv'
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  overview?: string
  vote_average?: number
  original_language?: string
  poster_path?: string | null
  genre_ids?: number[]
}

async function discover(
  type: 'movie' | 'tv',
  langCode: string | null,
  minRating: number,
  apiToken: string,
  pageCount = 2,
  minVoteCount = 50,
): Promise<RawResult[]> {
  const out: RawResult[] = []
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
  for (const page of pages) {
    const params = new URLSearchParams({
      sort_by: 'popularity.desc',
      include_adult: 'false',
      'vote_average.gte': String(minRating),
      'vote_count.gte': String(minVoteCount),
      page: String(page),
    })
    if (langCode) params.set('with_original_language', langCode)
    try {
      const res = await fetch(`https://api.themoviedb.org/3/discover/${type}?${params}`, {
        headers: { Authorization: `Bearer ${apiToken}`, accept: 'application/json' },
      })
      if (!res.ok) continue
      const body = await res.json()
      for (const r of body.results ?? []) out.push({ ...r, __type: type })
    } catch {
      // one page/language failing shouldn't sink the whole pool
    }
  }
  return out
}

async function fetchDetail(type: 'movie' | 'tv', id: number, apiToken: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?language=en-US`, {
      headers: { Authorization: `Bearer ${apiToken}`, accept: 'application/json' },
    })
    return res.ok ? await res.json() : {}
  } catch {
    return {}
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const apiToken = Deno.env.get('TMDB_READ_ACCESS_TOKEN')
  if (!apiToken) {
    return new Response(JSON.stringify({ error: 'TMDB_READ_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const prefsA: PartnerPreferences = body.prefsA
    const prefsB: PartnerPreferences = body.prefsB
    const excludeIds: string[] = body.excludeIds ?? []
    const poolSize: number = body.poolSize ?? 30

    const bothWantSeries = prefsA.contentType === 'series' && prefsB.contentType === 'series'
    const types: Array<'movie' | 'tv'> = bothWantSeries ? ['movie', 'tv'] : ['movie']
    const requestedMinRating = Math.max(prefsA.minRating, prefsB.minRating)
    const requestedLanguages = effectiveLanguages(prefsA, prefsB)
    const requestedEras = effectiveEras(prefsA, prefsB)
    const wantedMoods = new Set<Mood>([...prefsA.moods, ...prefsB.moods])
    const allLanguages = Object.keys(LANGUAGE_CODES) as LanguageName[]
    const requestedLangCodes = (requestedLanguages && requestedLanguages.length > 0 ? requestedLanguages : allLanguages).map((l) => LANGUAGE_CODES[l])
    const allLangCodes = allLanguages.map((l) => LANGUAGE_CODES[l])

    const excluded = new Set(excludeIds)

    interface Candidate {
      id: string
      type: 'movie' | 'tv'
      tmdbId: number
      name: string
      year: number
      era: Era
      genres: string[]
      language: LanguageName
      raw: RawResult
    }

    function toCandidates(rawResults: RawResult[], eraFilter: Set<Era> | null): Candidate[] {
      const seen = new Set<string>()
      const out: Candidate[] = []
      // TMDB occasionally catalogues the same real film under two different ids (a
      // data-quality quirk, not something callers control) — id-based dedup alone
      // lets both through, so a `name|year` key is tracked as a second dedup guard.
      const seenNameYear = new Set<string>()
      for (const r of rawResults) {
        const id = `tmdb-${r.__type}-${r.id}`
        if (seen.has(id) || excluded.has(id)) continue
        const releaseDate = r.__type === 'movie' ? r.release_date : r.first_air_date
        if (!releaseDate || releaseDate.length < 4) continue
        const year = Number(releaseDate.slice(0, 4))
        if (!year) continue
        const era = eraFor(year)
        if (eraFilter && !eraFilter.has(era)) continue
        const name = r.__type === 'movie' ? r.title : r.name
        if (!name) continue
        const nameYearKey = `${name.trim().toLowerCase()}|${year}`
        if (seenNameYear.has(nameYearKey)) continue
        const genreMap = r.__type === 'movie' ? MOVIE_GENRES : TV_GENRES
        const genres = (r.genre_ids ?? []).map((g) => genreMap[g]).filter((g): g is string => Boolean(g))
        const language = CODE_TO_LANGUAGE[r.original_language ?? ''] ?? 'English'
        seen.add(id)
        seenNameYear.add(nameYearKey)
        out.push({ id, type: r.__type, tmdbId: r.id, name, year, era, genres, language, raw: r })
      }
      out.sort((a, b) => {
        const scoreDiff = moodScore(b.genres, wantedMoods) - moodScore(a.genres, wantedMoods)
        if (scoreDiff !== 0) return scoreDiff
        return (b.raw.vote_average ?? 0) - (a.raw.vote_average ?? 0)
      })
      return out
    }

    async function fetchRaw(langCodes: string[], minRating: number, pageCount = 2, minVoteCount = 50): Promise<RawResult[]> {
      const fetches: Promise<RawResult[]>[] = []
      for (const type of types) {
        for (const code of langCodes) fetches.push(discover(type, code, minRating, apiToken, pageCount, minVoteCount))
      }
      return (await Promise.all(fetches)).flat()
    }

    // Progressive relaxation, in this documented order — each stage only runs if the
    // previous one still leaves us short of `poolSize` eligible titles. Two people's
    // combined filters (specific language + specific era + a high rating floor) can
    // easily intersect down to a handful of real TMDB matches; we'd rather loosen the
    // least-visible constraints first than show a narrow round of real titles. Content
    // type ("movies only" vs "include series") is never relaxed — that's an explicit
    // product choice, not a taste filter. Production never falls back to placeholder
    // data (see tmdbService.ts / poolPadding.ts), so this function tries hard before
    // conceding a smaller-than-requested pool.
    //   1. Exact: requested languages ∩, requested eras ∩, minRating = max(A, B)
    //   2. Drop the era filter (reuse the same fetch — era isn't a TMDB query param)
    //   3. Lower the rating floor by 3 (re-fetch: vote_average.gte is a TMDB param)
    //   4. Broaden to every supported language, at that same lowered rating
    //   5. Last resort: rating floor 0, vote-count floor dropped from 50 to 5, every
    //      language, more pages per query — casts the widest net TMDB allows
    let raw = await fetchRaw(requestedLangCodes, requestedMinRating)
    let candidates = toCandidates(raw, requestedEras)

    if (candidates.length < poolSize && requestedEras) {
      candidates = toCandidates(raw, null)
    }

    if (candidates.length < poolSize && requestedMinRating > 0) {
      const relaxedRating = Math.max(0, requestedMinRating - 3)
      const relaxedRaw = await fetchRaw(requestedLangCodes, relaxedRating)
      raw = [...raw, ...relaxedRaw]
      candidates = toCandidates(raw, null)
    }

    if (candidates.length < poolSize && requestedLangCodes.length < allLangCodes.length) {
      const relaxedRating = Math.max(0, requestedMinRating - 3)
      const broadRaw = await fetchRaw(allLangCodes, relaxedRating)
      raw = [...raw, ...broadRaw]
      candidates = toCandidates(raw, null)
    }

    if (candidates.length < poolSize) {
      const widestRaw = await fetchRaw(allLangCodes, 0, 4, 5)
      raw = [...raw, ...widestRaw]
      candidates = toCandidates(raw, null)
    }

    const top = candidates.slice(0, poolSize)
    const details = await Promise.all(top.map((c) => fetchDetail(c.type, c.tmdbId, apiToken)))

    const titles = top.map((c, i) => {
      const detail = details[i]
      const runtimeMinutes =
        c.type === 'movie'
          ? typeof detail.runtime === 'number' && detail.runtime > 0
            ? detail.runtime
            : 110
          : Array.isArray(detail.episode_run_time) && typeof detail.episode_run_time[0] === 'number'
            ? detail.episode_run_time[0]
            : 45
      const seasons = c.type === 'tv' ? (typeof detail.number_of_seasons === 'number' ? detail.number_of_seasons : 1) : undefined
      const genres = c.genres.length > 0 ? c.genres : ['Drama']

      return {
        id: c.id,
        name: c.name,
        year: c.year,
        type: c.type === 'movie' ? 'movie' : 'series',
        imdbRating: Math.round((c.raw.vote_average ?? 0) * 10) / 10,
        runtimeMinutes,
        ...(seasons ? { seasons } : {}),
        genres,
        languages: [c.language],
        era: c.era,
        moodTags: moodTagsFor(c.genres),
        synopsis: c.raw.overview && c.raw.overview.trim().length > 0 ? c.raw.overview : 'No synopsis available yet.',
        posterSeed: c.id,
        posterUrl: c.raw.poster_path ? `https://image.tmdb.org/t/p/w500${c.raw.poster_path}` : null,
        ottAvailability: mockOttAvailability(c.name, c.language, c.tmdbId),
      }
    })

    return new Response(JSON.stringify({ titles }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
