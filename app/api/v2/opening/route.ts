import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIError, generateOpeningConfig } from '@/lib/v2/ai';
import { EVENT_TYPES, GenderSchema } from '@/lib/v2/types';
import { OPENING_PREFERENCES } from '@/lib/v2/opening/types';
import { rateLimit } from '@/lib/v2/rateLimit';

/**
 * Designs the personalised unlock challenge for one draft.
 *
 * Deliberately never returns an error the client has to handle as fatal: the
 * caller treats any non-success as "use the classic gate", so a failure here
 * costs a bit of delight and nothing else.
 */

const BodySchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  recipientName: z.string().min(1).max(60),
  recipientGender: GenderSchema.optional().default(''),
  relationship: z.string().max(60).optional().default(''),
  recipientAge: z.string().max(20).optional().default(''),
  aboutThem: z.string().max(2000).optional().default(''),
  sharedMemory: z.string().max(2000).optional().default(''),
  senderName: z.string().max(60).optional().default(''),
  senderGender: GenderSchema.optional().default(''),
  tone: z.string().max(40).optional().default(''),
  /** Flattened greeting copy — a rich second source of personal detail. */
  greetingText: z.string().max(4000).optional().default(''),
  photoCount: z.number().int().min(0).max(200).optional().default(0),
  videoCount: z.number().int().min(0).max(200).optional().default(0),
  preference: z.enum(OPENING_PREFERENCES).optional().default('surprise'),
});

export async function POST(req: NextRequest) {
  // Each call bills Gemini — same budget as the greeting generator.
  const limited = rateLimit(req, { bucket: 'opening', limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const input = BodySchema.parse(await req.json());

    // 'classic' is answered without spending a model call.
    if (input.preference === 'classic') {
      return NextResponse.json({ success: true, opening: null });
    }

    const opening = await generateOpeningConfig(input);
    return NextResponse.json({ success: true, opening });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errorCode: 'VALIDATION_ERROR', error: 'Invalid input' },
        { status: 400 }
      );
    }
    if (error instanceof AIError) {
      console.error(`[v2] opening failed [${error.code}]:`, error.message);
      return NextResponse.json(
        { errorCode: error.code, error: 'Opening generation failed' },
        { status: 503 }
      );
    }
    console.error('[v2] unexpected opening error:', error);
    return NextResponse.json(
      { errorCode: 'AI_UNAVAILABLE', error: 'Opening generation failed' },
      { status: 500 }
    );
  }
}
