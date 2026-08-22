import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIError, suggestGiftInterests } from '@/lib/v2/ai';
import {
  INTEREST_IDS,
  InterestId,
  interestQuery,
  suggestGifts,
} from '@/lib/v2/gifts';
import {
  PlaceResult,
  PlacesError,
  geocode,
  placesConfigured,
  searchPlaces,
} from '@/lib/v2/places';

const BodySchema = z.object({
  /** Interests the sender picked themselves. */
  interests: z.array(z.enum(INTEREST_IDS)).optional().default([]),
  budget: z.number().min(0).max(100000).optional(),
  recipientName: z.string().max(60).optional().default(''),
  /** Free-text locality to search around, e.g. "תל אביב". */
  location: z.string().max(120).optional().default(''),
  /** When true, the AI infers interests from the free text as well. */
  useAI: z.boolean().optional().default(false),
  aboutThem: z.string().max(2000).optional().default(''),
  sharedMemory: z.string().max(2000).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    const interests: InterestId[] = input.interests;
    let inferredInterests: InterestId[] = [];
    let reason = '';

    // The AI only ever picks from the fixed taxonomy; the catalogue turns
    // those into ideas. Nothing about a vendor or a price comes from a model.
    // Its picks stay in their own bucket so they can rank — but never widen —
    // the categories the sender actually chose.
    if (input.useAI && (input.aboutThem || input.sharedMemory)) {
      try {
        const inferred = await suggestGiftInterests({
          aboutThem: input.aboutThem,
          sharedMemory: input.sharedMemory,
          recipientName: input.recipientName,
          allowedIds: INTEREST_IDS,
        });
        inferredInterests = inferred.interests as InterestId[];
        reason = inferred.reason;
      } catch (error) {
        // Matching is a nicety — never block the gift step on it.
        console.error('[v2] gift interest matching failed:', error);
      }
    }

    const suggestions = await suggestGifts({
      interests,
      inferredInterests,
      budget: input.budget,
      recipientName: input.recipientName,
    });

    /* ---- Real nearby businesses, when we can look them up ----
     * Everything below is optional garnish: a missing key, an unknown town
     * or a Google outage degrades to the category suggestions above rather
     * than failing the step or inventing places to fill the space. */
    let places: PlaceResult[] = [];
    let origin: string | null = null;
    let placesError: string | null = null;

    if (input.location.trim()) {
      if (!placesConfigured()) {
        placesError = 'PLACES_NOT_CONFIGURED';
      } else {
        try {
          const geo = await geocode(input.location.trim());
          origin = geo.formatted;

          // Search each chosen interest that maps to a physical place, then
          // interleave so one popular category can't crowd out the others.
          const queries = interests
            .map(interestQuery)
            .filter((q): q is string => Boolean(q));

          /* One failing category shouldn't lose the others, but a failure
           * that affects every category (a disabled Places API, a restricted
           * key) has to surface — otherwise it looks identical to "there is
           * nothing near you", which sends debugging the wrong way. */
          let searchFailure: string | null = null;
          const perQuery = await Promise.all(
            queries.map((query) =>
              searchPlaces({ query, origin: geo, budget: input.budget, limit: 4 })
                .catch((err) => {
                  if (err instanceof PlacesError) searchFailure ??= err.code;
                  else console.error('[v2] place search failed:', err);
                  return [] as PlaceResult[];
                })
            )
          );

          if (searchFailure && perQuery.every((list) => list.length === 0)) {
            placesError = searchFailure;
          }

          const seen = new Set<string>();
          for (let round = 0; round < 4; round += 1) {
            for (const list of perQuery) {
              const item = list[round];
              if (item && !seen.has(item.id)) {
                seen.add(item.id);
                places.push(item);
              }
            }
          }
          // Same ordering rule as within a single category: a confirmed
          // budget fit first, then nearest.
          places = places
            .sort((a, b) => {
              if (a.priceMatch !== b.priceMatch) {
                return a.priceMatch === 'fits' ? -1 : 1;
              }
              return a.distanceKm - b.distanceKm;
            })
            .slice(0, 12);
        } catch (error) {
          if (error instanceof PlacesError) {
            placesError = error.code;
          } else {
            console.error('[v2] places lookup failed:', error);
            placesError = 'PLACES_UNAVAILABLE';
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      interests,
      inferredInterests,
      reason,
      places,
      origin,
      placesError,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (error instanceof AIError) {
      return NextResponse.json({ errorCode: error.code, error: 'Failed' }, { status: 503 });
    }
    console.error('[v2] gift suggestions failed:', error);
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 });
  }
}
