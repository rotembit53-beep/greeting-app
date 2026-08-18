import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateId, generateToken } from '@/lib/ids';
import { generateSlug } from '@/lib/v2/slug';
import { createGreeting, getGreetingBySlug } from '@/lib/v2/db';
import { maxImagesFor } from '@/lib/v2/plan';
import {
  EVENT_TYPES,
  GreetingContentSchema,
  GreetingV2,
  TEMPLATE_IDS,
} from '@/lib/v2/types';

const MediaSchema = z.object({
  url: z.string().max(500),
  type: z.enum(['image', 'video']),
  caption: z.string().max(200).optional().default(''),
});

const BodySchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  recipientName: z.string().min(1).max(60),
  relationship: z.string().max(60).optional().default(''),
  recipientAge: z.string().max(20).optional().default(''),
  aboutThem: z.string().max(2000).optional().default(''),
  sharedMemory: z.string().max(2000).optional().default(''),
  senderName: z.string().max(60).optional().default(''),
  tone: z.string().max(40).optional().default(''),
  content: GreetingContentSchema,
  templateId: z.enum(TEMPLATE_IDS),
  musicTrack: z.string().max(300).optional().default(''),
  musicEnabled: z.boolean().optional().default(true),
  media: z.array(MediaSchema).max(60).optional().default([]),
});

/** Retries on the (astronomically unlikely) slug collision. */
async function uniqueSlug(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug();
    if (!(await getGreetingBySlug(slug))) return slug;
  }
  // Widen the space rather than fail.
  return generateSlug(12);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    // Free plan image cap is enforced here, not just in the UI.
    const maxImages = maxImagesFor('free');
    const media = input.media.slice(0, maxImages);

    const now = new Date().toISOString();
    const greeting: GreetingV2 = {
      id: generateId(),
      slug: await uniqueSlug(),
      ownerToken: generateToken(),
      eventType: input.eventType,
      recipientName: input.recipientName,
      relationship: input.relationship,
      recipientAge: input.recipientAge,
      aboutThem: input.aboutThem,
      sharedMemory: input.sharedMemory,
      senderName: input.senderName,
      tone: input.tone,
      content: input.content,
      templateId: input.templateId,
      musicTrack: input.musicTrack,
      musicEnabled: input.musicEnabled,
      media,
      plan: 'free',
      status: 'published',
      allowContributions: false,
      viewCount: 0,
      openCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await createGreeting(greeting);

    return NextResponse.json({
      success: true,
      slug: greeting.slug,
      // Returned once, on creation — the client keeps it so the creator can
      // re-open the editor later without any account.
      ownerToken: greeting.ownerToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid greeting data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[v2] create greeting failed:', error);
    return NextResponse.json({ error: 'Failed to save greeting' }, { status: 500 });
  }
}
