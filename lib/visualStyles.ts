export type VisualConcept =
  | 'minimal'
  | 'warm'
  | 'cinematic'
  | 'elegant'
  | 'festive'
  | 'romantic'
  | 'playful';

export type DecorKind =
  | 'balloons'
  | 'hearts'
  | 'sparkles'
  | 'bubbles'
  | 'stars'
  | 'petals'
  | 'embers'
  // Subject-matched sets, chosen from the event type
  | 'cakes'
  | 'rings'
  | 'diplomas'
  | 'military'
  | 'baby';

export interface VisualStyle {
  id: VisualConcept;
  label: string;
  description: string;
  swatches: string[];
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  borderRadius: string;
  /** Gradient drawn over the hero photo; null means no overlay (plain photo). */
  heroOverlay: string | null;
  /** Text colors tuned for the small on-card surfaces that remain (the
   * gift-card scratch reveal panel) — i.e. readable against cardBackground. */
  nameColor: string;
  eventColor: string;
  bodyColor: string;
  /** Subtle repeating dot pattern behind the card, used only by the festive style. */
  pattern: boolean;
  /** Colors of the gift box shown on the opening screen. */
  gift: { box: string; lid: string; ribbon: string; bow: string };
  /** Soft glow color (rgba) used behind the gift and as ambient background light. */
  glow: string;
  /** Which floating decoration this style uses by default (event type can override). */
  decorKind: DecorKind;
  decorPalette: string[];
  /**
   * Text colors for content sitting directly on pageBackground — the opening
   * gate, and the greeting itself now that it isn't wrapped in its own card.
   * Default to nameColor/eventColor/bodyColor, which is correct whenever
   * pageBackground and cardBackground are close in tone (true for every
   * built-in style except 'elegant', a deliberate dark-page design where the
   * card-tuned colors would be unreadable directly on the page).
   */
  pageNameColor?: string;
  pageEventColor?: string;
  pageBodyColor?: string;
  /** True when the page background is dark, so the logo needs its light variant. */
  darkSurface?: boolean;
}

