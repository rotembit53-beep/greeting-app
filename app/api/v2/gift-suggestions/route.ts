import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIError, suggestGiftInterests } from '@/lib/v2/ai';
import { INTEREST_IDS, InterestId, suggestGifts } from '@/lib/v2/gifts';

const BodySchema = z.object({
  /** Interests the sender picked themselves. */
  interests: z.array(z.enum(INTEREST_IDS)).optional().default([]),
  budget: z.number().min(0).max(100000).optional(),
  recipientName: z.string().max(60).optional().default(''),
  /** When true, the AI infers interests from the free text as well. */
  useAI: z.boolean().optional().default(false),
  aboutThem: z.string().max(2000).optional().default(''),
  sharedMemory: z.string().max(2000).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    let interests: InterestId[] = input.interests;
    let reason = '';

    // The AI only ever picks from the fixed taxonomy; the catalogue turns
    // those into ideas. Nothing about a vendor or a price comes from a model.
    if (input.useAI && (input.aboutThem || input.sharedMemory)) {
      try {
        const inferred = await suggestGiftInterests({
          aboutThem: input.aboutThem,
          sharedMemory: input.sharedMemory,
          recipientName: input.recipientName,
          allowedIds: INTEREST_IDS,
        });
        // The sender's explicit picks win; the AI only fills gaps.
        interests = Array.from(
          new Set([...interests, ...(inferred.interests as InterestId[])])
        );
        reason = inferred.reason;
      } catch (error) {
        // Matching is a nicety — never block the gift step on it.
        console.error('[v2] gift interest matching failed:', error);
      }
    }

    const suggestions = await suggestGifts({
      interests,
      budget: input.budget,
      recipientName: input.recipientName,
    });

    return NextResponse.json({ success: true, suggestions, interests, reason });
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
