import { z } from 'zod';

/**
 * Gift layer.
 *
 * HARD RULE, enforced by the shape of this module: we never invent vendor
 * names, prices, availability or purchase links. Suggestions are *category
 * level* only ("a restaurant voucher"), priced at the budget the sender
 * themselves chose. Anything that would require real commercial data comes
 * from a `GiftProvider`, and until a real one is connected the catalogue is
 * explicitly marked as unfulfilled so the UI can say so honestly.
 */

/* ------------------------------------------------------------------ *
 * Interests & budget
 * ------------------------------------------------------------------ */

export const INTERESTS = [
  { id: 'food', emoji: '☕', label: 'אוכל' },
  { id: 'restaurants', emoji: '🍷', label: 'מסעדות' },
  { id: 'movies', emoji: '🎬', label: 'סרטים' },
  { id: 'music', emoji: '🎵', label: 'מוזיקה' },
  { id: 'travel', emoji: '🏖️', label: 'חופשות' },
  { id: 'spa', emoji: '💆', label: 'ספא' },
  { id: 'shopping', emoji: '🛍️', label: 'שופינג' },
  { id: 'gaming', emoji: '🎮', label: 'גיימינג' },
  { id: 'sports', emoji: '🏋️', label: 'ספורט' },
  { id: 'shows', emoji: '🎭', label: 'הופעות' },
  { id: 'surprise', emoji: '🎁', label: 'לא משנה — תפתיע אותי' },
] as const;

export type InterestId = (typeof INTERESTS)[number]['id'];

export const INTEREST_IDS = INTERESTS.map((i) => i.id) as [InterestId, ...InterestId[]];

export const BUDGETS = [50, 100, 150, 250, 500] as const;

/* ------------------------------------------------------------------ *
 * Gift kinds
 * ------------------------------------------------------------------ */

export const GIFT_KINDS = ['giftcard', 'buyme', 'ticket', 'voucher', 'amount'] as const;
export type GiftKind = (typeof GIFT_KINDS)[number];

export const GIFT_KIND_META: Record<
  GiftKind,
  { emoji: string; label: string; hint: string }
> = {
  giftcard: { emoji: '🎫', label: 'כרטיס מתנה', hint: 'כרטיס מתנה דיגיטלי' },
  buyme: { emoji: '🎁', label: 'BUYME', hint: 'שובר BUYME' },
  ticket: { emoji: '🎟️', label: 'כרטיס', hint: 'הופעה, קולנוע, ספורט או אטרקציה' },
  voucher: { emoji: '🍽️', label: 'שובר', hint: 'מסעדה, ספא, בית קפה או חוויה' },
  amount: { emoji: '💰', label: 'סכום מתנה', hint: 'סכום כסף' },
};

/* ------------------------------------------------------------------ *
 * A suggestion (what we propose) vs. a gift (what got attached)
 * ------------------------------------------------------------------ */

export interface GiftSuggestion {
  id: string;
  kind: GiftKind;
  /** Category-level title. Never a real business name unless a provider supplied it. */
  title: string;
  description: string;
  emoji: string;
  /** The sender's own budget, echoed back — never a quoted market price. */
  amount?: number;
  /** Which interests this matches, for the "why this" line. */
  matches: InterestId[];
  /**
   * True when this came from a real provider integration with real
   * availability. False for catalogue suggestions the sender still has to
   * fulfil themselves.
   */
  fulfillable: boolean;
  /** Real provider checkout URL. Only ever set by a real provider. */
  checkoutUrl?: string;
  provider?: string;
}

export const GiftSchema = z.object({
  kind: z.enum(GIFT_KINDS),
  title: z.string().min(1).max(120),
  description: z.string().max(400).optional().default(''),
  emoji: z.string().max(8).optional().default('🎁'),
  amount: z.number().min(0).max(100000).optional(),
  currency: z.literal('ILS').optional().default('ILS'),
  /** Personal line shown with the gift when it's revealed. */
  note: z.string().max(300).optional().default(''),
  /** Redemption details the sender pastes in (code / link / photo of a card). */
  code: z.string().max(120).optional().default(''),
  url: z.string().max(600).optional().default(''),
  imageUrl: z.string().max(600).optional().default(''),
  provider: z.string().max(60).optional().default(''),
});

export type Gift = z.infer<typeof GiftSchema>;

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

export interface GiftSearchParams {
  interests: InterestId[];
  budget?: number;
  recipientName?: string;
}

export interface GiftProvider {
  id: string;
  label: string;
  /** False until real credentials / API access exist. */
  live: boolean;
  search(params: GiftSearchParams): Promise<GiftSuggestion[]>;
}

