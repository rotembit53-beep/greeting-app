import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
import {
  EVENT_BY_ID,
  EventType,
  GreetingContent,
  GreetingContentSchema,
  TemplateId,
} from './types';

/**
 * V2's generation pipeline.
 *
 * Self-contained on purpose: V1 keeps using lib/gemini.ts exactly as it is,
 * so V2's prompt, model list and output contract can change freely while the
 * two versions are being compared.
 *
 * The key difference from V1: this returns a *structured document*, not a
 * paragraph. The renderer turns that structure into an interactive
 * experience, and new templates can reinterpret the same content without the
 * generation step knowing anything about them.
 */

const MODEL_CANDIDATES = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
const MAX_RETRIES_PRIMARY = 3;
const MAX_RETRIES_FALLBACK = 2;
const BASE_BACKOFF_MS = 500;

export type AIErrorCode = 'AI_NOT_CONFIGURED' | 'AI_UNAVAILABLE' | 'AI_INVALID_RESPONSE';

export class AIError extends Error {
  code: AIErrorCode;
  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.name = 'AIError';
    this.code = code;
  }
}

async function apiKey(): Promise<string> {
  // Secrets live in .dev.vars / wrangler secrets, which reach the Cloudflare
  // env binding rather than process.env — same pattern as lib/mailer.ts.
  const { env } = await getCloudflareContext({ async: true });
  const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new AIError('AI_NOT_CONFIGURED', 'GEMINI_API_KEY is not configured');
  }
  return key;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isRetryable = (status?: number) => status === 503 || status === 429;

async function callModel(
  client: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  maxRetries: number
): Promise<string> {
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      // Asking the SDK for JSON directly removes most parse failures.
      responseMimeType: 'application/json',
      temperature: 1.0,
      // The document runs to a few hundred Hebrew words across several
      // fields; at the default cap the JSON came back truncated mid-string
      // and could never parse. Hebrew is also token-hungry, so leave room.
      maxOutputTokens: 8192,
    },
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return res.response.text() || '';
    } catch (error) {
      const status =
        error instanceof GoogleGenerativeAIFetchError ? error.status : undefined;
      if (!isRetryable(status) || attempt === maxRetries) throw error;
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error('callModel: retries exhausted');
}

async function runPrompt(prompt: string): Promise<string> {
  const client = new GoogleGenerativeAI(await apiKey());
  let lastError: unknown;

  for (let i = 0; i < MODEL_CANDIDATES.length; i++) {
    try {
      return await callModel(
        client,
        MODEL_CANDIDATES[i],
        prompt,
        i === 0 ? MAX_RETRIES_PRIMARY : MAX_RETRIES_FALLBACK
      );
    } catch (error) {
      lastError = error;
      console.error(`[v2] model ${MODEL_CANDIDATES[i]} failed:`, error);
    }
  }

  throw new AIError(
    'AI_UNAVAILABLE',
    lastError instanceof Error ? lastError.message : 'Unknown AI error'
  );
}

/**
 * Pulls the first *balanced* JSON object out of a model response.
 *
 * A greedy /\{[\s\S]*\}/ is wrong here: models sometimes emit the shape
 * template and then the real answer, and a greedy match spans both objects,
 * so JSON.parse dies with "unexpected non-whitespace after JSON". Counting
 * braces (while respecting strings and escapes) takes just the first object.
 */
function firstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function extractJson(text: string): unknown {
  // Strip markdown fences the model may add despite being told not to.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }

  const candidate = firstJsonObject(cleaned);
  if (!candidate) {
    console.error('[v2] no JSON object found. Response began:', cleaned.slice(0, 300));
    throw new AIError('AI_INVALID_RESPONSE', 'No JSON object in model response');
  }

  try {
    return JSON.parse(candidate);
  } catch (error) {
    // Must be an AIError, not a raw SyntaxError — otherwise the route
    // reports this as AI_UNAVAILABLE and hides the real cause.
    console.error('[v2] JSON parse failed:', error, '| candidate:', candidate.slice(0, 300));
    throw new AIError('AI_INVALID_RESPONSE', 'Model response was not valid JSON');
  }
}

const SYSTEM_PROMPT = `You are the writer behind a premium Hebrew "interactive surprise" product.
People use it to send someone they love a personal, emotional, interactive greeting.

You do NOT write a paragraph. You return a STRUCTURED JSON DOCUMENT that a frontend
turns into an interactive experience revealed beat by beat.

VOICE RULES
1. Write ONLY in Hebrew.
2. Write as the SENDER, in first person, speaking directly TO the recipient.
3. Hebrew is gendered. Infer the recipient's gender from the relationship and the
   description, and keep every verb/pronoun consistent throughout. If genuinely
   unclear, prefer direct address that works for both.
4. NO clichés. Ban outright: "בריאות אושר ועושר", "עד 120", "שיהיה רק טוב",
   "המשך שנה נפלאה". If a line could be sent to any person on earth, rewrite it.
5. The specific details the sender gave you (the description, the shared memory)
   are the whole point. Use them concretely — reference the actual thing, don't
   abstract it into "הזיכרונות שלנו".
6. Match the requested tone honestly. "מצחיק" should actually be funny and a bit
   cheeky. "מרגש מאוד" is allowed to be sincere and to land hard.
7. Never invent facts that contradict what you were told. If you were given little,
   lean on warmth and the relationship rather than fabricating specifics.
8. Never include URLs, links, hashtags, or the product's name.

STRUCTURE RULES
- title: the big hero line. Very short (2-5 words), includes the name. It is
  displayed at a huge size, so it must not wrap awkwardly.
- intro: 1-2 sentences that open the moment, right after the title appears.
- sections: 2-4 beats. Each is revealed on its own as the recipient scrolls.
  Give each a "kind": "memory" (the shared memory), "quality" (what they're like),
  "wish" (what you wish for them), "joke", or "story".
  heading is optional and should be SHORT (2-4 words) or empty.
- messages: 3-5 very short standalone lines (max ~12 words each). These render as
  punchy cards. Think of them as the lines someone would screenshot.
- closing: the last thing they read. Warm, personal, lands the emotion.
- surprise: one extra hidden line revealed behind a "there's more…" button.
  Make it feel like a genuine bonus — the most personal or funniest line of all.

Return ONLY the JSON object. No markdown fences, no commentary.`;