export const VISUAL_STYLES: Record<VisualConcept, VisualStyle> = {
  minimal: {
    id: 'minimal',
    label: 'מינימלי',
    description: 'עיצוב נקי ומדויק עם טיפוגרפיה חזקה והרבה אוויר',
    swatches: ['#faf6f1', '#e9dfd5', '#2b2320'],
    pageBackground: '#faf6f1',
    cardBackground: '#fffdfb',
    cardBorder: '#e9dfd5',
    cardShadow: '0 4px 24px rgba(43, 35, 32, 0.06)',
    borderRadius: '1.25rem',
    heroOverlay: null,
    nameColor: '#2b2320',
    eventColor: '#bf5539',
    bodyColor: '#2b2320',
    pattern: false,
    gift: { box: '#e9dfd5', lid: '#2b2320', ribbon: '#fffdfb', bow: '#d99a4e' },
    glow: 'rgba(217, 154, 78, 0.22)',
    decorKind: 'sparkles',
    decorPalette: ['#d99a4e', '#e8c88f', '#bf5539'],
  },
  warm: {
    id: 'warm',
    label: 'חם ולבבי',
    description: 'צבעים חמים ותחושה ביתית, רכה ומרגשת',
    swatches: ['#bf5539', '#d99a4e', '#f7e9e3'],
    pageBackground: 'radial-gradient(circle at 20% 0%, #f7e9e3 0%, #faf1e8 45%, #f3e4d6 100%)',
    cardBackground: '#fffaf5',
    cardBorder: '#f0d9cd',
    cardShadow: '0 10px 32px rgba(191, 85, 57, 0.12)',
    borderRadius: '1.5rem',
    heroOverlay: null,
    nameColor: '#8f3d26',
    eventColor: '#bf5539',
    bodyColor: '#3a2c24',
    pattern: false,
    gift: { box: '#bf5539', lid: '#a2432b', ribbon: '#faf6f1', bow: '#d99a4e' },
    glow: 'rgba(191, 85, 57, 0.28)',
    decorKind: 'embers',
    decorPalette: ['#d99a4e', '#bf5539', '#e8b04e', '#f0c987'],
  },
  cinematic: {
    id: 'cinematic',
    label: 'קולנועי',
    description: 'אווירה דרמטית עם עומק, תנועה וניגודיות גבוהה',
    swatches: ['#181410', '#6f6259', '#d99a4e'],
    pageBackground: '#14110e',
    cardBackground: '#1e1a16',
    cardBorder: '#332c25',
    cardShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    borderRadius: '0.75rem',
    heroOverlay: 'linear-gradient(0deg, rgba(20,17,14,0.95) 0%, rgba(20,17,14,0.25) 55%, rgba(20,17,14,0.05) 100%)',
    nameColor: '#fdf8f3',
    eventColor: '#d99a4e',
    bodyColor: '#d8d0c8',
    pattern: false,
    gift: { box: '#2c2620', lid: '#d99a4e', ribbon: '#c9a463', bow: '#f0c987' },
    glow: 'rgba(217, 154, 78, 0.35)',
    decorKind: 'embers',
    decorPalette: ['#d99a4e', '#c9a463', '#f0c987'],
    darkSurface: true,
  },
  elegant: {
    id: 'elegant',
    label: 'אלגנטי',
    description: 'עומק כהה עם מגע זהב ומרווחים מהודרים',
    swatches: ['#232a3d', '#c9a463', '#f5f1e8'],
    pageBackground: '#1b2032',
    cardBackground: '#f5f1e8',
    cardBorder: '#c9a463',
    cardShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
    borderRadius: '0.5rem',
    heroOverlay: null,
    nameColor: '#232a3d',
    eventColor: '#a67c34',
    bodyColor: '#3a3628',
    pattern: false,
    gift: { box: '#232a3d', lid: '#c9a463', ribbon: '#f5f1e8', bow: '#c9a463' },
    glow: 'rgba(201, 164, 99, 0.35)',
    decorKind: 'bubbles',
    decorPalette: ['#c9a463', '#e5d3ac', '#f5f1e8'],
    pageNameColor: '#f5f1e8',
    pageEventColor: '#c9a463',
    pageBodyColor: '#cfc8b8',
    darkSurface: true,
  },
  festive: {
    id: 'festive',
    label: 'חגיגי',
    description: 'צבעוני ותוסס, לאווירה של מסיבה וחגיגה',
    swatches: ['#bf5539', '#d99a4e', '#4a7c59'],
    pageBackground: 'linear-gradient(160deg, #fdf0e4 0%, #f9e5da 50%, #f4e8dc 100%)',
    cardBackground: '#ffffff',
    cardBorder: '#f0d9cd',
    cardShadow: '0 12px 36px rgba(191, 85, 57, 0.14)',
    borderRadius: '1.75rem',
    heroOverlay: null,
    nameColor: '#bf5539',
    eventColor: '#4a7c59',
    bodyColor: '#2b2320',
    pattern: true,
    gift: { box: '#bf5539', lid: '#4a7c59', ribbon: '#ffffff', bow: '#d99a4e' },
    glow: 'rgba(217, 154, 78, 0.3)',
    decorKind: 'balloons',
    decorPalette: ['#bf5539', '#d99a4e', '#3d8bfd', '#e63946', '#4a7c59'],
  },
  romantic: {
    id: 'romantic',
    label: 'רומנטי',
    description: 'ורדרד ועדין, עם נגיעות סגול עמוק ורוך של אהבה',
    swatches: ['#f6e3e6', '#c76d7e', '#5d3a4a'],
    pageBackground: 'radial-gradient(circle at 80% 10%, #fbeef0 0%, #f6e3e6 50%, #efd6db 100%)',
    cardBackground: '#fffafa',
    cardBorder: '#eccfd5',
    cardShadow: '0 12px 36px rgba(199, 109, 126, 0.16)',
    borderRadius: '1.5rem',
    heroOverlay: null,
    nameColor: '#5d3a4a',
    eventColor: '#c76d7e',
    bodyColor: '#463038',
    pattern: false,
    gift: { box: '#c76d7e', lid: '#5d3a4a', ribbon: '#fffafa', bow: '#e2989f' },
    glow: 'rgba(199, 109, 126, 0.3)',
    decorKind: 'petals',
    decorPalette: ['#e2989f', '#c76d7e', '#f3c6cc', '#d98a97'],
  },
  playful: {
    id: 'playful',
    label: 'שובב וצעיר',
    description: 'צבעים עליזים ואנרגיה של כיף, מתאים לילדים ולצעירים ברוחם',
    swatches: ['#3d8bfd', '#ffb703', '#e63946'],
    pageBackground: 'linear-gradient(135deg, #eef6ff 0%, #fff8e7 50%, #ffeef0 100%)',
    cardBackground: '#ffffff',
    cardBorder: '#d8e6f7',
    cardShadow: '0 12px 36px rgba(61, 139, 253, 0.14)',
    borderRadius: '2rem',
    heroOverlay: null,
    nameColor: '#1d5fc2',
    eventColor: '#e63946',
    bodyColor: '#2b2320',
    pattern: true,
    gift: { box: '#3d8bfd', lid: '#e63946', ribbon: '#ffffff', bow: '#ffb703' },
    glow: 'rgba(61, 139, 253, 0.28)',
    decorKind: 'stars',
    decorPalette: ['#3d8bfd', '#ffb703', '#e63946', '#4a7c59', '#8e6bd6'],
  },
};

