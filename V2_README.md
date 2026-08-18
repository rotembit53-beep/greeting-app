# Version 2 — מחולל ההפתעות האינטראקטיביות

V2 נבנתה **לצד** V1, לא במקומה. שתי הגרסאות רצות במקביל על אותו פרויקט,
אותו D1 ואותו R2 — וניתן להשוות ביניהן לפני שמחליטים מה הופך לגרסה הראשית.

## מעבר בין הגרסאות

| | כתובת |
|---|---|
| **V1** (הגרסה הקיימת) | `/` · הברכה: `/greeting/<uuid>` |
| **V2** (החדשה) | `/v2` · יצירה: `/v2/create` · הברכה: `/g/<slug>` |

יש קישור הדדי: כפתור **"✨ גרסה 2"** בכותרת של V1, וקישור **"לגרסה הקודמת"**
בכותרת של V2.

## מה מופרד — ולמה V1 לא יכולה להישבר

הפרדה מלאה בכל שכבה:

| שכבה | V1 | V2 |
|---|---|---|
| טבלאות | `greetings`, `requests` | `greetings_v2`, `greeting_contributions`, `analytics_events` |
| Data layer | `lib/db.ts` | `lib/v2/db.ts` |
| AI | `lib/gemini.ts` | `lib/v2/ai.ts` |
| קומפוננטות | `components/wizard`, `components/greeting` | `components/v2/**` |
| API | `/api/*` | `/api/v2/*` |
| עיצוב | `app/globals.css` | `components/v2/v2.css` (הכול תחת `.v2-scope`) |

**מה כן משותף (קריאה בלבד, ללא שינוי):** `lib/media.ts`, `lib/ids.ts`,
`/api/upload-media`, `/api/media/[...path]`, ו-R2. V2 משתמשת בהם כפי שהם —
אף אחד מהם לא שונה עבורה.

הקבצים של V1 לא מכילים ולו הפניה אחת ל-V2, פרט לקישור המעבר שנוסף בכותרת.

## הארכיטקטורה — ה-AI מחזיר מסמך, לא טקסט

`/api/v2/generate` מחזיר JSON מובנה (`GreetingContent` ב-`lib/v2/types.ts`):

```jsonc
{
  "title": "...", "intro": "...",
  "sections": [{ "heading": "...", "body": "...", "kind": "memory|quality|wish|joke|story" }],
  "messages": ["..."], "closing": "...", "surprise": "...",
  "tone": "...", "animation": "...", "template": "...", "musicMood": "..."
}
```

ה-Frontend מרנדר את המבנה הזה. לכן אפשר להוסיף Templates חדשים בלי לגעת
במנגנון ה-AI.

## Templates

שישה, ב-`lib/v2/templates.ts`. כל אחד מגדיר לא רק צבעים אלא גם טיפוגרפיה,
עיטורים, פרופיל תנועה **ואת רצף הסצנות** — כך ששניים מהם נבדלים מבנית ולא
רק בגוון:

`birthday` · `romantic` · `elegant` (premium) · `funny` · `minimal` · `party` (premium)

הסצנות: `gate-envelope` / `gate-gift` / `gate-balloons` → `reveal` →
`messages` → `memories` → `surprise` → `closing`.

## מוזיקה

`lib/v2/music.ts` — 21 טראקים מאורגנים לפי **אווירה** (רומנטי / מרגש / שמח /
מצחיק / מסיבה / רגוע) עם Preview לכל טראק, ON/OFF ושליטת ווליום.
כל הקבצים הם אותם royalty-free שכבר קיימים ב-R2 עבור V1 — לא נוסף ולא הוסר
דבר, והקטגוריות של V1 ממשיכות לעבוד כרגיל.

המוזיקה מתחילה רק אחרי אינטראקציה של המשתמש (פתיחת המעטפה/המתנה), ואם
הדפדפן בכל זאת חוסם — היא עולה מושתקת עם כפתור הפעלה ברור.

## Analytics

`/api/v2/analytics` (POST לרישום, GET ל-Funnel). אירועים:
`landing_view`, `started_creating`, `event_selected`, `completed_details`,
`generated_greeting`, `opened_editor`, `greeting_published`, `greeting_shared`,
`greeting_opened`, `greeting_completed`, `premium_click`, `purchase`.

לכל ברכה נשמרים גם `viewCount` ו-`openCount`.

## Migration

```bash
wrangler d1 execute interagift-db --remote --file=./d1/migrations/0003_v2_schema.sql
```

(הורדת `--remote` להרצה מקומית. הועבר כבר על מסד הפיתוח המקומי.)

## מה הוכן אבל לא מומש — במכוון

- **תשלומים.** `plan` הוא עמודה, וכל השערים קוראים מ-`lib/v2/plan.ts`.
  חיבור ספק תשלום = עדכון `plan` ל-`premium` אחרי webhook. לא נבנתה מערכת
  תשלומים לפני שה-MVP עובד, בהתאם להנחיה.
- **ברכות קבוצתיות.** `greeting_contributions` ו-`allowContributions` כבר
  קיימים, כך שהפעלה בעתיד היא feature flag ולא מיגרציה של דאטה חי.
- **וידאו.** הארכיטקטורה תומכת (`MediaItem.type === 'video'`, והסצנה
  מרנדרת וידאו) והוא מוגדר כיכולת פרימיום.

## הערה על ביצועים

יצירת הברכה לוקחת כ-30 שניות מול Gemini. מסך ה-"בונה את ההפתעה" מחזיק
את המשתמש עד שהתשובה חוזרת. אם רוצים לרדת מזה — כדאי לבדוק מודל מהיר יותר
ב-`MODEL_CANDIDATES` שב-`lib/v2/ai.ts`.
