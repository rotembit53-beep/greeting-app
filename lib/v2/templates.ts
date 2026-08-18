import { MusicMood, PhotoPresentation, SceneKind, TemplateId } from './types';

/**
 * A template is pure data. It decides the palette, the type treatment, the
 * decoration, the motion profile AND which interaction beats the greeting is
 * built from — so two templates differ structurally, not just in colour.
 *
 * Adding a seventh template is a new entry here; nothing in the AI pipeline
 * or the scene renderer needs to change.
 */
export interface TemplateDef {
  id: TemplateId;
  label: string;
  description: string;
  premium: boolean;

  /** Card art on the picker / landing showcase. */
  preview: { gradient: string; emoji: string };

  palette: {
    pageBg: string;
    ink: string;
    inkSoft: string;
    accent: string;
    accentSoft: string;
    surface: string;
    surfaceBorder: string;
    glow: string;
  };

  /** True when pageBg is dark, so overlays/logos flip to their light variant. */
  dark: boolean;

  type: {
    /** 'serif' pulls the display face; 'sans' keeps Heebo. */
    display: 'serif' | 'sans';
    titleSize: string;
    titleWeight: number;
    titleTracking: string;
    titleTransform: 'none' | 'uppercase';
    bodySize: string;
    bodyLeading: string;
  };

  decor: {
    kind: 'confetti' | 'petals' | 'sparkles' | 'balloons' | 'none' | 'orbs';
    palette: string[];
    density: number;
  };

  /** The beats, in order. The renderer walks this list. */
  scenes: SceneKind[];

