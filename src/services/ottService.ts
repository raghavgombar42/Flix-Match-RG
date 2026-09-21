import type { OttListing, Title } from '../types'

/**
 * ------------------------------------------------------------------
 * FUTURE INTEGRATION POINT — RapidAPI (OTT Details)
 * ------------------------------------------------------------------
 * Replace the body of `getIndianAvailability` with a server-side call
 * to the RapidAPI "OTT Details" endpoint, keyed by title + region
 * ("IN"). The X-RapidAPI-Key must stay server-side. Keep the return
 * shape (OttListing[]) the same so Match/History screens don't change.
 * ------------------------------------------------------------------
 */
export async function getIndianAvailability(title: Title): Promise<OttListing[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return title.ottAvailability
}
