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
  /**
   * Sample greeting copy, so the preview shows a real card, not lorem.
   * Deliberately runs longer than one screen — the live preview scrolls,
   * and a hero that's the *only* content would give nothing to scroll to.
   */
  sample: {
    kicker: string;
    title: string;
    body: string;
    cta: string;
    /** Two short beats, styled like the real product's message chips. */
    messages: [string, string];
    /** The sign-off line that closes the preview, like a real greeting. */
    signoff: string;
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
      messages: ['את עדיין לא יודעת לקרוא מפה', 'וזה עדיין הדבר האהוב עליי'],
      signoff: 'שיהיה לך יום הולדת בדיוק כמוך — חם, מצחיק ובלי תוכניות.',
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
      messages: ['את עדיין הסיבה שאני מחייך לטלפון', 'ועדיין הכי טוב לי לידך'],
      signoff: 'תודה שבחרת בי, כל יום מחדש.',
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
      messages: ['כל פרט כאן נבחר במיוחד', 'בשבילכם, ורק בשבילכם'],
      signoff: 'בכבוד רב, ובתודה אמיתית.',
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
      messages: ['את/ה עדיין הכי מצחיק/ה שאנחנו מכירים', 'וגם קצת מוזר/ה, בואו נהיה כנים'],
      signoff: 'בלי דמעות. רק צחוק ובלגן, כרגיל.',
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
      messages: ['תודה שאת/ה קיים/ת', 'זה מספיק'],
      signoff: 'בפשטות, ובאמת.',
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
      messages: ['תעלו את הווליום', 'ותרימו ידיים'],
      signoff: 'שיהיה לילה שלא שוכחים.',
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
      messages: ['קחו נשימה', 'זה כאן בשבילכם, בלי למהר'],
      signoff: 'באהבה, ובלי חיפזון.',
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
      messages: ['כמו פעם, רק טוב יותר', 'עם קצת גרעין ומלא חום'],
      signoff: 'עד הפעם הבאה.',
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
      messages: ['לילה טוב', 'ותודה שהיית פה'],
      signoff: 'עד מחר. חלומות פז.',
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
      messages: ['בלי סיבובים', 'זהו, זה הכול'],
      signoff: 'זהו. אמרנו את מה שהיה לומר.',
    },
  },

  aurora: {
    pitch: 'גלי אור על שמיים קפואים — שקט, רחב ומהפנט.',
    tags: [{ emoji: '🌌', label: 'מהפנט' }, { emoji: '❄️', label: 'קריר' }, { emoji: '✨', label: 'זוהר' }],
    layout: 'cinematic',
    sample: {
      kicker: 'מתחת לשמיים',
      title: 'שמרנו לכם רגע נדיר',
      body: 'יש לילות שבהם השמיים עושים משהו שאי אפשר לתכנן. זה אחד מהם.',
      cta: '✦ פתחו',
      messages: ['קחו רגע להסתכל למעלה', 'זה לא קורה כל יום'],
      signoff: 'עד שהאור הבא יופיע.',
    },
  },
  blueprint: {
    pitch: 'רשת טכנית וקווי מדידה — מדויק, נקי וחכם.',
    tags: [{ emoji: '📐', label: 'מדויק' }, { emoji: '🔷', label: 'טכני' }, { emoji: '🤍', label: 'נקי' }],
    layout: 'editorial',
    sample: {
      kicker: 'מתוכנן בקפידה',
      title: 'הכנו לכם משהו מדויק',
      body: 'כל פרט כאן נבחר בכוונה — בדיוק כמו שאתם הייתם רוצים.',
      cta: '→ פתחו',
      messages: ['שום דבר כאן לא מקרי', 'הכול נמדד פעמיים'],
      signoff: 'לפי התוכנית. בדיוק כמו שרצינו.',
    },
  },
  sunset: {
    pitch: 'שמיים בשעת בין ערביים — ורוד, כתום וזהוב שנמסים זה בזה.',
    tags: [{ emoji: '🌅', label: 'חמים' }, { emoji: '📸', label: 'תמונות' }, { emoji: '💛', label: 'רך' }],
    layout: 'cinematic',
    sample: {
      kicker: 'לפני שהשמש שוקעת',
      title: 'תפסנו לכם רגע יפה',
      body: 'יש שעה ביום שבה הכול נראה טוב יותר. שמרנו לכם אותה.',
      cta: '☀ פתחו',
      messages: ['תעצרו שנייה להסתכל', 'זה שווה את זה'],
      signoff: 'עד השקיעה הבאה.',
    },
  },
  noir: {
    pitch: 'שחור-לבן חד עם נגיעת אדום אחת — קולנועי ומסתורי.',
    tags: [{ emoji: '🎬', label: 'קולנועי' }, { emoji: '🖤', label: 'חד' }, { emoji: '🔴', label: 'דרמטי' }],
    layout: 'punch',
    sample: {
      kicker: 'סצנה אחת',
      title: 'יש לנו סיפור בשבילכם',
      body: 'אורות כבים, המוזיקה נכנסת, ואז מתחיל החלק שבו אתם.',
      cta: '● נגנו',
      messages: ['תישארו עד הסוף', 'יש עוד סצנה אחת'],
      signoff: 'אורות כבים. הקרדיטים רצים.',
    },
  },
  candy: {
    pitch: 'ורוד ותכלת רכים עם צורות עגלגלות — מתוק וקליל.',
    tags: [{ emoji: '🍬', label: 'מתוק' }, { emoji: '🫧', label: 'קליל' }, { emoji: '🎈', label: 'שובב' }],
    layout: 'celebration',
    sample: {
      kicker: 'משהו מתוק',
      title: 'הכנו לכם משהו קטן ומתוק',
      body: 'זה לא גדול ולא מסובך. זה פשוט נחמד, וזה בדיוק הרעיון.',
      cta: '🎈 פתחו',
      messages: ['אין כאן שום דבר רציני', 'רק חיוך קטן'],
      signoff: 'זהו. פשוט ומתוק.',
    },
  },
  marble: {
    pitch: 'עורקי אבן ושקט של מוזיאון — יוקרה מאופקת בלי זהב.',
    tags: [{ emoji: '🏛️', label: 'מאופק' }, { emoji: '📖', label: 'עריכתי' }, { emoji: '🤍', label: 'יוקרתי' }],
    layout: 'editorial',
    sample: {
      kicker: 'נשמר בקפידה',
      title: 'משהו ששווה לעצור בשבילו',
      body: 'לא כל דבר צריך לצעוק כדי להיות חשוב. קחו רגע.',
      cta: '— פתחו',
      messages: ['שקט הוא גם עיצוב', 'לא כל דבר צריך למלא את המסך'],
      signoff: 'בשקט, ובכבוד.',
    },
  },

  fairytale: {
    pitch: 'סגול עמוק וניצוצות זהב — קסום, חלומי וכמו יצא מספר סיפורים.',
    tags: [{ emoji: '🏰', label: 'קסום' }, { emoji: '✨', label: 'חלומי' }, { emoji: '📖', label: 'סיפורי' }],
    layout: 'cinematic',
    sample: {
      kicker: 'היה היה',
      title: 'פרק חדש מתחיל',
      body: 'לא כל סיפור מתחיל ב"פעם" — חלקם מתחילים בדיוק עכשיו, איתכם.',
      cta: '✨ פתחו את הספר',
      messages: ['הקסם האמיתי הוא שאתם קיימים', 'וזה כבר סיפור טוב מספיק'],
      signoff: 'וחיו באושר ועושר. ברצינות.',
    },
  },
  sports: {
    pitch: 'ירוק אצטדיון ואור זרקורים עם נגיעת כתום חד — אנרגטי ותחרותי.',
    tags: [{ emoji: '🏆', label: 'ניצחון' }, { emoji: '⚡', label: 'אנרגטי' }, { emoji: '🔥', label: 'תחרותי' }],
    layout: 'punch',
    sample: {
      kicker: 'שריקת פתיחה',
      title: 'זה הרגע שלכם',
      body: 'לא משנה התוצאה — הגעתם עד הנה, וזה כבר ניצחון.',
      cta: '⚡ יאללה',
      messages: ['תנו לזה הכול', 'ואנחנו כבר גאים בכם'],
      signoff: 'קדימה. השריקה כבר נשמעה.',
    },
  },
  military: {
    pitch: 'ירוק זית וזהב פליז — מכובד וממושמע, לגיוס או שחרור.',
    tags: [{ emoji: '🎖️', label: 'גאווה' }, { emoji: '🫡', label: 'מכובד' }, { emoji: '🇮🇱', label: 'שירות' }],
    layout: 'editorial',
    sample: {
      kicker: 'פקודת יום',
      title: 'יש לנו הודעה בשבילכם',
      body: 'לפני שממשיכים — רגע אחד של תשומת לב. מגיע לכם.',
      cta: '⟶ פתחו',
      messages: ['אנחנו גאים בכם', 'ולא רק היום'],
      signoff: 'בכבוד רב, ובתודה אמיתית.',
    },
  },
  sea: {
    pitch: 'תכלת עמוקה וקצף גלים — רגוע, נקי ונאוטי.',
    tags: [{ emoji: '🌊', label: 'רגוע' }, { emoji: '🐚', label: 'נאוטי' }, { emoji: '💙', label: 'צלול' }],
    layout: 'cinematic',
    sample: {
      kicker: 'מעבר לגלים',
      title: 'הפלגנו למצוא לכם משהו',
      body: 'יש שקט מסוים שרק המים יודעים לתת. שמרנו לכם קצת ממנו.',
      cta: '🐚 צללו פנימה',
      messages: ['קחו נשימה עמוקה', 'ותנו לגל הזה לשאת אתכם'],
      signoff: 'עד לגל הבא.',
    },
  },
  world: {
    pitch: 'נייר מפה עתיק ודיו כחולה — נוסטלגי, פתוח לדרך ומלא סקרנות.',
    tags: [{ emoji: '🧭', label: 'נוודי' }, { emoji: '🗺️', label: 'נוסטלגי' }, { emoji: '✈️', label: 'דרך' }],
    layout: 'organic',
    sample: {
      kicker: 'יעד לא ידוע',
      title: 'ארזנו לכם משהו',
      body: 'הכינו דרכון — יש לנו הפתעה שמחכה בתחנה הבאה.',
      cta: '✈ יוצאים לדרך',
      messages: ['לא כל מי שהולך לאיבוד תועה', 'לפעמים פשוט מגלים משהו חדש'],
      signoff: 'עד לנסיעה הבאה שלנו יחד.',
    },
  },

  newborn: {
    pitch: 'תכלת אבקתי על שמנת — רך, שקט וחדש לגמרי.',
    tags: [{ emoji: '🍼', label: 'רך' }, { emoji: '☁️', label: 'עדין' }, { emoji: '🤍', label: 'חדש' }],
    layout: 'cinematic',
    sample: {
      kicker: 'חדש בעולם',
      title: 'ברוך הבא, קטן שלנו',
      body: 'עוד לא הספקת לעשות כלום, וכבר שינית לנו את כל הסדר. בדרך הכי טובה.',
      cta: '✦ פתחו בעדינות',
      messages: ['הכול כאן חדש בשבילך', 'ואנחנו כאן בשבילך'],
      signoff: 'בשקט, ובאהבה גדולה.',
    },
  },
  winter: {
    pitch: 'כחול קרחוני וכפור על זכוכית — צלול, קריר ושקט.',
    tags: [{ emoji: '❄️', label: 'קריר' }, { emoji: '🤍', label: 'צלול' }, { emoji: '🕊️', label: 'שקט' }],
    layout: 'editorial',
    sample: {
      kicker: 'אוויר צלול',
      title: 'שמרנו לכם רגע שקט',
      body: 'יש בוקר חורפי אחד בשנה שבו הכול נראה נקי יותר. שמרנו לכם אותו.',
      cta: '❄ פתחו',
      messages: ['קחו נשימה עמוקה אחת', 'ואז עוד אחת'],
      signoff: 'בחום, גם כשקר בחוץ.',
    },
  },
  desert: {
    pitch: 'חימר, חול וגווני מרווה — חם, יבש ורגוע.',
    tags: [{ emoji: '🏜️', label: 'עפרורי' }, { emoji: '🧡', label: 'חם' }, { emoji: '🌾', label: 'רגוע' }],
    layout: 'organic',
    sample: {
      kicker: 'אופק פתוח',
      title: 'עצרנו כאן בשבילכם',
      body: 'אין לאן למהר, ואין מה להספיק. יש רק את הרגע הזה, וזה מספיק.',
      cta: '☀ פתחו',
      messages: ['השקט כאן הוא לא ריק', 'הוא פשוט מקום לנשום בו'],
      signoff: 'בחום, ובלי חיפזון.',
    },
  },
  bloom: {
    pitch: 'עלי כותרת אפרסק על שנהב — רך, נשי ומלא חיים.',
    tags: [{ emoji: '🌸', label: 'פורח' }, { emoji: '💗', label: 'רך' }, { emoji: '🌿', label: 'טרי' }],
    layout: 'cinematic',
    sample: {
      kicker: 'בדיוק בעונה',
      title: 'משהו פרח בשבילכם',
      body: 'דברים יפים לוקחים זמן לפרוח, וכשהם פורחים אי אפשר לפספס אותם.',
      cta: '❀ פתחו',
      messages: ['קחו רגע להריח', 'זה לא נשאר ככה לנצח'],
      signoff: 'באהבה, ובעונה הנכונה.',
    },
  },
  arcade: {
    pitch: 'פיקסלים גסים וירוק זרחני — משחקי וידאו ישנים, בכוונה.',
    tags: [{ emoji: '👾', label: 'רטרו' }, { emoji: '🕹️', label: 'שובב' }, { emoji: '💚', label: 'זרחני' }],
    layout: 'punch',
    sample: {
      kicker: 'INSERT COIN',
      title: 'שלב חדש נפתח',
      body: 'צברתם מספיק נקודות. הגיע הזמן לראות מה מחכה בשלב הבא.',
      cta: '▶ START',
      messages: ['אין כאן חיים נוספים', 'אז תעשו את זה טוב'],
      signoff: 'GAME OVER? עוד לא. רחוק מזה.',
    },
  },
  zen: {
    pitch: 'דיו סומי על נייר אורז — ריק, מדויק ומאוד שקט.',
    tags: [{ emoji: '☯️', label: 'מאוזן' }, { emoji: '🖌️', label: 'דיו' }, { emoji: '🤍', label: 'ריק' }],
    layout: 'editorial',
    sample: {
      kicker: '—',
      title: 'רגע אחד, לפני הכול',
      body: 'לא צריך למלא כל מקום ריק. לפעמים הריק הוא בדיוק מה שרצינו להגיד.',
      cta: '○ פתחו',
      messages: ['נשימה אחת', 'ואז עוד אחת'],
      signoff: 'בשקט. זה הכול.',
    },
  },
};

export function styleArt(id: TemplateId): StyleArtSpec {
  return STYLE_ART[id] ?? STYLE_ART.birthday;
}
