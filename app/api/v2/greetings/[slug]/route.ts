import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getGreetingBySlug,
  incrementCounter,
  updateGreeting,
} from '@/lib/v2/db';
import { isValidSlug } from '@/lib/v2/slug';
import { canUseTemplate, maxImagesFor } from '@/lib/v2/plan';
import {
  GreetingContentSchema,
  TEMPLATE_IDS,
  toPublicGreeting,
} from '@/lib/v2/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const greeting = await getGreetingBySlug(slug);
  if (!greeting) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // ?track=view bumps the counter; the editor's preview passes nothing.
  if (req.nextUrl.searchParams.get('track') === 'view') {
    await incrementCounter(slug, 'viewCount');
  }

  return NextResponse.json({ success: true, greeting: toPublicGreeting(greeting) });
}

const MediaSchema = z.object({
  url: z.string().max(500),
  type: z.enum(['image', 'video']),
  caption: z.string().max(200).optional().default(''),
});

const PatchSchema = z.object({
  ownerToken: z.string().min(1),
  content: GreetingContentSchema.optional(),
  templateId: z.enum(TEMPLATE_IDS).optional(),
  musicTrack: z.string().max(300).optional(),
  musicEnabled: z.boolean().optional(),
  media: z.array(MediaSchema).max(60).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const patch = PatchSchema.parse(body);

    const existing = await getGreetingBySlug(slug);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Editing requires the creator's token — no accounts, but not public either.
    if (patch.ownerToken !== existing.ownerToken) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }

    // Plan gates are enforced server-side, not only in the editor UI.
    if (patch.templateId && !canUseTemplate(existing.plan, patch.templateId)) {
      return NextResponse.json(
        { error: 'Template requires premium', errorCode: 'PREMIUM_REQUIRED' },
        { status: 402 }
      );
    }

    const media = patch.media
      ? patch.media.slice(0, maxImagesFor(existing.plan))
      : undefined;

    await updateGreeting(existing.id, {
      content: patch.content,
      templateId: patch.templateId,
      musicTrack: patch.musicTrack,
      musicEnabled: patch.musicEnabled,
      media,
    });

    const updated = await getGreetingBySlug(slug);
    return NextResponse.json({
      success: true,
      greeting: updated ? toPublicGreeting(updated) : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[v2] update greeting failed:', error);
    return NextResponse.json({ error: 'Failed to update greeting' }, { status: 500 });
  }
}
