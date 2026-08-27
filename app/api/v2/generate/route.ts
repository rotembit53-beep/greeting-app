import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIError, generateGreetingContent } from '@/lib/v2/ai';
import { EVENT_TYPES, GenderSchema, TEMPLATE_IDS } from '@/lib/v2/types';
import { rateLimit } from '@/lib/v2/rateLimit';

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
  preferredTemplate: z.enum(TEMPLATE_IDS).optional(),
});

const STATUS: Record<AIError['code'], number> = {
  AI_NOT_CONFIGURED: 500,
  AI_UNAVAILABLE: 503,
  AI_INVALID_RESPONSE: 502,
};

export async function POST(req: NextRequest) {
  // Each call bills Gemini — throttle hard before doing any work.
  const limited = rateLimit(req, { bucket: 'generate', limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    const content = await generateGreetingContent(input);

    return NextResponse.json({ success: true, content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errorCode: 'VALIDATION_ERROR', error: 'Invalid input' },
        { status: 400 }
      );
    }

    if (error instanceof AIError) {
      console.error(`[v2] generate failed [${error.code}]:`, error.message);
      return NextResponse.json(
        { errorCode: error.code, error: 'Generation failed' },
        { status: STATUS[error.code] }
      );
    }

    console.error('[v2] unexpected generate error:', error);
    return NextResponse.json(
      { errorCode: 'AI_UNAVAILABLE', error: 'Generation failed' },
      { status: 500 }
    );
  }
}
