import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';
import { z } from 'zod';

const GreetingSchema = z.object({
  recipient_name: z.string(),
  event_type: z.string(),
  theme_category: z.string(),
  full_greeting: z.string().refine(
    (val) => {
      const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
      return wordCount >= 100 && wordCount <= 200;
    },
    { message: 'full_greeting must be between 100 and 200 words' }
  ),
  share_data: z.object({
    whatsapp_message: z.string(),
    gmail_subject: z.string(),
    gmail_body: z.string(),
  }),
});

type GreetingResponse = z.infer<typeof GreetingSchema>;

// Ordered by preference: primary model first, then fallbacks tried in order
// if the primary is unavailable or overloaded.
const MODEL_CANDIDATES = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

const MAX_RETRIES_PRIMARY = 3;
const MAX_RETRIES_FALLBACK = 2;
const BASE_BACKOFF_MS = 500;

export type AIErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'AI_UNAVAILABLE'
  | 'AI_INVALID_RESPONSE';

export class AIServiceError extends Error {
  code: AIErrorCode;

  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 503 || status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SYSTEM_PROMPT = `You are a premium Hebrew copywriter specializing in personalized greeting messages.

RULES:
1. Write ONLY in Hebrew
2. NO generic clichés ("בריאות, אושר ועושר", "עד 120", "טוב בעיניך")
3. Create authentic, personal, emotionally resonant text
4. The relationship (who is writing this) and the occasion are the heart of the
   message — that's what makes it feel personal. The theme/hobby is a light garnish,
   NOT the subject: mention it briefly, once or twice at most, only where it fits
   naturally. Never build the whole greeting around the hobby, never use it as an
   extended metaphor running through every paragraph, and never let it crowd out the
   relationship and the occasion themselves.
5. Output EXACTLY as valid JSON (no markdown, no code blocks)
6. Full greeting must be 120-180 words
7. WhatsApp/Gmail share text should be concise (15-25 words)
8. NEVER include a URL or link anywhere in whatsapp_message or gmail_body — the app
   appends the real greeting link automatically after your text. Adding your own
   link would duplicate it.
9. Hebrew is a grammatically gendered language. When the recipient's gender is given,
   every verb, adjective and pronoun addressing the recipient (second person "את/אתה"
   forms, and any third-person references to them) MUST agree with that gender
   throughout full_greeting, whatsapp_message, and gmail_body. If no gender is given,
   default to masculine forms (the Hebrew default), but prefer direct address or
   gender-neutral phrasing where natural to avoid guessing wrong.

RELATIONSHIP & EVENT CONTEXT (the real substance of the message):
- If a relationship is given (e.g. "אמא", "אח", "חבר/ה"), write in a voice that fits
  that relationship's natural tone — a parent's warmth reads differently from a
  sibling's teasing affection or a friend's casual closeness. Let this shape the
  message far more than the theme does.
- Match tone to event (birthday = warmth, achievement = pride, wedding = romance)
- Reference the user's custom notes if provided — these are usually more personal
  and specific than the theme, so they deserve real weight
- Theme/hobby: use it as a small, natural touch (a passing reference, not a
  framing device) if it's provided

OUTPUT FORMAT (strict JSON, no markdown):
{
  "recipient_name": "<name>",
  "event_type": "<event>",
  "theme_category": "<theme_id>",
  "full_greeting": "<120-180 word Hebrew text>",
  "share_data": {
    "whatsapp_message": "היי <name>! 🎉 [message, no link]",
    "gmail_subject": "[subject in Hebrew]",
    "gmail_body": "[2-3 lines in Hebrew]"
  }
}`;

/**
 * Calls a single Gemini model with retries (exponential backoff) for
 * transient 503/429 errors. Rethrows on the final failed attempt so the
 * caller can move on to the next model candidate.
 */
async function callModelWithRetry(
  client: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  maxRetries: number
): Promise<string> {
  const model = client.getGenerativeModel({ model: modelName });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return response.response.text() || '';
    } catch (error) {
      const status =
        error instanceof GoogleGenerativeAIFetchError ? error.status : undefined;
      const isLastAttempt = attempt === maxRetries;

      if (!isRetryableStatus(status) || isLastAttempt) {
        throw error;
      }

      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      console.warn(
        `Gemini model "${modelName}" returned ${status}, retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})`
      );
      await sleep(backoff);
    }
  }

  // Unreachable, but keeps TypeScript happy.
  throw new Error('callModelWithRetry: exhausted retries without returning');
}