  gate: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
  };

  motion: {
    /** Seconds. */
    duration: number;
    stagger: number;
    ease: string;
  };

  musicMood: MusicMood;

  /** How this template stages a set of photos. */
  photoPresentation: PhotoPresentation;
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  /* ---------------------------------------------------------------- *
   * BIRTHDAY — loud, warm, confetti-forward. Balloons you can pop.
   * ---------------------------------------------------------------- */
  birthday: {
    id: 'birthday',
    label: 'יום הולדת',
    description: 'צבעוני, שמח ומלא קונפטי — החגיגה מתחילה ברגע הפתיחה',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #ffb03a 0%, #ff5f6d 55%, #c9366f 100%)',
      emoji: '🎂',
    },
    palette: {
      pageBg: 'radial-gradient(circle at 15% 0%, #fff3e0 0%, #ffe6e9 45%, #ffd9e4 100%)',
      ink: '#40161f',
      inkSoft: '#7d5560',
      accent: '#e8365d',
      accentSoft: '#ffe1e8',
      surface: '#fffdfb',
      surfaceBorder: '#ffd0da',
      glow: 'rgba(255, 140, 90, 0.35)',
    },
    dark: false,
    type: {
      display: 'sans',
      titleSize: 'clamp(2.6rem, 11vw, 4.6rem)',
      titleWeight: 900,
      titleTracking: '-0.03em',
      titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.2vw, 1.25rem)',
      bodyLeading: '1.75',
    },
    decor: {
      kind: 'confetti',
      palette: ['#e8365d', '#ffb03a', '#4bc0c8', '#8e6bd6', '#ff8fab'],
      density: 90,
    },
    scenes: [
      'gate-balloons',
      'reveal',
      'messages',
      'memories',
      'surprise',
      'gift',
      'closing',
    ],
    gate: {
      badge: '🎈 יש לך הפתעה',
      title: 'מחכה לך משהו מיוחד',
      subtitle: 'מישהו הכין לך הפתעה ליום ההולדת',
      cta: '🎉 פוצצו את הבלונים',
    },
    motion: { duration: 0.8, stagger: 0.1, ease: 'back.out(1.4)' },
    musicMood: 'happy',
    photoPresentation: 'polaroid',
  },

  /* ---------------------------------------------------------------- *
   * ROMANTIC — deep rose, serif, slow. Envelope + drifting petals.
   * ---------------------------------------------------------------- */
  romantic: {
    id: 'romantic',
    label: 'רומנטי',
    description: 'עדין, חם ואיטי — עם מעטפה שנפתחת ועלי כותרת שנושרים',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #f76b8a 0%, #a4508b 60%, #5f0a87 100%)',
      emoji: '❤️',
    },
    palette: {
      pageBg: 'radial-gradient(circle at 75% 5%, #3a0f2e 0%, #26091f 55%, #170614 100%)',
      ink: '#fdeef4',
      inkSoft: '#d3a8bd',
      accent: '#ff8fab',
      accentSoft: 'rgba(255, 143, 171, 0.16)',
      surface: 'rgba(255, 255, 255, 0.05)',
      surfaceBorder: 'rgba(255, 143, 171, 0.28)',
      glow: 'rgba(255, 105, 145, 0.4)',
    },
    dark: true,
    type: {
      display: 'serif',
      titleSize: 'clamp(2.4rem, 9.5vw, 4rem)',
      titleWeight: 500,
      titleTracking: '-0.01em',
      titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.2vw, 1.2rem)',
      bodyLeading: '1.95',
    },
    decor: {
      kind: 'petals',
      palette: ['#ff8fab', '#f76b8a', '#ffc2d4', '#c96496'],
      density: 26,
    },
    scenes: ['gate-envelope', 'reveal', 'memories', 'messages', 'gift', 'closing'],
    gate: {
      badge: '💌 מכתב בשבילך',
      title: 'מישהו כתב לך משהו',
      subtitle: 'קחו רגע. זה נכתב במיוחד בשבילכם',
      cta: '💗 פתחו את המכתב',
    },
    motion: { duration: 1.25, stagger: 0.14, ease: 'power3.out' },
    musicMood: 'romantic',
    photoPresentation: 'cinematic',
  },

  /* ---------------------------------------------------------------- *
   * ELEGANT — navy + gold, uppercase letterspaced serif, restrained.
   * ---------------------------------------------------------------- */
  elegant: {
    id: 'elegant',
    label: 'יוקרתי',
    description: 'נייבי וזהב, טיפוגרפיה מרווחת ותנועה מאופקת — לאירועים גדולים',
    premium: true,
    preview: {
      gradient: 'linear-gradient(145deg, #d4af37 0%, #8a6d2f 45%, #14203a 100%)',
      emoji: '💍',
    },
    palette: {
      pageBg: 'linear-gradient(170deg, #101a2e 0%, #16233d 50%, #0c1424 100%)',
      ink: '#f4efe2',
      inkSoft: '#a8a08c',
      accent: '#d4af37',
      accentSoft: 'rgba(212, 175, 55, 0.14)',
      surface: 'rgba(244, 239, 226, 0.04)',
      surfaceBorder: 'rgba(212, 175, 55, 0.32)',
      glow: 'rgba(212, 175, 55, 0.32)',
    },
    dark: true,
    type: {
      display: 'serif',
      titleSize: 'clamp(1.9rem, 7vw, 3.1rem)',
      titleWeight: 400,
      titleTracking: '0.14em',
      titleTransform: 'uppercase',
      bodySize: 'clamp(1rem, 3.9vw, 1.15rem)',
      bodyLeading: '2.05',
    },
    decor: {
      kind: 'sparkles',
      palette: ['#d4af37', '#f4efe2', '#b8912c'],
      density: 22,
    },
    scenes: ['gate-gift', 'reveal', 'messages', 'memories', 'gift', 'closing'],
    gate: {
      badge: '✦ הזמנה אישית',
      title: 'נשמר עבורכם',
      subtitle: 'רגע אחד של כבוד, לפני שנפתח',
      cta: '✦ פתחו',
    },
    motion: { duration: 1.4, stagger: 0.16, ease: 'power2.out' },
    musicMood: 'emotional',
    photoPresentation: 'parallax',
  },

  /* ---------------------------------------------------------------- *
   * FUNNY — chunky black-on-yellow, wobble motion, joke-forward.
   * ---------------------------------------------------------------- */
  funny: {
    id: 'funny',
    label: 'מצחיק',
    description: 'צהוב חזק, טיפוגרפיה שמנה ותנועה קופצנית — בשביל לצחוק',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #ffe029 0%, #ff9d00 55%, #1a1a1a 100%)',
      emoji: '😂',
    },
    palette: {
      pageBg: 'linear-gradient(160deg, #ffe75e 0%, #ffd029 45%, #ffb703 100%)',
      ink: '#181818',
      inkSoft: '#5a5024',
      accent: '#1a1a1a',
      accentSoft: 'rgba(26, 26, 26, 0.1)',
      surface: '#fffdf0',
      surfaceBorder: '#1a1a1a',
      glow: 'rgba(255, 200, 0, 0.5)',
    },
    dark: false,
    type: {
      display: 'sans',
      titleSize: 'clamp(2.7rem, 12vw, 5rem)',
      titleWeight: 900,
      titleTracking: '-0.045em',
      titleTransform: 'none',
      bodySize: 'clamp(1.1rem, 4.4vw, 1.3rem)',
      bodyLeading: '1.65',
    },
    decor: {
      kind: 'confetti',
      palette: ['#1a1a1a', '#ff5f6d', '#00c2ff', '#ff9d00'],
      density: 60,
    },
    scenes: ['gate-gift', 'reveal', 'messages', 'surprise', 'memories', 'gift', 'closing'],
    gate: {
      badge: '👀 אל תלחצו. סתם, כן תלחצו',
      title: 'יש לך חבילה חשודה',
      subtitle: 'אנחנו לא אחראים לתוכן. מישהו אחר כתב את זה',
      cta: '😂 טוב, בוא נראה',
    },
    motion: { duration: 0.55, stagger: 0.07, ease: 'back.out(2.6)' },
    musicMood: 'funny',
    photoPresentation: 'wall',
  },

  /* ---------------------------------------------------------------- *
   * MINIMAL — off-white editorial, huge air, almost no decoration.
   * ---------------------------------------------------------------- */
  minimal: {
    id: 'minimal',
    label: 'מינימלי',
    description: 'שקט, נקי ומרווח — הטקסט הוא הגיבור',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #f5f2ec 0%, #ddd6ca 60%, #a89f90 100%)',
      emoji: '🤍',
    },
    palette: {
      pageBg: '#f6f4ef',
      ink: '#1f1d1a',
      inkSoft: '#7c766c',
      accent: '#1f1d1a',
      accentSoft: 'rgba(31, 29, 26, 0.06)',
      surface: '#fffefb',
      surfaceBorder: '#e3ded3',
      glow: 'rgba(31, 29, 26, 0.08)',
    },
    dark: false,
    type: {
      display: 'serif',
      titleSize: 'clamp(2.1rem, 8vw, 3.4rem)',
      titleWeight: 400,
      titleTracking: '-0.015em',
      titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4vw, 1.2rem)',
      bodyLeading: '2.1',
    },
    decor: { kind: 'none', palette: [], density: 0 },
    scenes: ['gate-envelope', 'reveal', 'memories', 'gift', 'closing'],
    gate: {
      badge: '—',
      title: 'משהו קטן בשבילך',
      subtitle: 'בלי רעש. רק מילים שנכתבו במיוחד',
      cta: 'פתחו',
    },
    motion: { duration: 1.1, stagger: 0.12, ease: 'power2.out' },
    musicMood: 'calm',
    photoPresentation: 'cinematic',
  },

  /* ---------------------------------------------------------------- *
   * PARTY — dark neon, saturated gradients, high energy.
   * ---------------------------------------------------------------- */
  party: {
    id: 'party',
    label: 'מסיבה',
    description: 'ניאון על רקע כהה, אנרגיה גבוהה והמון תנועה',
    premium: true,
    preview: {
      gradient: 'linear-gradient(145deg, #00f5d4 0%, #9b5de5 50%, #f15bb5 100%)',
      emoji: '🎉',
    },
    palette: {
      pageBg: 'radial-gradient(circle at 20% 10%, #241b48 0%, #150f2b 55%, #0a0718 100%)',
      ink: '#f6f2ff',
      inkSoft: '#a99cc9',
      accent: '#00f5d4',
      accentSoft: 'rgba(0, 245, 212, 0.14)',
      surface: 'rgba(255, 255, 255, 0.06)',
      surfaceBorder: 'rgba(155, 93, 229, 0.45)',
      glow: 'rgba(155, 93, 229, 0.5)',
    },
    dark: true,
    type: {
      display: 'sans',
      titleSize: 'clamp(2.5rem, 11vw, 4.4rem)',
      titleWeight: 900,
      titleTracking: '-0.02em',
      titleTransform: 'uppercase',
      bodySize: 'clamp(1.05rem, 4.2vw, 1.22rem)',
      bodyLeading: '1.8',
    },
    decor: {
      kind: 'orbs',
      palette: ['#00f5d4', '#9b5de5', '#f15bb5', '#fee440'],
      density: 34,
    },
    scenes: [
      'gate-balloons',
      'reveal',
      'messages',
      'memories',
      'surprise',
      'gift',
      'closing',
    ],
    gate: {
      badge: '🔊 מומלץ עם סאונד',
      title: 'הדלקנו לך את האורות',
      subtitle: 'לחצו — וזה מתחיל',
      cta: '🎉 יאללה, תתחיל',
    },
    motion: { duration: 0.7, stagger: 0.08, ease: 'back.out(1.8)' },
    musicMood: 'party',
    photoPresentation: 'cards3d',
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export const DEFAULT_TEMPLATE: TemplateId = 'birthday';

export function getTemplate(id: string | undefined | null): TemplateDef {
  return (id && TEMPLATES[id as TemplateId]) || TEMPLATES[DEFAULT_TEMPLATE];
}
