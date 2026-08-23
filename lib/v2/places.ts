/**
 * Real nearby businesses, from Google Places.
 *
 * This is the one part of the gift layer allowed to name an actual vendor,
 * and only because every field here comes back from Google rather than from
 * a model: the name, the address, the coordinates and the price level are
 * all Google's. Nothing is inferred, and nothing is invented — if the key is
 * missing or the call fails, callers fall back to the category catalogue in
 * `gifts.ts` rather than filling the gap with plausible-sounding places.
 *
 * Distances are computed here from the coordinates Google returns, so the
 * "12 ק״מ ממך" line on a result is a real measurement, not an estimate.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Israel-centric defaults — the product ships in Hebrew for an Israeli audience. */
const REGION = 'il';
const LANGUAGE = 'he';

/**
 * Read the key from the Cloudflare env binding first, falling back to
 * process.env. On Workers, runtime secrets reach the `env` binding — NOT
 * `process.env` — so reading process.env alone made the key invisible in
 * production even when it was set (it only worked in `next dev`, which does
 * populate process.env). Same pattern as lib/v2/ai.ts.
 */
async function placesApiKey(): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env?.GOOGLE_PLACES_API_KEY) return env.GOOGLE_PLACES_API_KEY;
  } catch {
    // Outside a Cloudflare request context (e.g. plain node) — fall through.
  }
  return process.env.GOOGLE_PLACES_API_KEY;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * How a business's price band relates to the sender's budget.
 *
 * `unknown` is its own case on purpose. Google publishes a price level for
 * only some businesses, and treating "no data" as "affordable" would put a
 * confident budget claim on a place we know nothing about — so it stays
 * visibly separate in both the ranking and the UI.
 */
export type PriceMatch = 'fits' | 'unknown';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  /** Google's 0–4 price level, when it publishes one for this business. */
  priceLevel?: number;
  /** Human-readable band for the level above, e.g. "בינוני". */
  priceLabel?: string;
  priceMatch: PriceMatch;
  rating?: number;
  ratingCount?: number;
  /** Straight-line km from the place the sender chose. */
  distanceKm: number;
  /** True when the business sits outside the chosen locality. */
  outsideChosenArea: boolean;
  mapsUrl: string;
}

export type PlacesErrorCode =
  | 'PLACES_NOT_CONFIGURED'
  | 'PLACES_UNAVAILABLE'
  | 'PLACES_NO_LOCATION'
  /** Key rejected: API not enabled on the project, or key restrictions block it. */
  | 'PLACES_DENIED';

export class PlacesError extends Error {
  constructor(
    public code: PlacesErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'PlacesError';
  }
}

/**
 * Turn a Google status into our own code.
 *
 * `REQUEST_DENIED` in particular must never be reported as "we couldn't find
 * that town" — it means the key or the project is misconfigured, and quietly
 * mislabelling it sends whoever is debugging to look in entirely the wrong
 * place. Google's own `error_message` is preserved for the server log.
 */
function assertOkStatus(status: string, errorMessage: string | undefined) {
  if (status === 'OK' || status === 'ZERO_RESULTS') return;

  if (status === 'REQUEST_DENIED') {
    throw new PlacesError(
      'PLACES_DENIED',
      `Google rejected the request (${status}): ${errorMessage ?? 'no detail'}`
    );
  }
  throw new PlacesError(
    'PLACES_UNAVAILABLE',
    `Google returned ${status}: ${errorMessage ?? 'no detail'}`
  );
}

async function apiKey(): Promise<string> {
  const key = await placesApiKey();
  if (!key) {
    throw new PlacesError(
      'PLACES_NOT_CONFIGURED',
      'GOOGLE_PLACES_API_KEY is not set'
    );
  }
  return key;
}

/** True when a places search can run at all. Lets callers degrade quietly. */
export async function placesConfigured(): Promise<boolean> {
  return Boolean(await placesApiKey());
}

/* ------------------------------------------------------------------ *
 * Distance
 * ------------------------------------------------------------------ */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km. Straight-line, not driving distance. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/* ------------------------------------------------------------------ *
 * Geocoding — turn the typed locality into coordinates
 * ------------------------------------------------------------------ */

export interface GeocodedPlace {
  formatted: string;
  location: LatLng;
  /** The locality component, used to tell "in your city" from "nearby". */
  locality: string;
}

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results?: {
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: { long_name: string; types: string[] }[];
  }[];
}

/* ---- Cache ----
 *
 * A town's coordinates don't move, and searches cluster hard on a handful of
 * cities, so this is the cheapest billable call to stop making. A search
 * costs one geocode plus one Places call per chosen subject, so the saving is
 * one call per repeat search: half of a single-subject search, less of a
 * five-subject one. Places results are deliberately NOT cached — businesses
 * open, close and re-rate, and that data going stale would be a correctness
 * problem rather than a cost one.
 *
 * Deliberately in-memory: it needs no infrastructure, and a cold isolate
 * simply pays for one lookup again. That makes it a saving, not a
 * correctness dependency — nothing breaks if the cache is always empty.
 */
const GEOCODE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — coordinates are static.
/** Bounded so a script feeding junk localities can't grow this forever. */
const GEOCODE_MAX_ENTRIES = 500;

const geocodeCache = new Map<string, { value: GeocodedPlace; expiresAt: number }>();

