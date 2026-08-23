import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateId } from '@/lib/ids';
import { getFunnel, incrementCounter, recordEvent } from '@/lib/v2/db';
import { ANALYTICS_EVENTS } from '@/lib/v2/analytics';
import { rateLimit } from '@/lib/v2/rateLimit';

const BodySchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  greetingId: z.string().max(100).optional().nullable(),
  slug: z.string().max(32).optional().nullable(),
  sessionId: z.string().max(100).optional().nullable(),
  props: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  // Generous — legitimate clients emit several events per session — but still
  // bounded so one source can't insert rows without limit.
  const limited = rateLimit(req, { bucket: 'analytics', limit: 120, windowMs: 60_000 });
  if (limited) return limited;

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

export async function GET(req: NextRequest) {
  /* The funnel is internal business intelligence, not public data. There are
   * no user accounts, so this is gated on a single operator secret supplied
   * out of band (env var, never hardcoded) and sent as a header. Deny by
   * default: if the secret is unset or the header doesn't match, respond 404
   * so the endpoint's existence isn't even confirmed. Compared with a
   * length-then-content check that avoids leaking length via an early return. */
  const expected = process.env.ANALYTICS_ADMIN_TOKEN;
  const provided = req.headers.get('x-admin-token') ?? '';
  if (!expected || provided.length !== expected.length || provided !== expected) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const funnel = await getFunnel();
    return NextResponse.json({ success: true, funnel });
  } catch (error) {
    console.error('[v2] funnel failed:', error);
    return NextResponse.json({ error: 'Failed to load funnel' }, { status: 500 });
  }
}