/**
 * Sends a prompt through the model candidate list, retrying transient
 * failures and falling back to the next model when one is unavailable.
 */
async function runPrompt(fullPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError(
      'AI_NOT_CONFIGURED',
      'GEMINI_API_KEY is not set in environment variables'
    );
  }

  const client = new GoogleGenerativeAI(apiKey);

  let lastError: unknown;

  for (let i = 0; i < MODEL_CANDIDATES.length; i++) {
    const modelName = MODEL_CANDIDATES[i];
    const maxRetries = i === 0 ? MAX_RETRIES_PRIMARY : MAX_RETRIES_FALLBACK;

    try {
      return await callModelWithRetry(client, modelName, fullPrompt, maxRetries);
    } catch (error) {
      lastError = error;
      const status =
        error instanceof GoogleGenerativeAIFetchError ? error.status : undefined;
      console.error(`Gemini model "${modelName}" failed (status ${status}):`, error);
    }
  }

  const status =
    lastError instanceof GoogleGenerativeAIFetchError ? lastError.status : undefined;

  if (isRetryableStatus(status)) {
    throw new AIServiceError(
      'AI_UNAVAILABLE',
      'All Gemini models are currently overloaded or rate-limited'
    );
  }

  throw new AIServiceError(
    'AI_UNAVAILABLE',
    lastError instanceof Error ? lastError.message : 'Unknown Gemini error'
  );
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new AIServiceError('AI_INVALID_RESPONSE', 'No JSON found in Gemini response');
  }
  return JSON.parse(match[0]);
}

export async function generateGreeting(
  recipientName: string,
  eventType: string,
  theme: string,
  userNotes: string,
  recipientGender?: 'male' | 'female',
  relationship?: string
): Promise<GreetingResponse> {
  const genderLine =
    recipientGender === 'male'
      ? 'Recipient gender: male — use masculine Hebrew grammatical forms throughout (e.g. "אתה", "שלך" referring to a male, verbs conjugated masculine).'
      : recipientGender === 'female'
        ? 'Recipient gender: female — use feminine Hebrew grammatical forms throughout (e.g. "את", "שלך" referring to a female, verbs conjugated feminine).'
        : 'Recipient gender: not specified — default to masculine Hebrew forms, but prefer neutral phrasing where natural.';

  const userPrompt = `Create a greeting for:
- Recipient: ${recipientName}
- Written by (sender's relationship to recipient): ${relationship || 'not specified'}
- Event: ${eventType}
- Theme/hobby (light touch only, see rule 4 — do NOT center the message on this): ${theme}
- Additional notes: ${userNotes || 'None'}
- ${genderLine}

Generate premium Hebrew greeting text that feels personal, not generic. Ground it in
the relationship and the occasion — not in the theme/hobby.`;

  const fullPrompt = SYSTEM_PROMPT + '\n\n' + userPrompt;

  const text = await runPrompt(fullPrompt);

  try {
    return GreetingSchema.parse(extractJson(text));
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    console.error('Failed to parse/validate Gemini response:', error);
    throw new AIServiceError(
      'AI_INVALID_RESPONSE',
      'Gemini returned a response that could not be parsed as valid greeting JSON'
    );
  }
}

/* ------------------------------------------------------------------ *
 * Free-text design brief → structured design spec
 * ------------------------------------------------------------------ */

const HEX = /^#[0-9a-fA-F]{6}$/;
const hexColor = z.string().regex(HEX, 'must be a #rrggbb hex color');