/** Same city typed with different spacing or casing is the same lookup. */
function geocodeKey(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function geocode(query: string): Promise<GeocodedPlace> {
  const key = geocodeKey(query);

  const hitCache = geocodeCache.get(key);
  if (hitCache && hitCache.expiresAt > Date.now()) {
    // Refresh insertion order so the entries actually in use survive eviction.
    geocodeCache.delete(key);
    geocodeCache.set(key, hitCache);
    return hitCache.value;
  }
  if (hitCache) geocodeCache.delete(key);

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('region', REGION);
  url.searchParams.set('language', LANGUAGE);
  url.searchParams.set('key', await apiKey());

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new PlacesError('PLACES_UNAVAILABLE', `Geocode HTTP ${res.status}`);
  }

  const data = (await res.json()) as GeocodeResponse;
  // Separate "the key/project is wrong" from "that town doesn't exist"
  // before treating an empty result list as the latter.
  assertOkStatus(data.status, data.error_message);

  const hit = data.results?.[0];
  if (!hit) {
    throw new PlacesError('PLACES_NO_LOCATION', `No match for "${query}"`);
  }

  const locality =
    hit.address_components.find((c) => c.types.includes('locality'))?.long_name ??
    hit.address_components.find((c) =>
      c.types.includes('administrative_area_level_2')
    )?.long_name ??
    '';

  const value: GeocodedPlace = {
    formatted: hit.formatted_address,
    location: hit.geometry.location,
    locality,
  };

  /* Only successes are cached, and only past this point.
   *
   * Every failure mode here is transient — restriction changes propagate
   * per-service over several minutes, quotas reset, outages end. Caching a
   * failure would hold the outage open long after Google recovered, and a
   * 30-day TTL would make that effectively permanent. A repeated failing
   * lookup costs one call each time, which is the right trade. */
  if (geocodeCache.size >= GEOCODE_MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the least recently used.
    const oldest = geocodeCache.keys().next().value;
    if (oldest !== undefined) geocodeCache.delete(oldest);
  }
  geocodeCache.set(key, { value, expiresAt: Date.now() + GEOCODE_TTL_MS });

  return value;
}

/* ------------------------------------------------------------------ *
 * Nearby search
 * ------------------------------------------------------------------ */

interface TextSearchResponse {
  status: string;
  error_message?: string;
  results?: {
    place_id: string;
    name: string;
    formatted_address?: string;
    geometry: { location: { lat: number; lng: number } };
    price_level?: number;
    rating?: number;
    user_ratings_total?: number;
  }[];
}

export interface PlaceSearchParams {
  /** Hebrew search phrase, e.g. "ספא עיסוי". */
  query: string;
  origin: GeocodedPlace;
  /** How far out to look, in metres. */
  radiusMeters?: number;
  /** Budget in ILS, mapped onto Google's price levels. */
  budget?: number;
  limit?: number;
}

/**
 * Google publishes a coarse 0–4 price level, not real prices, so this maps
 * a shekel budget onto the highest band that can plausibly be covered by it.
 * The bands are approximate by nature — which is exactly why a place at or
 * under the cap is labelled "fits your budget" rather than given a price.
 */
function maxPriceLevelFor(budget: number): number {
  if (budget <= 80) return 1;
  if (budget <= 200) return 2;
  if (budget <= 500) return 3;
  return 4;
}

const PRICE_LABELS: Record<number, string> = {
  0: 'ללא עלות',
  1: 'זול',
  2: 'בינוני',
  3: 'יקר',
  4: 'יוקרתי',
};

export async function searchPlaces({
  query,
  origin,
  radiusMeters = 25000,
  budget,
  limit = 6,
}: PlaceSearchParams): Promise<PlaceResult[]> {
  const url = new URL(
    'https://maps.googleapis.com/maps/api/place/textsearch/json'
  );
  url.searchParams.set('query', query);
  url.searchParams.set('location', `${origin.location.lat},${origin.location.lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('region', REGION);
  url.searchParams.set('language', LANGUAGE);
  url.searchParams.set('key', await apiKey());

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new PlacesError('PLACES_UNAVAILABLE', `Text search HTTP ${res.status}`);
  }

  const data = (await res.json()) as TextSearchResponse;
  assertOkStatus(data.status, data.error_message);

  const cap = budget ? maxPriceLevelFor(budget) : undefined;

  return (data.results ?? [])
    .filter((r) =>
      // Keep anything Google gives no price level for: absent data must not
      // be read as "too expensive". It is surfaced as `unknown` instead.
      cap === undefined || r.price_level === undefined || r.price_level <= cap
    )
    .map((r): PlaceResult => {
      const location = r.geometry.location;
      const address = r.formatted_address ?? '';
      return {
        id: r.place_id,
        name: r.name,
        address,
        location,
        priceLevel: r.price_level,
        priceLabel:
          r.price_level === undefined ? undefined : PRICE_LABELS[r.price_level],
        // Anything above the cap was filtered out above, so a known level
        // here is one the budget can plausibly cover.
        priceMatch: r.price_level === undefined ? 'unknown' : 'fits',
        rating: r.rating,
        ratingCount: r.user_ratings_total,
        distanceKm: distanceKm(origin.location, location),
        // The locality check is what drives the "not in your town, but N km
        // away" line the sender sees.
        outsideChosenArea: Boolean(
          origin.locality && !address.includes(origin.locality)
        ),
        // `q=place_id:` is not a documented deep link and 404s in the Maps
        // app ("no results found"). The supported form is the Search Action
        // API — `query` gives it text to show/search, `query_place_id` pins
        // the exact business.
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${r.name} ${address}`
        )}&query_place_id=${r.place_id}`,
      };
    })
    /* Budget confidence outranks proximity: a place we know fits is worth
     * more to the sender than a nearer one whose price is a guess. */
    .sort((a, b) => {
      if (a.priceMatch !== b.priceMatch) return a.priceMatch === 'fits' ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, limit);
}
