import { TemplateId } from './types';

/**
 * Art direction layer.
 *
 * `templates.ts` describes how a *greeting* renders. This describes how a
 * style presents *itself* — the pitch that sells it, the tags that let
 * someone scan for the right one, and which composition the preview uses.
 *
 * Deliberately separate from TemplateDef: a template's job is the recipient
 * experience, and loading it up with marketing copy would blur that.
 */

/** How the live preview composes a greeting for this style. */
export type PreviewLayout =
  | 'celebration' // art-forward, big joyful title
  | 'cinematic' // image-led, soft light, serif
  | 'editorial' // typographic, generous whitespace
  | 'punch' // oversized type dominates
  | 'organic'; // textured ground, warm and handmade

export interface StyleTag {
  emoji: string;
  label: string;
}

export interface StyleArtSpec {
  /** One line that sells the feeling — never a description of the CSS. */
  pitch: string;
  tags: StyleTag[];
  layout: PreviewLayout;
  /** Sample greeting copy, so the preview shows a real card, not lorem. */
  sample: {
    kicker: string;
    title: string;
    body: string;
    cta: string;
  };
}

export const STYLE_ART: Record<TemplateId, StyleArtSpec> = {
  birthday: {
    pitch: 'חגיגה שמתפוצצת על המסך — בלונים, קונפטי וכותרת שאי אפשר לפספס.',
    tags: [
      { emoji: '🎈', label: 'חגיגי' },
      { emoji: '🎊', label: 'קונפטי' },
      { emoji: '📸', label: 'תמונות' },
    ],
    layout: 'celebration',
    sample: {
      kicker: 'יום הולדת',
      title: 'יום הולדת שמח נועה',
      body: 'שלוש שנים אני מכיר אותך ועדיין לא הבנתי איך את מצליחה להיות הכי רגועה בחדר.',
      cta: '🎁 יש עוד משהו',
    },
  },

  romantic: {
    pitch: 'עדין, אינטימי ומרגש — עם מקום לסיפור שלכם.',
    tags: [
      { emoji: '❤️', label: 'זוגי' },
      { emoji: '✨', label: 'אלגנטי' },
      { emoji: '📸', label: 'תמונות' },
    ],
    layout: 'cinematic',
    sample: {
      kicker: 'לאהובה שלי',
      title: 'שנה נוספת שבה בחרתם זה את זה',
      body: 'יש אנשים שנכנסים לחיים ועושים בהם סדר. את פשוט הפכת הכול ליפה יותר.',
      cta: '💗 פתחו את המכתב',
    },
  },

  elegant: {
    pitch: 'עיצוב דרמטי ומדויק למי שרוצה להשאיר רושם.',
    tags: [
      { emoji: '💎', label: 'יוקרתי' },
      { emoji: '🖤', label: 'אלגנטי' },
      { emoji: '✨', label: 'זהב' },
    ],
    layout: 'editorial',
    sample: {
      kicker: 'הזמנה אישית',
      title: 'ערב שנשמור לעצמנו',
      body: 'רגע אחד של כבוד, לפני שנפתח. הכנו לכם משהו שראוי לתשומת הלב.',
      cta: '✦ פתחו',
    },
  },

  funny: {
    pitch: 'טיפוגרפיה גדולה, סטיקרים ותזמון קומי — בשביל צחוק אמיתי.',
    tags: [
      { emoji: '😂', label: 'מצחיק' },
      { emoji: '⚡', label: 'אנרגטי' },
      { emoji: '🎯', label: 'ישיר' },
    ],
    layout: 'punch',
    sample: {
      kicker: 'אזהרה',
      title: 'באמת חשבת שנשכח?',
      body: 'אנחנו לא אחראים לתוכן. מישהו אחר כתב את זה, ואנחנו רק העברנו הלאה.',
      cta: '😂 בואו נראה',
    },
  },

  minimal: {
    pitch: 'שקט, מדויק ומרווח — כשהמילים הן כל הסיפור.',
    tags: [
      { emoji: '🤍', label: 'נקי' },
      { emoji: '✍️', label: 'עריכתי' },
      { emoji: '🕊️', label: 'מאופק' },
    ],
    layout: 'editorial',
    sample: {
      kicker: '—',
      title: 'משהו קטן בשבילך',
      body: 'בלי רעש. רק מילים שנכתבו במיוחד, ומקום לנשום ביניהן.',
      cta: 'פתחו',
    },
  },

  party: {
    pitch: 'ניאון, אורות ותנועה — מרגיש כמו הרחבה בשיא.',
    tags: [
      { emoji: '🎉', label: 'מסיבה' },
      { emoji: '🔊', label: 'אנרגיה' },
      { emoji: '💫', label: 'ניאון' },
    ],
    layout: 'celebration',
    sample: {
      kicker: 'מומלץ עם סאונד',
      title: 'הדלקנו לכם את האורות',
      body: 'לחצו — וזה מתחיל. הכנו לכם ערב שלם על מסך אחד.',
      cta: '🎉 יאללה',
    },
  },

  botanical: {
    pitch: 'טקסטורות נייר ועלים — חמים, טבעיים ועשויים ביד.',
    tags: [
      { emoji: '🌿', label: 'אורגני' },
      { emoji: '📜', label: 'נייר' },
      { emoji: '☀️', label: 'רגוע' },
    ],
    layout: 'organic',
    sample: {
      kicker: 'משהו שקט',
      title: 'רגע של נחת בשבילך',
      body: 'בלי מהומה. רק מילים טובות, על נייר שנעים להחזיק.',
      cta: '🌱 פתחו בעדינות',
    },
  },

  retro: {
    pitch: 'צבעי שנות ה-70 ואותיות עגלגלות — נוסטלגיה שעושה חם בלב.',
    tags: [
      { emoji: '📻', label: 'רטרו' },
      { emoji: '🧡', label: 'נוסטלגי' },
      { emoji: '🎞️', label: 'גרעין' },
    ],
    layout: 'organic',
    sample: {
      kicker: 'צד א׳',
      title: 'חוזרים רגע אחורה',
      body: 'הכנו לכם משהו בסגנון הישן והטוב, כמו קלטת שמישהו הקליט במיוחד.',
      cta: '▶ נגנו את זה',
    },
  },

  midnight: {
    pitch: 'כוכבים, זוהר ושקט — הכי יפה לפתוח את זה לבד בלילה.',
    tags: [
      { emoji: '🌙', label: 'לילי' },
      { emoji: '✨', label: 'זוהר' },
      { emoji: '💫', label: 'חלומי' },
    ],
    layout: 'cinematic',
    sample: {
      kicker: 'מחכה עד הלילה',
      title: 'שמרנו לכם רגע שקט',
      body: 'כשכולם כבר ישנים, נשאר רק אתם והמילים האלה.',
      cta: '✧ פתחו',
    },
  },

  bold: {
    pitch: 'אותיות ענק וניגודיות חדה — אמירה שאי אפשר להתעלם ממנה.',
    tags: [
      { emoji: '⚡', label: 'נועז' },
      { emoji: '🔲', label: 'חד' },
      { emoji: '📢', label: 'ישיר' },
    ],
    layout: 'punch',
    sample: {
      kicker: 'ישר לעניין',
      title: 'הכנו לכם משהו',
      body: 'בלי הקדמות ובלי רוך מיותר. פשוט תפתחו ותראו.',
      cta: '⚡ פתחו',
    },
  },

  aurora: {
    pitch: 'גלי אור על שמיים קפואים — שקט, רחב ומהפנט.',
    tags: [{ emoji: '🌌', label: 'מהפנט' }, { emoji: '❄️', label: 'קריר' }, { emoji: '✨', label: 'זוהר' }],
    layout: 'cinematic',
    sample: { kicker: 'מתחת לשמיים', title: 'שמרנו לכם רגע נדיר',
      body: 'יש לילות שבהם השמיים עושים משהו שאי אפשר לתכנן. זה אחד מהם.', cta: '✦ פתחו' },
  },
  blueprint: {
    pitch: 'רשת טכנית וקווי מדידה — מדויק, נקי וחכם.',
    tags: [{ emoji: '📐', label: 'מדויק' }, { emoji: '🔷', label: 'טכני' }, { emoji: '🤍', label: 'נקי' }],
    layout: 'editorial',
    sample: { kicker: 'מתוכנן בקפידה', title: 'הכנו לכם משהו מדויק',
      body: 'כל פרט כאן נבחר בכוונה — בדיוק כמו שאתם הייתם רוצים.', cta: '→ פתחו' },
  },
  sunset: {
    pitch: 'שמיים בשעת בין ערביים — ורוד, כתום וזהוב שנמסים זה בזה.',
    tags: [{ emoji: '🌅', label: 'חמים' }, { emoji: '📸', label: 'תמונות' }, { emoji: '💛', label: 'רך' }],
    layout: 'cinematic',
    sample: { kicker: 'לפני שהשמש שוקעת', title: 'תפסנו לכם רגע יפה',
      body: 'יש שעה ביום שבה הכול נראה טוב יותר. שמרנו לכם אותה.', cta: '☀ פתחו' },
  },
  noir: {
    pitch: 'שחור-לבן חד עם נגיעת אדום אחת — קולנועי ומסתורי.',
    tags: [{ emoji: '🎬', label: 'קולנועי' }, { emoji: '🖤', label: 'חד' }, { emoji: '🔴', label: 'דרמטי' }],
    layout: 'punch',
    sample: { kicker: 'סצנה אחת', title: 'יש לנו סיפור בשבילכם',
      body: 'אורות כבים, המוזיקה נכנסת, ואז מתחיל החלק שבו אתם.', cta: '● נגנו' },
  },
  candy: {
    pitch: 'ורוד ותכלת רכים עם צורות עגלגלות — מתוק וקליל.',
    tags: [{ emoji: '🍬', label: 'מתוק' }, { emoji: '🫧', label: 'קליל' }, { emoji: '🎈', label: 'שובב' }],
    layout: 'celebration',
    sample: { kicker: 'משהו מתוק', title: 'הכנו לכם משהו קטן ומתוק',
      body: 'זה לא גדול ולא מסובך. זה פשוט נחמד, וזה בדיוק הרעיון.', cta: '🎈 פתחו' },
  },
  marble: {
    pitch: 'עורקי אבן ושקט של מוזיאון — יוקרה מאופקת בלי זהב.',
    tags: [{ emoji: '🏛️', label: 'מאופק' }, { emoji: '📖', label: 'עריכתי' }, { emoji: '🤍', label: 'יוקרתי' }],
    layout: 'editorial',
    sample: { kicker: 'נשמר בקפידה', title: 'משהו ששווה לעצור בשבילו',
      body: 'לא כל דבר צריך לצעוק כדי להיות חשוב. קחו רגע.', cta: '— פתחו' },
  },
};

export function styleArt(id: TemplateId): StyleArtSpec {
  return STYLE_ART[id] ?? STYLE_ART.birthday;
}
