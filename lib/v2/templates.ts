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
    kind: 'confetti' | 'petals' | 'sparkles' | 'balloons' | 'bubbles' | 'none' | 'orbs';
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
    description: 'צבעוני ורועש, עם קונפטי שלא נגמר — החגיגה מתחילה כבר ברגע הפתיחה',
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
      badge: '🎈 מחכה לכם הפתעה',
      title: 'מחכה לכם משהו מיוחד',
      subtitle: 'מישהו הכין לכם הפתעה ליום ההולדת',
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
    description: 'עדין ואיטי, על רקע כהה — מעטפה שנפתחת ועלי כותרת שנושרים ברקע',
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
      badge: '💌 מכתב בשבילכם',
      title: 'מישהו כתב לכם משהו',
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
    description: 'נייבי וזהב, אותיות מרווחות ותנועה מאופקת — לאירועים שדורשים כבוד',
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
      title: 'שמרנו לכם משהו',
      subtitle: 'רגע אחד של כבוד, ואז נפתח',
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
    description: 'צהוב זועק, אותיות שמנות ותנועה קופצנית — בנוי כדי להצחיק',
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
      badge: '👀 אל תלחצו. סתם, תלחצו',
      title: 'הגיעה אליכם חבילה חשודה',
      subtitle: 'אנחנו לא אחראים לתוכן — מישהו אחר כתב את זה',
      cta: '😂 טוב, בואו נראה',
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
    description: 'שקט, נקי והרבה אוויר — כאן המילים הן הגיבור',
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
      title: 'משהו קטן בשבילכם',
      subtitle: 'בלי רעש — רק מילים שנכתבו במיוחד',
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
    description: 'ניאון על רקע כהה, אנרגיה גבוהה ותנועה בלי הפסקה',
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
      title: 'הדלקנו לכם את האורות',
      subtitle: 'לחצו — וזה מתחיל',
      cta: '🎉 יאללה, מתחילים',
    },
    motion: { duration: 0.7, stagger: 0.08, ease: 'back.out(1.8)' },
    musicMood: 'party',
    photoPresentation: 'cards3d',
  },

  /* ---------------------------------------------------------------- *
   * BOTANICAL — sage + terracotta, botanical calm. Slow and gentle.
   * ---------------------------------------------------------------- */
  botanical: {
    id: 'botanical',
    label: 'טבעי',
    description: 'ירוק מרווה וגווני אדמה, עם עלים שנעים לאט — רגוע ונושם',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #cfe0c3 0%, #8aa87b 50%, #4f6b45 100%)',
      emoji: '🌿',
    },
    palette: {
      pageBg: 'radial-gradient(circle at 22% 0%, #f4f6ee 0%, #e6ece0 45%, #d9e2d2 100%)',
      ink: '#2b3527',
      inkSoft: '#6a7a63',
      accent: '#4f6b45',
      accentSoft: 'rgba(79, 107, 69, 0.12)',
      surface: '#fdfefb',
      surfaceBorder: '#c9d6c0',
      glow: 'rgba(120, 150, 105, 0.32)',
    },
    dark: false,
    type: {
      display: 'serif',
      titleSize: 'clamp(2.1rem, 8vw, 3.4rem)',
      titleWeight: 500,
      titleTracking: '-0.012em',
      titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4vw, 1.2rem)',
      bodyLeading: '2',
    },
    decor: {
      kind: 'petals',
      palette: ['#7d9b6c', '#a8bf97', '#c4956a', '#5f7d52'],
      density: 20,
    },
    scenes: ['gate-envelope', 'reveal', 'memories', 'messages', 'gift', 'closing'],
    gate: {
      badge: '🌿 משהו שקט בשבילכם',
      title: 'מחכה לכם רגע של נחת',
      subtitle: 'בלי מהומה. רק מילים טובות',
      cta: '🌱 פתחו בעדינות',
    },
    motion: { duration: 1.2, stagger: 0.13, ease: 'power2.out' },
    musicMood: 'calm',
    photoPresentation: 'cinematic',
  },

  /* ---------------------------------------------------------------- *
   * RETRO — 70s amber & rust, chunky rounded type, warm grain.
   * ---------------------------------------------------------------- */
  retro: {
    id: 'retro',
    label: 'רטרו',
    description: 'כתום שנות ה-70 ואותיות עגלגלות — נוסטלגי, חם וקצת שובב',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #f6c65b 0%, #e07a3f 52%, #8c3b1e 100%)',
      emoji: '📻',
    },
    palette: {
      pageBg: 'linear-gradient(165deg, #f9e6c4 0%, #f0c893 45%, #e0a367 100%)',
      ink: '#3d2314',
      inkSoft: '#7d5a3c',
      accent: '#c1440e',
      accentSoft: 'rgba(193, 68, 14, 0.14)',
      surface: '#fff6e6',
      surfaceBorder: '#d8ab73',
      glow: 'rgba(224, 122, 63, 0.42)',
    },
    dark: false,
    type: {
      display: 'sans',
      titleSize: 'clamp(2.4rem, 10vw, 4rem)',
      titleWeight: 900,
      titleTracking: '-0.035em',
      titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.2vw, 1.24rem)',
      bodyLeading: '1.8',
    },
    decor: {
      kind: 'confetti',
      palette: ['#c1440e', '#f6c65b', '#7d9b6c', '#e07a3f'],
      density: 44,
    },
    scenes: ['gate-gift', 'reveal', 'messages', 'memories', 'gift', 'closing'],
    gate: {
      badge: '📼 הקלטנו לכם משהו',
      title: 'חוזרים רגע אחורה',
      subtitle: 'הכנו לכם משהו בסגנון הישן והטוב',
      cta: '▶ נגנו את זה',
    },
    motion: { duration: 0.75, stagger: 0.09, ease: 'back.out(1.6)' },
    musicMood: 'happy',
    photoPresentation: 'polaroid',
  },

  /* ---------------------------------------------------------------- *
   * MIDNIGHT — deep indigo, starfield, dreamy and quiet.
   * ---------------------------------------------------------------- */
  midnight: {
    id: 'midnight',
    label: 'חצות',
    description: 'כחול עמוק עם נצנוצים כמו שמי לילה — חלומי, שקט ומרגש',
    premium: true,
    preview: {
      gradient: 'linear-gradient(145deg, #8ea7e9 0%, #3b4a91 50%, #10132e 100%)',
      emoji: '🌙',
    },
    palette: {
      pageBg: 'radial-gradient(circle at 70% 8%, #26305e 0%, #171d3d 50%, #0b0e22 100%)',
      ink: '#eaf0ff',
      inkSoft: '#9aa6cc',
      accent: '#8ea7e9',
      accentSoft: 'rgba(142, 167, 233, 0.16)',
      surface: 'rgba(255, 255, 255, 0.06)',
      surfaceBorder: 'rgba(142, 167, 233, 0.32)',
      glow: 'rgba(120, 145, 220, 0.45)',
    },
    dark: true,
    type: {
      display: 'serif',
      titleSize: 'clamp(2.2rem, 8.6vw, 3.6rem)',
      titleWeight: 500,
      titleTracking: '-0.005em',
      titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.1vw, 1.2rem)',
      bodyLeading: '2',
    },
    decor: {
      kind: 'sparkles',
      palette: ['#eaf0ff', '#8ea7e9', '#c3d0f5'],
      density: 40,
    },
    scenes: ['gate-envelope', 'reveal', 'memories', 'messages', 'gift', 'closing'],
    gate: {
      badge: '🌙 מחכה לכם עד הלילה',
      title: 'שמרנו לכם רגע שקט',
      subtitle: 'הכי יפה לפתוח את זה לבד',
      cta: '✧ פתחו',
    },
    motion: { duration: 1.35, stagger: 0.15, ease: 'power3.out' },
    musicMood: 'emotional',
    photoPresentation: 'parallax',
  },

  /* ---------------------------------------------------------------- *
   * BOLD — high-contrast type-first. Loud without being childish.
   * ---------------------------------------------------------------- */
  bold: {
    id: 'bold',
    label: 'נועז',
    description: 'ניגודיות חדה ואותיות ענקיות — ישיר, חזק ובלי לרכך',
    premium: false,
    preview: {
      gradient: 'linear-gradient(145deg, #ff5252 0%, #1a1a1a 55%, #000000 100%)',
      emoji: '⚡',
    },
    palette: {
      pageBg: 'linear-gradient(170deg, #141414 0%, #1d1d1d 55%, #0a0a0a 100%)',
      ink: '#f5f5f5',
      inkSoft: '#9a9a9a',
      accent: '#ff5252',
      accentSoft: 'rgba(255, 82, 82, 0.16)',
      surface: 'rgba(255, 255, 255, 0.05)',
      surfaceBorder: 'rgba(255, 82, 82, 0.4)',
      glow: 'rgba(255, 82, 82, 0.42)',
    },
    dark: true,
    type: {
      display: 'sans',
      titleSize: 'clamp(2.8rem, 13vw, 5.4rem)',
      titleWeight: 900,
      titleTracking: '-0.05em',
      titleTransform: 'uppercase',
      bodySize: 'clamp(1.05rem, 4.2vw, 1.25rem)',
      bodyLeading: '1.7',
    },
    decor: { kind: 'none', palette: [], density: 0 },
    scenes: ['gate-gift', 'reveal', 'messages', 'memories', 'gift', 'closing'],
    gate: {
      badge: '⚡ ישר לעניין',
      title: 'הכנו לכם משהו',
      subtitle: 'בלי הקדמות. פשוט תפתחו',
      cta: '⚡ פתחו',
    },
    motion: { duration: 0.6, stagger: 0.07, ease: 'power4.out' },
    musicMood: 'party',
    photoPresentation: 'wall',
  },

  /* ---------------------------------------------------------------- *
   * AURORA — cold northern light over deep teal. Slow and hypnotic.
   * ---------------------------------------------------------------- */
  aurora: {
    id: 'aurora',
    label: 'זוהר צפוני',
    description: 'גלי אור ירוקים-סגולים על שמיים קפואים — שקט, רחב ומהפנט',
    premium: true,
    preview: { gradient: 'linear-gradient(145deg, #64f0c4 0%, #4a6ed6 50%, #0b1230 100%)', emoji: '🌌' },
    palette: {
      pageBg: 'radial-gradient(circle at 50% 108%, #123 0%, #0d1430 45%, #060a1c 100%)',
      ink: '#e8f4ff', inkSoft: '#93a8c9', accent: '#64f0c4',
      accentSoft: 'rgba(100, 240, 196, 0.14)',
      surface: 'rgba(255,255,255,0.055)', surfaceBorder: 'rgba(100,240,196,0.3)',
      glow: 'rgba(80, 200, 190, 0.42)',
    },
    dark: true,
    type: { display: 'sans', titleSize: 'clamp(2.2rem, 9vw, 3.7rem)', titleWeight: 300,
      titleTracking: '0.01em', titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.1vw, 1.2rem)', bodyLeading: '2' },
    decor: { kind: 'sparkles', palette: ['#64f0c4', '#8aa9ff', '#d8f6ff'], density: 30 },
    scenes: ['gate-envelope', 'reveal', 'memories', 'messages', 'gift', 'closing'],
    gate: { badge: '🌌 מתחת לשמיים', title: 'שמרנו לכם רגע נדיר',
      subtitle: 'קחו נשימה לפני שנפתח', cta: '✦ פתחו' },
    motion: { duration: 1.5, stagger: 0.16, ease: 'power2.out' },
    musicMood: 'calm', photoPresentation: 'parallax',
  },

  /* ---------------------------------------------------------------- *
   * BLUEPRINT — technical grid, precise, quietly clever.
   * ---------------------------------------------------------------- */
  blueprint: {
    id: 'blueprint',
    label: 'שרטוט',
    description: 'רשת טכנית וקווי מדידה על כחול עמוק — מדויק, נקי וחכם',
    premium: false,
    preview: { gradient: 'linear-gradient(145deg, #7fb2ff 0%, #1d4b8f 55%, #0a1c33 100%)', emoji: '📐' },
    palette: {
      pageBg: 'linear-gradient(168deg, #0e2440 0%, #0a1c33 55%, #061426 100%)',
      ink: '#dbeaff', inkSoft: '#8ba6c9', accent: '#7fb2ff',
      accentSoft: 'rgba(127, 178, 255, 0.13)',
      surface: 'rgba(255,255,255,0.05)', surfaceBorder: 'rgba(127,178,255,0.32)',
      glow: 'rgba(90, 150, 240, 0.35)',
    },
    dark: true,
    type: { display: 'sans', titleSize: 'clamp(2rem, 8vw, 3.2rem)', titleWeight: 700,
      titleTracking: '-0.02em', titleTransform: 'none',
      bodySize: 'clamp(1rem, 3.9vw, 1.14rem)', bodyLeading: '1.9' },
    decor: { kind: 'none', palette: [], density: 0 },
    scenes: ['gate-gift', 'reveal', 'messages', 'memories', 'gift', 'closing'],
    gate: { badge: '📐 מתוכנן בקפידה', title: 'הכנו לכם משהו מדויק',
      subtitle: 'כל פרט כאן נבחר בכוונה', cta: '→ פתחו' },
    motion: { duration: 0.85, stagger: 0.1, ease: 'power3.out' },
    musicMood: 'calm', photoPresentation: 'wall',
  },

  /* ---------------------------------------------------------------- *
   * SUNSET — warm dusk gradient, soft haze, golden hour.
   * ---------------------------------------------------------------- */
  sunset: {
    id: 'sunset',
    label: 'שקיעה',
    description: 'שמיים בשעת בין ערביים — ורוד, כתום וזהוב שנמסים זה בזה',
    premium: false,
    preview: { gradient: 'linear-gradient(145deg, #ffd28a 0%, #ff7e6b 50%, #7b3f6e 100%)', emoji: '🌅' },
    palette: {
      pageBg: 'linear-gradient(178deg, #ffd9a0 0%, #ff9e7d 34%, #d96a8a 66%, #6d3a6b 100%)',
      ink: '#3a1630', inkSoft: '#7d4a60', accent: '#c2385f',
      accentSoft: 'rgba(194, 56, 95, 0.13)',
      surface: 'rgba(255,255,255,0.72)', surfaceBorder: 'rgba(122,58,90,0.22)',
      glow: 'rgba(255, 140, 110, 0.45)',
    },
    dark: false,
    type: { display: 'serif', titleSize: 'clamp(2.2rem, 9vw, 3.6rem)', titleWeight: 500,
      titleTracking: '-0.015em', titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.1vw, 1.22rem)', bodyLeading: '1.9' },
    decor: { kind: 'orbs', palette: ['#ffd28a', '#ff9e7d', '#ffe9c9'], density: 18 },
    scenes: ['gate-envelope', 'reveal', 'memories', 'messages', 'gift', 'closing'],
    gate: { badge: '🌅 לפני שהשמש שוקעת', title: 'תפסנו לכם רגע יפה',
      subtitle: 'הכי טוב לפתוח את זה לאט', cta: '☀ פתחו' },
    motion: { duration: 1.25, stagger: 0.13, ease: 'power2.out' },
    musicMood: 'romantic', photoPresentation: 'cinematic',
  },

  /* ---------------------------------------------------------------- *
   * NOIR — high-contrast monochrome, film grain, one red accent.
   * ---------------------------------------------------------------- */
  noir: {
    id: 'noir',
    label: 'נואר',
    description: 'שחור-לבן חד עם נגיעת אדום אחת — קולנועי, מסתורי ומדויק',
    premium: true,
    preview: { gradient: 'linear-gradient(145deg, #e8e8e8 0%, #2a2a2a 50%, #000000 100%)', emoji: '🎬' },
    palette: {
      pageBg: 'linear-gradient(172deg, #1a1a1a 0%, #0d0d0d 55%, #000000 100%)',
      ink: '#f0efed', inkSoft: '#9a9895', accent: '#e02b3c',
      accentSoft: 'rgba(224, 43, 60, 0.14)',
      surface: 'rgba(255,255,255,0.05)', surfaceBorder: 'rgba(240,239,237,0.22)',
      glow: 'rgba(224, 43, 60, 0.3)',
    },
    dark: true,
    type: { display: 'serif', titleSize: 'clamp(2rem, 8vw, 3.3rem)', titleWeight: 400,
      titleTracking: '0.08em', titleTransform: 'uppercase',
      bodySize: 'clamp(1rem, 3.9vw, 1.15rem)', bodyLeading: '2' },
    decor: { kind: 'none', palette: [], density: 0 },
    scenes: ['gate-envelope', 'reveal', 'messages', 'memories', 'gift', 'closing'],
    gate: { badge: '🎬 סצנה אחת', title: 'יש לנו סיפור בשבילכם',
      subtitle: 'אורות כבים. מתחילים', cta: '● נגנו' },
    motion: { duration: 1.1, stagger: 0.14, ease: 'power2.inOut' },
    musicMood: 'emotional', photoPresentation: 'cinematic',
  },

  /* ---------------------------------------------------------------- *
   * CANDY — soft pastel, rounded, sweet without being childish.
   * ---------------------------------------------------------------- */
  candy: {
    id: 'candy',
    label: 'פסטל',
    description: 'ורוד ותכלת רכים עם צורות עגלגלות — מתוק, קליל ונעים לעין',
    premium: false,
    preview: { gradient: 'linear-gradient(145deg, #ffd6ec 0%, #c5e4ff 52%, #d9c9ff 100%)', emoji: '🍬' },
    palette: {
      pageBg: 'radial-gradient(circle at 24% 4%, #fff0f8 0%, #ffe0ef 38%, #dce9ff 100%)',
      ink: '#4a3350', inkSoft: '#8a7395', accent: '#ef7fb4',
      accentSoft: 'rgba(239, 127, 180, 0.15)',
      surface: '#fffdff', surfaceBorder: '#f2d5e6',
      glow: 'rgba(239, 127, 180, 0.36)',
    },
    dark: false,
    type: { display: 'sans', titleSize: 'clamp(2.3rem, 9.5vw, 3.8rem)', titleWeight: 800,
      titleTracking: '-0.03em', titleTransform: 'none',
      bodySize: 'clamp(1.05rem, 4.1vw, 1.22rem)', bodyLeading: '1.85' },
    decor: { kind: 'bubbles', palette: ['#ef7fb4', '#8ec9ff', '#c9b0ff', '#ffd6ec'], density: 26 },
    scenes: ['gate-balloons', 'reveal', 'messages', 'memories', 'gift', 'closing'],
    gate: { badge: '🍬 משהו מתוק', title: 'הכנו לכם משהו קטן ומתוק',
      subtitle: 'זה לא גדול. זה פשוט נחמד', cta: '🎈 פתחו' },
    motion: { duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)' },
    musicMood: 'happy', photoPresentation: 'polaroid',
  },

  /* ---------------------------------------------------------------- *
   * MARBLE — stone veining, museum calm, restrained luxury.
   * ---------------------------------------------------------------- */
  marble: {
    id: 'marble',
    label: 'שיש',
    description: 'עורקי אבן בהירים ושקט של מוזיאון — יוקרה מאופקת בלי זהב',
    premium: true,
    preview: { gradient: 'linear-gradient(145deg, #f7f5f2 0%, #ddd8d1 48%, #9a938a 100%)', emoji: '🏛️' },
    palette: {
      pageBg: 'linear-gradient(160deg, #faf8f5 0%, #efece7 45%, #e2ded7 100%)',
      ink: '#2c2825', inkSoft: '#7c766d', accent: '#8a7c66',
      accentSoft: 'rgba(138, 124, 102, 0.11)',
      surface: '#fffefc', surfaceBorder: '#ded9d1',
      glow: 'rgba(138, 124, 102, 0.24)',
    },
    dark: false,
    type: { display: 'serif', titleSize: 'clamp(2rem, 8vw, 3.3rem)', titleWeight: 400,
      titleTracking: '0.02em', titleTransform: 'none',
      bodySize: 'clamp(1.02rem, 4vw, 1.18rem)', bodyLeading: '2.05' },
    decor: { kind: 'none', palette: [], density: 0 },
    scenes: ['gate-envelope', 'reveal', 'memories', 'messages', 'gift', 'closing'],
    gate: { badge: '🏛️ נשמר בקפידה', title: 'משהו ששווה לעצור בשבילו',
      subtitle: 'קחו רגע. אין למהר', cta: '— פתחו' },
    motion: { duration: 1.4, stagger: 0.15, ease: 'power2.out' },
    musicMood: 'calm', photoPresentation: 'parallax',
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export const DEFAULT_TEMPLATE: TemplateId = 'birthday';

export function getTemplate(id: string | undefined | null): TemplateDef {
  return (id && TEMPLATES[id as TemplateId]) || TEMPLATES[DEFAULT_TEMPLATE];
}