export const DesignSpecSchema = z.object({
  base_style: z.enum([
    'minimal',
    'warm',
    'cinematic',
    'elegant',
    'festive',
    'romantic',
    'playful',
  ]),
  background_colors: z.array(hexColor).min(2).max(3).optional(),
  name_color: hexColor.optional(),
  event_color: hexColor.optional(),
  body_color: hexColor.optional(),
  card_background: hexColor.optional(),
  decor_kind: z
    .enum(['balloons', 'hearts', 'sparkles', 'bubbles', 'stars', 'petals', 'embers'])
    .optional(),
  decor_palette: z.array(hexColor).min(2).max(5).optional(),
  gift_box: hexColor.optional(),
  gift_lid: hexColor.optional(),
  gift_ribbon: hexColor.optional(),
  gift_bow: hexColor.optional(),
  dark_surface: z.boolean().optional(),
  explanation: z.string().min(1).max(400),
});

export type DesignSpec = z.infer<typeof DesignSpecSchema>;

const DESIGN_SYSTEM_PROMPT = `You are a senior visual designer for a premium Hebrew greeting-card product.
The user describes, in free text (usually Hebrew), how they want their greeting card to look and feel.
Translate that description into a concrete design specification.

AVAILABLE BASE STYLES (pick the closest starting point):
- minimal: clean, warm cream background, strong typography, lots of air
- warm: warm terracotta/gold, homely and soft
- cinematic: DARK near-black background, dramatic, high contrast, gold accents
- elegant: DARK navy background with cream text and gold accents, formal and luxurious
- festive: bright, colorful, party energy
- romantic: blush pink and plum, soft and loving
- playful: bright primary colors, fun, youthful

DECORATION TYPES (floating animated objects):
balloons, hearts, sparkles, bubbles, stars, petals, embers

RULES:
1. Always choose the single best base_style for the request.
2. Only override colors when the user's description clearly implies specific colors
   (e.g. "כחול", "זהב", "ירוק כמו הים"). Otherwise omit those fields and keep the base style's colors.
3. All colors MUST be full 6-digit hex strings like "#1b2032". Never use color names, rgb(), or gradients.
4. background_colors: 2-3 hex colors; they will be blended into a gradient.
5. Set dark_surface to true ONLY if the background colors you chose are dark
   (so light text is used). If you omit background_colors, omit dark_surface too.
6. Ensure strong contrast: name_color/body_color/event_color must be clearly readable
   directly on background_colors — the greeting text sits right on the page now, not
   inside a separate card. card_background is only used for one small internal panel
   (the gift-card reveal), so if you set dark_surface true, keep card_background light
   enough that the same name_color/body_color also stay readable there too.
7. explanation: 1-2 short sentences IN HEBREW telling the user what you designed and why.
8. Output STRICT JSON only. No markdown fences, no commentary.

OUTPUT FORMAT:
{
  "base_style": "<one of the styles>",
  "background_colors": ["#rrggbb", "#rrggbb"],
  "card_background": "#rrggbb",
  "name_color": "#rrggbb",
  "event_color": "#rrggbb",
  "body_color": "#rrggbb",
  "decor_kind": "<one of the decoration types>",
  "decor_palette": ["#rrggbb", "#rrggbb"],
  "gift_box": "#rrggbb",
  "gift_lid": "#rrggbb",
  "gift_ribbon": "#rrggbb",
  "gift_bow": "#rrggbb",
  "dark_surface": false,
  "explanation": "<Hebrew explanation>"
}`;

export async function generateDesignSpec(
  description: string,
  context: { recipientName?: string; eventType?: string; theme?: string } = {}
): Promise<DesignSpec> {
  const userPrompt = `The user's design request (free text):
"""
${description}
"""

Card context:
- Recipient: ${context.recipientName || 'unknown'}
- Event: ${context.eventType || 'unknown'}
- Theme: ${context.theme || 'unknown'}

Design the card accordingly.`;

  const text = await runPrompt(DESIGN_SYSTEM_PROMPT + '\n\n' + userPrompt);

  try {
    return DesignSpecSchema.parse(extractJson(text));
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    console.error('Failed to parse/validate design spec:', error);
    throw new AIServiceError(
      'AI_INVALID_RESPONSE',
      'Gemini returned a design spec that could not be parsed'
    );
  }
}
