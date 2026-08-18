import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGreeting, saveGreeting } from '@/lib/db';
import { Greeting } from '@/types/greeting';
import { VISUAL_STYLES } from '@/lib/visualStyles';

const RequestSchema = z.object({
  id: z.string().uuid(),
  recipientName: z.string().min(1),
  eventType: z.string().min(1),
  theme: z.string().min(1),
  userNotes: z.string().optional().default(''),
  recipientGender: z.enum(['male', 'female', '']).optional().default(''),
  relationship: z.string().max(60).optional().default(''),
  mediaFiles: z.array(z.string()).default([]),
  mediaAudioSettings: z.record(z.string(), z.boolean()).optional().default({}),
  buyMeLink: z.string().optional().default(''),
  audioTrack: z.string().optional().default(''),
  aiText: z.object({
    fullGreeting: z.string().min(1),
    shareData: z.object({
      whatsappMessage: z.string(),
      gmailSubject: z.string(),
      gmailBody: z.string(),
    }),
  }),
  visualConcept: z.enum(
    Object.keys(VISUAL_STYLES) as [string, ...string[]]
  ),
  giftCard: z
    .object({
      number: z.string().max(60).optional().default(''),
      date: z.string().max(40).optional().default(''),
      code: z.string().max(60).optional().default(''),
      company: z.string().max(80).optional().default(''),
      inputMode: z.enum(['manual', 'image']).optional().default('manual'),
      images: z.array(z.string()).optional().default([]),
    })
    .optional()
    .nullable(),
  designPrompt: z.string().optional().default(''),
  designOverrides: z.any().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    const existing = await getGreeting(validated.id);

    const greeting: Greeting = {
      ...validated,
      visualConcept: validated.visualConcept as Greeting['visualConcept'],
      status: existing?.status ?? 'draft',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    await saveGreeting(greeting);

    return NextResponse.json({ success: true, id: greeting.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid greeting data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Save greeting error:', error);
    return NextResponse.json({ error: 'Failed to save greeting' }, { status: 500 });
  }
}
