import { NextRequest, NextResponse } from 'next/server';
import { generateGreeting, AIServiceError } from '@/lib/gemini';
import { z } from 'zod';

const RequestSchema = z.object({
  recipientName: z.string().min(1),
  eventType: z.string().min(1),
  theme: z.string().min(1),
  userNotes: z.string().optional(),
  recipientGender: z.enum(['male', 'female']).optional(),
  relationship: z.string().max(60).optional(),
});

const ERROR_STATUS: Record<AIServiceError['code'], number> = {
  AI_NOT_CONFIGURED: 500,
  AI_UNAVAILABLE: 503,
  AI_INVALID_RESPONSE: 502,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    const greeting = await generateGreeting(
      validated.recipientName,
      validated.eventType,
      validated.theme,
      validated.userNotes || '',
      validated.recipientGender,
      validated.relationship
    );

    return NextResponse.json({
      success: true,
      greeting: {
        fullGreeting: greeting.full_greeting,
        shareData: {
          whatsappMessage: greeting.share_data.whatsapp_message,
          gmailSubject: greeting.share_data.gmail_subject,
          gmailBody: greeting.share_data.gmail_body,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errorCode: 'VALIDATION_ERROR', error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (error instanceof AIServiceError) {
      console.error(`Greeting generation error [${error.code}]:`, error.message);
      return NextResponse.json(
        { errorCode: error.code, error: 'Failed to generate greeting' },
        { status: ERROR_STATUS[error.code] }
      );
    }

    console.error('Unexpected greeting generation error:', error);
    return NextResponse.json(
      { errorCode: 'AI_UNAVAILABLE', error: 'Failed to generate greeting' },
      { status: 500 }
    );
  }
}
