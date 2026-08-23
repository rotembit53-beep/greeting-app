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
  MEDIA_ROLES,
  TEMPLATE_IDS,
  toPublicGreeting,
} from '@/lib/v2/types';
import { GiftSchema } from '@/lib/v2/gifts';

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

  /* The redeemable gift secrets (code / link) are intentionally withheld from
   * this anonymous JSON endpoint. The recipient experience is server-rendered
   * from the DB directly (app/g/[slug]/page.tsx), so it still reveals the gift
   * in the box; this endpoint has no legitimate consumer that needs the code,
   * and serving it here would hand a redeemable value to any scraper. */
  const pub = toPublicGreeting(greeting);
  const safe = pub.gift
    ? { ...pub, gift: { ...pub.gift, code: '', url: '' } }
    : pub;

  return NextResponse.json({ success: true, greeting: safe });
}

const MediaSchema = z.object({
  id: z.string().min(1).max(64),
  url: z.string().max(500),
  type: z.enum(['image', 'video', 'audio']),
  caption: z.string().max(200).optional().default(''),
  role: z.enum(MEDIA_ROLES).optional().default('library'),
  width: z.number().optional(),
  height: z.number().optional(),
});

const PatchSchema = z.object({
  ownerToken: z.string().min(1),
  content: GreetingContentSchema.optional(),
  templateId: z.enum(TEMPLATE_IDS).optional(),
  musicTrack: z.string().max(300).optional(),
  musicEnabled: z.boolean().optional(),
  media: z.array(MediaSchema).max(60).optional(),
  coverMediaId: z.string().max(64).optional(),
  gift: GiftSchema.nullable().optional(),
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
      coverMediaId: patch.coverMediaId,
      gift: patch.gift,
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