export const VISUAL_STYLE_LIST = Object.values(VISUAL_STYLES);

export const DEFAULT_VISUAL_CONCEPT: VisualConcept = 'minimal';

/** AI-generated tweaks layered on top of a base style. */
export interface DesignOverrides {
  baseStyle: VisualConcept;
  backgroundColors?: string[];
  cardBackground?: string;
  nameColor?: string;
  eventColor?: string;
  bodyColor?: string;
  decorKind?: DecorKind;
  decorPalette?: string[];
  gift?: Partial<VisualStyle['gift']>;
  darkSurface?: boolean;
  explanation?: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Only allow strict hex values through — these end up in inline styles. */
function safeHex(value: string | undefined): string | undefined {
  return value && HEX_RE.test(value) ? value : undefined;
}

function safeHexList(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  const clean = values.filter((v) => HEX_RE.test(v));
  return clean.length ? clean : undefined;
}

/**
 * Merges an AI design brief onto its base style. Anything missing or invalid
 * falls back to the base style, so the card always renders sensibly.
 */
export function resolveVisualStyle(
  concept: VisualConcept,
  overrides?: DesignOverrides | null
): VisualStyle {
  const base = VISUAL_STYLES[overrides?.baseStyle ?? concept] ?? VISUAL_STYLES.minimal;
  if (!overrides) return base;

  const bg = safeHexList(overrides.backgroundColors);
  const decorPalette = safeHexList(overrides.decorPalette);

  return {
    ...base,
    pageBackground: bg
      ? bg.length >= 3
        ? `linear-gradient(160deg, ${bg[0]} 0%, ${bg[1]} 50%, ${bg[2]} 100%)`
        : `linear-gradient(160deg, ${bg[0]} 0%, ${bg[1]} 100%)`
      : base.pageBackground,
    cardBackground: safeHex(overrides.cardBackground) ?? base.cardBackground,
    nameColor: safeHex(overrides.nameColor) ?? base.nameColor,
    eventColor: safeHex(overrides.eventColor) ?? base.eventColor,
    bodyColor: safeHex(overrides.bodyColor) ?? base.bodyColor,
    decorKind: overrides.decorKind ?? base.decorKind,
    decorPalette: decorPalette ?? base.decorPalette,
    gift: {
      box: safeHex(overrides.gift?.box) ?? base.gift.box,
      lid: safeHex(overrides.gift?.lid) ?? base.gift.lid,
      ribbon: safeHex(overrides.gift?.ribbon) ?? base.gift.ribbon,
      bow: safeHex(overrides.gift?.bow) ?? base.gift.bow,
    },
    darkSurface: overrides.darkSurface ?? base.darkSurface,
    // Only needed when the AI deliberately chose a dark page: the card-tuned
    // nameColor/eventColor/bodyColor above would otherwise be unreadable
    // directly on that dark page (the greeting isn't wrapped in a card).
    pageNameColor: overrides.darkSurface
      ? safeHex(overrides.nameColor) ?? '#f5f1e8'
      : base.pageNameColor,
    pageEventColor: overrides.darkSurface
      ? safeHex(overrides.eventColor) ?? '#c9a463'
      : base.pageEventColor,
    pageBodyColor: overrides.darkSurface ? '#cfc8b8' : base.pageBodyColor,
  };
}
