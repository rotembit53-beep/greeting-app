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

/**
 * What the sender says the recipient is into.
 *
 * `query` is the Hebrew search phrase handed to the places provider — it is
 * what turns an abstract interest into real, nearby businesses. Anything
 * without a `query` (only "surprise me") has no physical place to visit.
 */
export const INTERESTS = [
  { id: 'restaurants', emoji: '🍷', label: 'מסעדות', query: 'מסעדה' },
  { id: 'food', emoji: '☕', label: 'בתי קפה', query: 'בית קפה' },
  { id: 'bar', emoji: '🍸', label: 'בר', query: 'בר קוקטיילים' },
  { id: 'bakery', emoji: '🧁', label: 'קינוחים', query: 'קונדיטוריה' },
  { id: 'spa', emoji: '💆', label: 'ספא ועיסוי', query: 'ספא עיסוי' },
  { id: 'beauty', emoji: '💅', label: 'יופי וטיפוח', query: 'מספרה סלון יופי' },
  { id: 'sports', emoji: '🏋️', label: 'ספורט וכושר', query: 'חדר כושר' },
  { id: 'outdoors', emoji: '🥾', label: 'טבע ואוויר פתוח', query: 'פארק טיולים' },
  { id: 'travel', emoji: '🏖️', label: 'חופשות', query: 'מלון צימר' },
  { id: 'shows', emoji: '🎭', label: 'הופעות ותיאטרון', query: 'תיאטרון אולם הופעות' },
  { id: 'movies', emoji: '🎬', label: 'קולנוע', query: 'קולנוע' },
  { id: 'music', emoji: '🎵', label: 'מוזיקה', query: 'חנות כלי נגינה' },
  { id: 'books', emoji: '📚', label: 'ספרים', query: 'חנות ספרים' },
  { id: 'art', emoji: '🎨', label: 'אומנות ויצירה', query: 'סדנת יצירה גלריה' },
  { id: 'workshops', emoji: '👩‍🍳', label: 'סדנאות וחוגים', query: 'סדנה' },
  { id: 'gaming', emoji: '🎮', label: 'גיימינג', query: 'חנות משחקי מחשב' },
  { id: 'tech', emoji: '🎧', label: 'טכנולוגיה וגאדג׳טים', query: 'חנות אלקטרוניקה' },
  { id: 'shopping', emoji: '🛍️', label: 'שופינג', query: 'קניון' },
  { id: 'kids', emoji: '🧸', label: 'ילדים', query: 'חנות צעצועים' },
  { id: 'pets', emoji: '🐾', label: 'חיות מחמד', query: 'חנות חיות' },
  { id: 'surprise', emoji: '🎁', label: 'לא משנה — תפתיעו אותי' },
] as const;

export type InterestId = (typeof INTERESTS)[number]['id'];

/** The places-search phrase for an interest, when it maps to somewhere real. */
export function interestQuery(id: InterestId): string | undefined {
  const found = INTERESTS.find((i) => i.id === id) as
    | { query?: string }
    | undefined;
  return found?.query;
}

export function interestLabel(id: InterestId): string {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}

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

/**
 * An external URL the recipient will click — rendered into `<a href>`.
 *
 * Only absolute `http(s)` (or empty) is allowed. This is the authoritative
 * guard against a `javascript:`/`data:`/`vbscript:` URI being stored and then
 * executed when React renders the href — React does not strip dangerous
 * schemes itself. Enforced on the schema so both create and update (which
 * share it) are covered at the trust boundary.
 */
const safeHttpUrl = z
  .string()
  .max(600)
  .optional()
  .default('')
  .refine(
    (v) => {
      if (!v) return true;
      try {
        const scheme = new URL(v).protocol.toLowerCase();
        return scheme === 'http:' || scheme === 'https:';
      } catch {
        return false; // relative / unparseable — reject rather than guess
      }
    },
    { message: 'URL must be http(s)' }
  );

/**
 * An image reference rendered into `<img src>`. The app sets this to a
 * same-origin relative path (`/api/media/...`); an absolute `http(s)` URL is
 * also accepted for forward-compat. Everything else — `javascript:`, `data:`,
 * and protocol-relative `//host` (which escapes the origin) — is rejected.
 */
const safeImageRef = z
  .string()
  .max(600)
  .optional()
  .default('')
  .refine(
    (v) => {
      if (!v) return true;
      // Same-origin relative path, but not protocol-relative "//evil".
      if (v.startsWith('/') && !v.startsWith('//')) return true;
      try {
        const scheme = new URL(v).protocol.toLowerCase();
        return scheme === 'http:' || scheme === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Image URL must be http(s) or a same-origin path' }
  );

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
  url: safeHttpUrl,
  imageUrl: safeImageRef,
  provider: z.string().max(60).optional().default(''),
  /**
   * A real business picked from the Google Places results in the "help me
   * find a gift" flow — name and address as Google returned them, plus the
   * deep link into Google Maps. All three travel together; `placeName` is
   * the signal that a place was actually attached (see `hasGift`).
   */
  placeName: z.string().max(160).optional().default(''),
  placeAddress: z.string().max(300).optional().default(''),
  placeMapsUrl: safeHttpUrl,
});

export type Gift = z.infer<typeof GiftSchema>;

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

