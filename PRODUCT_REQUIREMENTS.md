# FlixMatch — Product Requirements

## Product summary

Build a movie and TV show matchmaker for two people who can never agree on what to watch tonight, so they can stop scrolling, stop negotiating, and actually watch a movie or TV show they both like — with exactly where to watch it in India, right now.

## User journey

### 1. Partner A sets preferences

Partner A opens the app and selects:

- **Mood** (multi-select): Light & fun, Intense & gripping, Scary, Romantic, Other.
- **Mood description** (optional free text): “Describe what you're in the mood for tonight.” This further refines results.
- **Language** (multi-select): Hindi, English, Tamil, Telugu, Kannada, Any. Selecting **Any** deselects all other languages.
- **Content type** (single-select): Movies only or Include series.
- **Minimum IMDb rating** (single-select): 6+, 7+, 8+, or 9+. Show a subtle “Very few titles” caveat beside 9+.
- **Era** (multi-select): Any, Classic (pre-2000), 2000–2020, or Recent (2021–2026). Selecting **Any** deselects all other eras.

### 2. Invite Partner B

The app creates a QR code that Partner A can share with Partner B. Partner B scans it and joins the same session.

- Provide a shareable link as a fallback if scanning does not work.
- Allow Partner A to share the QR code as an image directly to a messaging app from a phone.
- Partner B completes the same preference form independently, without seeing Partner A’s choices.

### 3. Create a shared recommendation pool

After both profiles are submitted, an AI model reads the two structured profiles and free-text mood descriptions, then creates a refined search brief.

Use the search brief to retrieve 30 titles from TMDB that meet both partners’ preferences, including nuance from their free-text input.

### 4. Swipe titles

Show both partners the same 30 titles as swipeable cards, with a differently randomized order for each person.

- Swipe right to like; swipe left to pass.
- Each card shows a poster, title, year, IMDb rating, runtime, and a one-line synopsis.

### 5. Reveal a match

When both partners like the same title, show the match on both screens simultaneously.

The match screen shows the title’s full details and the Indian OTT platforms where it is currently available, with a direct link to each platform.

### 6. Handle no-match outcomes

If both partners finish a round without a match:

1. The AI model reads both right-swipe lists.
2. It generates a new pool of 30 titles based on what both people actually responded to.
3. The new titles must exclude anything already seen.
4. Run one further round of swiping.

If there is still no match after round two, show the five titles with the strongest combined right-swipe score so both people can choose together.

### 7. Save and learn from history

Save the full session to the database:

- Both preference profiles
- Full swipe history
- Final match
- A post-watch rating

When the pair returns, load their history and use actual shared enjoyment to refine future title pools.

## External services

The eventual app needs these connections:

| Service | Purpose |
| --- | --- |
| AI model (Claude or Gemini, as specified by the course) | Combine preferences, create search briefs, refine recommendation pools, and learn from history. |
| TMDB | Fetch titles, posters, ratings, and metadata. |
| RapidAPI / OTT Details | Find current Indian OTT availability and direct platform links. |
| Supabase | Store sessions, preferences, swipes, matches, ratings, and real-time session state. |

## Security requirements

- Store every secret/API key in environment variables, never in source code.
- Keep local secrets in `.env` and add `.env` to `.gitignore` before the first commit.
- Never expose AI, TMDB, RapidAPI, or Supabase secret keys in browser/frontend code.
- Route secret API calls through server-side endpoints.
- Do not commit, screenshot, or share keys in chats or public repositories.

## Design philosophy

The app should feel like a real, polished product: clean, mobile-friendly, and fun without being childish.

- Make swiping smooth and satisfying.
- Give every title card enough room to make its case.
- Treat the match moment as an event, not merely a result.
- Keep the interface simple: every element must earn its place.

## Suggested build phases

1. Build the responsive frontend with realistic mock data.
2. Add Supabase sessions, data storage, and real-time partner synchronization.
3. Integrate TMDB for real title data.
4. Add the server-side AI recommendation flow.
5. Add Indian OTT availability through RapidAPI.
6. Test, publish to GitHub, and deploy to Vercel.
