import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateId } from '@/lib/ids';
import { getFunnel, incrementCounter, recordEvent } from '@/lib/v2/db';
import { ANALYTICS_EVENTS } from '@/lib/v2/analytics';

const BodySchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  greetingId: z.string().max(100).optional().nullable(),
  slug: z.string().max(32).optional().nullable(),
  sessionId: z.string().max(100).optional().nullable(),
  props: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = BodySchema.parse(body);

    await recordEvent({
      id: generateId(),
      name: event.name,
      greetingId: event.greetingId ?? null,
      sessionId: event.sessionId ?? null,
      props: event.props ?? null,
      createdAt: new Date().toISOString(),
    });

    // The "opened" beat is the one that matters per-greeting, so it also
    // maintains a denormalised counter for cheap per-greeting stats.
    if (event.name === 'greeting_opened' && event.slug) {
      await incrementCounter(event.slug, 'openCount');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Analytics must never break the product — swallow bad events quietly.
      return NextResponse.json({ success: false }, { status: 202 });
    }
    console.error('[v2] analytics failed:', error);
    return NextResponse.json({ success: false }, { status: 202 });
  }
}

export async function GET() {
  try {
    const funnel = await getFunnel();
    return NextResponse.json({ success: true, funnel });
  } catch (error) {
    console.error('[v2] funnel failed:', error);
    return NextResponse.json({ error: 'Failed to load funnel' }, { status: 500 });
  }
}