export interface GiftSearchParams {
  /** What the sender ticked themselves. These drive the results. */
  interests: InterestId[];
  /**
   * Interests the AI read out of the free text. Only ever used to break ties
   * between ideas that already match an explicit pick, or to fill in when the
   * sender ticked nothing — never to introduce an unrelated category.
   */
  inferredInterests?: InterestId[];
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
  /** Fits any interest, so it can top up a thin on-topic list — but always
   *  ranks below a real category match. */
  universal?: boolean;
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
    matches: ['food', 'bakery'],
  },
  {
    kind: 'voucher',
    title: 'שובר לבר',
    description: 'ערב בבר שהם אוהבים',
    emoji: '🍸',
    matches: ['bar'],
  },
  {
    kind: 'voucher',
    title: 'יום פינוק בספא',
    description: 'עיסוי או יום ספא',
    emoji: '💆',
    matches: ['spa', 'travel'],
  },
  {
    kind: 'voucher',
    title: 'שובר לטיפוח',
    description: 'מספרה, סלון יופי או טיפול פנים',
    emoji: '💅',
    matches: ['beauty'],
  },
  {
    kind: 'voucher',
    title: 'סדנה או חוג',
    description: 'בישול, קרמיקה, צילום — משהו שילמדו',
    emoji: '👩‍🍳',
    matches: ['workshops', 'art'],
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
    kind: 'voucher',
    title: 'מנוי לחדר כושר',
    description: 'או כמה אימונים אישיים',
    emoji: '🏋️',
    matches: ['sports'],
  },
  {
    kind: 'ticket',
    title: 'כרטיס לאטרקציה',
    description: 'חוויה או אטרקציה',
    emoji: '🎢',
    matches: ['travel', 'sports', 'kids', 'outdoors'],
  },
  {
    kind: 'voucher',
    title: 'יום בטבע',
    description: 'טיול מודרך, קמפינג או השכרת ציוד',
    emoji: '🥾',
    matches: ['outdoors'],
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
    kind: 'giftcard',
    title: 'כרטיס מתנה לספרים',
    description: 'שיבחרו את הערימה הבאה שלהם',
    emoji: '📚',
    matches: ['books'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה לטכנולוגיה',
    description: 'גאדג׳ט או אביזר שהם רצו',
    emoji: '🎧',
    matches: ['tech'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה לחנות צעצועים',
    description: 'שיבחרו בעצמם מה שבא להם',
    emoji: '🧸',
    matches: ['kids'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה לחנות חיות',
    description: 'פינוק לחבר הכי נאמן שלהם',
    emoji: '🐾',
    matches: ['pets'],
  },
  {
    kind: 'giftcard',
    title: 'כרטיס מתנה לאומנות ויצירה',
    description: 'צבעים, בד או ציוד יצירה',
    emoji: '🎨',
    matches: ['art'],
  },
  {
    kind: 'amount',
    title: 'סכום מתנה',
    description: 'הכי פשוט — והם בוחרים',
    emoji: '💰',
    matches: ['surprise', 'shopping'],
    universal: true,
  },
  {
    kind: 'buyme',
    title: 'שובר BUYME',
    description: 'שובר שניתן לממש במגוון רחב של עסקים',
    emoji: '🎁',
    matches: ['surprise', 'restaurants', 'shopping', 'spa'],
    universal: true,
  },
];

export const catalogueProvider: GiftProvider = {
  id: 'catalogue',
  label: 'קטגוריות',
  live: false,
  async search({ interests, inferredInterests = [], budget }) {
    /* "Surprise me" is the only case where anything goes. Otherwise an idea
     * has to match something the sender explicitly ticked — inferred
     * interests only *rank* the survivors. Previously both sets were merged
     * flat, so a model guess of "food" could outrank the sender's own pick
     * and bury it under restaurant vouchers. */
    const picked = new Set<InterestId>(interests.filter((i) => i !== 'surprise'));
    const inferred = new Set<InterestId>(
      inferredInterests.filter((i) => !picked.has(i))
    );
    const openEnded = picked.size === 0;

    const scored = CATALOGUE.map((entry) => {
      const explicitHits = entry.matches.filter((m) => picked.has(m)).length;
      const inferredHits = entry.matches.filter((m) => inferred.has(m)).length;
      // Weighted so no pile of inferred hits can ever outrank one real pick,
      // and a universal top-up can never outrank an on-topic idea.
      const score = openEnded
        ? 1 + inferredHits
        : explicitHits * 100 + inferredHits * 10 + (entry.universal ? 1 : 0);
      return { entry, score, keep: openEnded || explicitHits > 0 || entry.universal };
    })
      .filter((s) => s.keep)
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
  return Boolean(
    gift && (gift.code || gift.url || gift.imageUrl || gift.amount || gift.placeName)
  );
}

/**
 * A Google Maps link for a gift's attached place.
 *
 * Prefers `placeMapsUrl` — the deep link Google Places returned when the
 * sender picked a real business from search, pinned to that exact
 * `place_id`. Falls back to a plain maps search built from whatever the
 * sender typed by hand, so a manually-entered name/address still gets a
 * working link even though it was never verified against a real place.
 */
export function giftMapsUrl(
  gift: Pick<Gift, 'placeMapsUrl' | 'placeName' | 'placeAddress'>
): string | undefined {
  if (gift.placeMapsUrl) return gift.placeMapsUrl;
  const q = [gift.placeName, gift.placeAddress].filter(Boolean).join(' ').trim();
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : undefined;
}
