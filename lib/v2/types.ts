import { z } from 'zod';

/* ------------------------------------------------------------------ *
 * Event types
 * ------------------------------------------------------------------ */

export const EVENT_TYPES = [
  'birthday',
  'love',
  'anniversary',
  'graduation',
  'newborn',
  'discharge',
  'celebration',
  'farewell',
  'justbecause',
  'other',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventMeta {
  id: EventType;
  emoji: string;
  label: string;
  /** Short line shown under the card on the picker. */
  hint: string;
  /** Template the picker pre-selects for this event. */
  defaultTemplate: TemplateId;
  /** Gradient used on the picker card. */
  gradient: string;
}

export const EVENTS: EventMeta[] = [
  {
    id: 'birthday',
    emoji: '🎂',
    label: 'יום הולדת',
    hint: 'החגיגה הכי אישית',
    defaultTemplate: 'birthday',
    gradient: 'linear-gradient(135deg, #ff9a3c 0%, #ff5f6d 100%)',
  },
  {
    id: 'love',
    emoji: '❤️',
    label: 'אהבה',
    hint: 'להגיד את זה יפה',
    defaultTemplate: 'romantic',
    gradient: 'linear-gradient(135deg, #f76b8a 0%, #b5179e 100%)',
  },
  {
    id: 'anniversary',
    emoji: '💍',
    label: 'יום נישואין',
    hint: 'עוד שנה ביחד',
    defaultTemplate: 'elegant',
    gradient: 'linear-gradient(135deg, #c9a227 0%, #7b6121 100%)',
  },
  {
    id: 'graduation',
    emoji: '🎓',
    label: 'סיום לימודים',
    hint: 'הישג ששווה חגיגה',
    defaultTemplate: 'elegant',
    gradient: 'linear-gradient(135deg, #3a7bd5 0%, #1e3c72 100%)',
  },
  {
    id: 'newborn',
    emoji: '👶',
    label: 'לידה',
    hint: 'ברוך הבא לעולם',
    defaultTemplate: 'minimal',
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  },
  {
    id: 'discharge',
    emoji: '🪖',
    label: 'שחרור',
    hint: 'סוף פרק, תחילת פרק',
    defaultTemplate: 'party',
    gradient: 'linear-gradient(135deg, #56ab2f 0%, #276419 100%)',
  },
  {
    id: 'celebration',
    emoji: '🎉',
    label: 'חגיגה',
    hint: 'סתם כי מגיע',
    defaultTemplate: 'party',
    gradient: 'linear-gradient(135deg, #8e2de2 0%, #f857a6 100%)',
  },
  {
    id: 'farewell',
    emoji: '💼',
    label: 'פרידה',
    hint: 'לומר תודה ולהיפרד יפה',
    defaultTemplate: 'minimal',
    gradient: 'linear-gradient(135deg, #667eea 0%, #3b4371 100%)',
  },
  {
    id: 'justbecause',
    emoji: '💌',
    label: 'סתם כי בא לי',
    hint: 'ההפתעה הכי טובה',
    defaultTemplate: 'funny',
    gradient: 'linear-gradient(135deg, #ff6a88 0%, #ff9a8b 100%)',
  },
  {
    id: 'other',
    emoji: '✨',
    label: 'אחר',
    hint: 'ספרו לנו ונתאים',
    defaultTemplate: 'minimal',
    gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  },
];

export const EVENT_BY_ID = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
) as Record<EventType, EventMeta>;

/* ------------------------------------------------------------------ *
 * Relationship & tone
 * ------------------------------------------------------------------ */

export const RELATIONSHIPS = [
  'בן/בת זוג',
  'חבר/ה',
  'אח/ות',
  'הורה',
  'ילד/ה',
  'חבר/ה לעבודה',
  'אחר',
] as const;

export const TONES = [
  { id: 'funny', emoji: '😂', label: 'מצחיק' },
  { id: 'warm', emoji: '❤️', label: 'מרגש' },
  { id: 'emotional', emoji: '🥹', label: 'מרגש מאוד' },
  { id: 'cool', emoji: '😎', label: 'מגניב' },
  { id: 'luxe', emoji: '✨', label: 'יוקרתי' },
  { id: 'party', emoji: '🎉', label: 'מסיבתי' },
] as const;

export type ToneId = (typeof TONES)[number]['id'];

/* ------------------------------------------------------------------ *
 * Templates & scenes
 * ------------------------------------------------------------------ */