/**
 * The built-in catalogue.
 *
 * This is NOT mock commercial data — it deliberately contains no vendors,
 * no market prices and no purchase links. It maps an interest to the *kind*
 * of gift that fits, and the sender supplies the actual voucher/code/link.
 * A real provider (BUYME etc.) can be registered alongside it later and its
 * results will simply rank first because they're `fulfillable`.
 */
const CATALOGUE: {
  kind: GiftKind;
  title: string;
  description: string;
  emoji: string;
  matches: InterestId[];
}[] = [
  {
    kind: 'voucher',
    title: 'שובר למסעדה',
    description: 'ערב במסעדה שהם בוחרים',
    emoji: '🍽️',
    matches: ['restaurants', 'food'],
  },
  {
    kind: 'voucher',
    title: 'שובר לבית קפה',
    description: 'קפה ומאפה על חשבונכם',
    emoji: '☕',
    matches: ['food'],
  },
  {
    kind: 'voucher',
    title: 'יום פינוק בספא',
    description: 'עיסוי או יום ספא',
    emoji: '💆',
    matches: ['spa', 'travel'],
  },
  {
    kind: 'ticket',
    title: 'כרטיס להופעה',
    description: 'מוזיקה, סטנדאפ או תיאטרון',
    emoji: '🎭',
    matches: ['shows', 'music'],
  },
  {
    kind: 'ticket',
    title: 'כרטיס לקולנוע',
    description: 'ערב סרט',
    emoji: '🎬',
    matches: ['movies'],
  },
  {
    kind: 'ticket',
    title: 'כרטיס לאירוע ספורט',
    description: 'משחק או אירוע ספורט',
    emoji: '🏟️',
    matches: ['sports'],
  },
  {
    kind: 'ticket',
    title: 'כרטיס לאטרקציה',
    description: 'חוויה או אטרקציה',
    emoji: '🎢',
    matches: ['travel', 'sports'],
  },
  {
    kind: 'voucher',
    title: 'שובר לחופשה',
    description: 'לילה במלון או סופ״ש',
    emoji: '🏖️',
    matches: ['travel'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה לשופינג',
    description: 'שיבחרו לעצמם בדיוק מה שבא להם',
    emoji: '🛍️',
    matches: ['shopping'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה לגיימינג',
    description: 'קרדיט לחנות המשחקים שלהם',
    emoji: '🎮',
    matches: ['gaming'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה למוזיקה',
    description: 'מנוי או קרדיט למוזיקה',
    emoji: '🎧',
    matches: ['music'],
  },
  {
    kind: 'amount',
    title: 'סכום מתנה',
    description: 'הכי פשוט — והם בוחרים',
    emoji: '💰',
    matches: ['surprise', 'shopping'],
  },
  {
    kind: 'buyme',
    title: 'שובר BUYME',
    description: 'שובר שניתן לממש במגוון רחב של עסקים',
    emoji: '🎁',
    matches: ['surprise', 'restaurants', 'shopping', 'spa'],
  },
];

export const catalogueProvider: GiftProvider = {
  id: 'catalogue',
  label: 'קטגוריות',
  live: false,
  async search({ interests, budget }) {
    const wanted = new Set(interests);
    const surprise = wanted.has('surprise') || wanted.size === 0;

    const scored = CATALOGUE.map((entry) => {
      const hits = entry.matches.filter((m) => wanted.has(m)).length;
      return { entry, score: surprise ? 1 : hits };
    })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 6).map(({ entry }, i) => ({
      id: `catalogue-${entry.kind}-${i}`,
      kind: entry.kind,
      title: entry.title,
      description: entry.description,
      emoji: entry.emoji,
      amount: budget,
      matches: entry.matches,
      // Honest: we can't fulfil this — the sender brings the actual voucher.
      fulfillable: false,
    }));
  },
};

/** Registered providers, highest-value first. */
const PROVIDERS: GiftProvider[] = [catalogueProvider];

export function registerProvider(provider: GiftProvider) {
  PROVIDERS.unshift(provider);
}

export async function suggestGifts(params: GiftSearchParams): Promise<GiftSuggestion[]> {
  const results = await Promise.all(PROVIDERS.map((p) => p.search(params).catch(() => [])));
  // Real, purchasable options always outrank catalogue categories.
  return results.flat().sort((a, b) => Number(b.fulfillable) - Number(a.fulfillable));
}

/** True when the greeting actually has something to reveal. */
export function hasGift(gift: Gift | null | undefined): gift is Gift {
  return Boolean(gift && (gift.code || gift.url || gift.imageUrl || gift.amount));
}