function buildUserPrompt(input: GenerateInput): string {
  const event = EVENT_BY_ID[input.eventType];
  const lines = [
    `Occasion: ${event?.label ?? input.eventType}`,
    `Recipient's name: ${input.recipientName}`,
    `Sender's relationship to them: ${input.relationship || 'not specified'}`,
  ];

  if (input.recipientAge) lines.push(`Recipient's age: ${input.recipientAge}`);
  if (input.senderName) lines.push(`Sender's name: ${input.senderName}`);
  if (input.aboutThem) lines.push(`What the sender says about them: """${input.aboutThem}"""`);
  if (input.sharedMemory) lines.push(`A shared memory: """${input.sharedMemory}"""`);
  if (input.tone) lines.push(`Requested tone: ${input.tone}`);

  // The field list is described rather than shown as a JSON literal: given a
  // literal template, models tend to echo it back before the real answer,
  // which puts two objects in the response.
  return `${lines.join('\n')}

Write the structured greeting document now.

Output exactly ONE JSON object and nothing else, with these keys:
- title (string)
- intro (string)
- sections (array of objects, each with: heading string, body string, kind one of memory/quality/wish/joke/story)
- messages (array of strings)
- closing (string)
- surprise (string)
- tone (string)
- animation (string)
- template (one of: birthday, romantic, elegant, funny, minimal, party)
- musicMood (one of: romantic, emotional, happy, funny, party, calm)`;
}

export interface GenerateInput {
  eventType: EventType;
  recipientName: string;
  relationship: string;
  recipientAge?: string;
  aboutThem?: string;
  sharedMemory?: string;
  senderName?: string;
  tone?: string;
  /** The template the user already picked, if any — the AI won't override it. */
  preferredTemplate?: TemplateId;
}

export async function generateGreetingContent(
  input: GenerateInput
): Promise<GreetingContent> {
  const raw = await runPrompt(`${SYSTEM_PROMPT}\n\n${buildUserPrompt(input)}`);

  const parsed = GreetingContentSchema.safeParse(extractJson(raw));
  if (!parsed.success) {
    console.error('[v2] content failed validation:', parsed.error.issues);
    throw new AIError(
      'AI_INVALID_RESPONSE',
      'Model returned a document that did not match the greeting contract'
    );
  }

  // The user's explicit template choice always wins over the model's suggestion.
  if (input.preferredTemplate) {
    parsed.data.template = input.preferredTemplate;
  }

  return parsed.data;
}

/* ------------------------------------------------------------------ *
 * Gift interest matching
 * ------------------------------------------------------------------ */

const GIFT_SYSTEM_PROMPT = `You infer what someone would enjoy receiving, from a free-text
description written by the person who knows them.

You do NOT invent gifts, brands, businesses, prices, or availability. Your ONLY job is to
pick which of a fixed list of interest categories the description supports.

Return JSON: { "interests": ["id", ...], "reason": "<one short Hebrew sentence>" }

- Pick 2-4 ids, most confident first.
- Use ONLY ids from the allowed list you are given. Never invent an id.
- If the description gives you nothing to go on, return ["surprise"].
- "reason" is one short sentence in Hebrew explaining the match, addressed to the sender.`;

/**
 * Maps a free-text description onto the fixed interest taxonomy.
 *
 * Constrained to a closed enum by design: the model chooses categories, and
 * the catalogue turns those into gift ideas. That makes it structurally
 * impossible for the AI to fabricate a vendor, a price or a product.
 */
export async function suggestGiftInterests(input: {
  aboutThem?: string;
  sharedMemory?: string;
  recipientName?: string;
  allowedIds: readonly string[];
}): Promise<{ interests: string[]; reason: string }> {
  const description = [input.aboutThem, input.sharedMemory].filter(Boolean).join('\n');

  if (!description.trim()) {
    return { interests: ['surprise'], reason: '' };
  }

  const prompt = `${GIFT_SYSTEM_PROMPT}

Allowed interest ids: ${input.allowedIds.join(', ')}

Recipient: ${input.recipientName || 'unknown'}
What the sender wrote about them:
"""
${description}
"""`;

  const raw = await runPrompt(prompt);
  const parsed = z
    .object({
      interests: z.array(z.string()).max(6).optional().default([]),
      reason: z.string().max(300).optional().default(''),
    })
    .safeParse(extractJson(raw));

  if (!parsed.success) {
    throw new AIError('AI_INVALID_RESPONSE', 'Gift interest matching returned bad JSON');
  }

  // Drop anything outside the taxonomy rather than trusting the model.
  const allowed = new Set(input.allowedIds);
  const interests = parsed.data.interests.filter((i) => allowed.has(i));

  return {
    interests: interests.length ? interests : ['surprise'],
    reason: parsed.data.reason,
  };
}