export const TEMPLATE_IDS = [
  'birthday',
  'romantic',
  'elegant',
  'funny',
  'minimal',
  'party',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * The interaction beats a greeting can be built from. The template picks
 * which ones it uses and in what order, so adding a new template is a data
 * change — it never touches the AI pipeline or the renderer's plumbing.
 */
export const SCENE_KINDS = [
  'gate-envelope',
  'gate-gift',
  'gate-balloons',
  'reveal',
  'messages',
  'memories',
  'surprise',
  'gift',
  'closing',
] as const;

export type SceneKind = (typeof SCENE_KINDS)[number];

export const MUSIC_MOODS = [
  'romantic',
  'emotional',
  'happy',
  'funny',
  'party',
  'calm',
] as const;

export type MusicMood = (typeof MUSIC_MOODS)[number];

/* ------------------------------------------------------------------ *
 * The AI contract
 *
 * The model returns this structure — never raw prose — so the frontend can
 * render a real interactive experience out of it, and so new templates can
 * reinterpret the same content differently.
 * ------------------------------------------------------------------ */

export const GreetingContentSchema = z.object({
  /** Big hero line, e.g. "יום הולדת שמח נועה". Short. */
  title: z.string().min(1).max(80),
  /** One or two sentences that set the emotional tone. */
  intro: z.string().min(1).max(400),
  /** The body, broken into beats the renderer reveals one at a time. */
  sections: z
    .array(
      z.object({
        heading: z.string().max(80).optional().default(''),
        body: z.string().min(1).max(600),
        kind: z
          .enum(['memory', 'quality', 'wish', 'joke', 'story'])
          .optional()
          .default('wish'),
      })
    )
    .min(1)
    .max(6),
  /** Short punchy standalone lines, shown as cards / bursts. */
  messages: z.array(z.string().min(1).max(180)).max(8).optional().default([]),
  /** The final line, shown on the closing scene. */
  closing: z.string().min(1).max(300),
  /** Hidden extra revealed behind the "יש עוד משהו…" button. */
  surprise: z.string().max(400).optional().default(''),
  tone: z.string().max(40).optional().default(''),
  animation: z.string().max(40).optional().default(''),
  template: z.enum(TEMPLATE_IDS).optional(),
  musicMood: z.enum(MUSIC_MOODS).optional(),
});

export type GreetingContent = z.infer<typeof GreetingContentSchema>;

/* ------------------------------------------------------------------ *
 * Stored greeting
 * ------------------------------------------------------------------ */

export type MediaKind = 'image' | 'video' | 'audio';

/** Where a media item is used in the experience. */
export const MEDIA_ROLES = ['library', 'cover', 'memory', 'final', 'surprise'] as const;
export type MediaRole = (typeof MEDIA_ROLES)[number];

export interface MediaItem {
  /** Stable id so scenes can reference an item without depending on order. */
  id: string;
  url: string;
  type: MediaKind;
  caption?: string;
  /**
   * Which scene this belongs to. Everything uploaded lands in the shared
   * library; assigning a role is what places it in the experience.
   */
  role?: MediaRole;
  width?: number;
  height?: number;
}

/** How a template chooses to present a set of photos. */
export const PHOTO_PRESENTATIONS = [
  'cinematic',
  'polaroid',
  'cards3d',
  'parallax',
  'wall',
] as const;
export type PhotoPresentation = (typeof PHOTO_PRESENTATIONS)[number];

export type PlanId = 'free' | 'premium';

export interface GreetingV2 {
  id: string;
  slug: string;
  ownerToken: string;

  eventType: EventType;
  recipientName: string;
  relationship: string;
  recipientAge: string;
  aboutThem: string;
  sharedMemory: string;
  senderName: string;
  tone: string;

  content: GreetingContent;

  templateId: TemplateId;
  musicTrack: string;
  musicEnabled: boolean;
  media: MediaItem[];
  /** id of the MediaItem used as the opening image. */
  coverMediaId?: string;

  /** The attached digital gift, revealed at the end. */
  gift?: import('./gifts').Gift | null;
  giftInterests?: string[];
  giftBudget?: string;

  plan: PlanId;
  status: 'draft' | 'published';
  allowContributions: boolean;

  viewCount: number;
  openCount: number;

  createdAt: string;
  updatedAt: string;
}

/** What the recipient page is allowed to see — never the owner token. */
export type PublicGreetingV2 = Omit<GreetingV2, 'ownerToken'>;

export function toPublicGreeting(g: GreetingV2): PublicGreetingV2 {
  const { ownerToken: _ownerToken, ...pub } = g;
  return pub;
}
