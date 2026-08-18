import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateDesignSpec, AIServiceError } from '@/lib/gemini';
import { DesignOverrides } from '@/lib/visualStyles';

const RequestSchema = z.object({
  description: z.string().min(3).max(600),
  recipientName: z.string().optional(),
  eventType: z.string().optional(),
  theme: z.string().optional(),
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

    const spec = await generateDesignSpec(validated.description, {
      recipientName: validated.recipientName,
      eventType: validated.eventType,
      theme: validated.theme,
    });

    const overrides: DesignOverrides = {
      baseStyle: spec.base_style,
      backgroundColors: spec.background_colors,
      cardBackground: spec.card_background,
      nameColor: spec.name_color,
      eventColor: spec.event_color,
      bodyColor: spec.body_color,
      decorKind: spec.decor_kind,
      decorPalette: spec.decor_palette,
      gift: {
        box: spec.gift_box,
        lid: spec.gift_lid,
        ribbon: spec.gift_ribbon,
        bow: spec.gift_bow,
      },
      darkSurface: spec.dark_surface,
      explanation: spec.explanation,
    };

    return NextResponse.json({ success: true, overrides });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errorCode: 'VALIDATION_ERROR', error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (error instanceof AIServiceError) {
      console.error(`Design generation error [${error.code}]:`, error.message);
      return NextResponse.json(
        { errorCode: error.code, error: 'Failed to generate design' },
        { status: ERROR_STATUS[error.code] }
      );
    }

    console.error('Unexpected design generation error:', error);
    return NextResponse.json(
      { errorCode: 'AI_UNAVAILABLE', error: 'Failed to generate design' },
      { status: 500 }
    );
  }
}
