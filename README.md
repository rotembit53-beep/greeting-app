# Interagift — מחולל ההפתעות האינטראקטיביות

זו הגרסה הראשית של המוצר (מה שנקרא בעבר V2).

## כתובות

| | כתובת |
|---|---|
| דף הבית | `/` |
| יצירה | `/create` |
| הברכה שהנמען מקבל | `/g/<slug>` |

V1 הוסרה מהקוד ב-2026-08-18; היא שמורה בהיסטוריית git (commit `83a62c5`).

## מבנה

| שכבה | קבצים |
|---|---|
| טבלאות | `greetings_v2`, `greeting_contributions`, `analytics_events` |
| Data layer | `lib/v2/db.ts` |
| AI | `lib/v2/ai.ts` |
| קומפוננטות | `components/v2/**` |
| API | `/api/v2/*` · מדיה: `/api/upload-media`, `/api/media/[...path]` |
| עיצוב | `app/globals.css` + `components/v2/v2.css` (תחת `.v2-scope`) |

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

## 🎁 מתנות

המתנה היא **סצנה**, לא רשימה. היא מופיעה רק בסוף, אחרי שהנמען קרא הכול:

> רגע… · באמת חשבת שזה נגמר? 😏 · [קופסת מתנה] · בחרתי לך משהו ❤️

- `lib/v2/gifts.ts` — סוגי מתנה (כרטיס מתנה / BUYME / כרטיסים / שוברים / סכום),
  קטגוריות תחומי עניין, תקציבים, ומנוע המלצות.
- `components/v2/experience/GiftScene.tsx` — הקופסה שנפתחת + חשיפת המתנה.
- `components/v2/create/GiftStep.tsx` — שלב בחירת המתנה ב-Wizard.
- `/api/v2/gift-suggestions` — המלצות.

### הכלל שנאכף בקוד: לא ממציאים

אין שמות עסקים, אין מחירי שוק, אין זמינות ואין קישורי רכישה מומצאים.

- ההמלצות הן **ברמת קטגוריה** ("שובר למסעדה"), והמחיר המוצג הוא התקציב
  שהמשתמש עצמו בחר.
- ה-AI מוגבל ל-**enum סגור** של תחומי עניין (`suggestGiftInterests`) — הוא בוחר
  קטגוריות בלבד, והקטלוג הדטרמיניסטי הופך אותן לרעיונות. מבנית אין לו דרך
  להמציא ספק או מחיר.
- כל הצעה נושאת `fulfillable`. כרגע `false` לכולן, וה-UI אומר את זה במפורש:
  המשתמש רוכש את השובר בעצמו ומדביק קוד/קישור.
- חיבור ספק אמיתי = מימוש `GiftProvider` ו-`registerProvider(...)`. תוצאות
  אמיתיות מדורגות אוטומטית מעל הקטלוג ומקבלות `checkoutUrl` אמיתי.

## 🖼️ מדיה

- `MediaItem` תומך ב-`image` / `video` / `audio`, עם `id`, `role`
  (`library` / `cover` / `memory` / `final` / `surprise`) ומידות.
- **תמונת פתיחה** — נבחרת ב-Editor ומוצגת לפני הטקסט.
- **הצגה לפי Theme** — לכל Template יש `photoPresentation`:
  `polaroid` (יום הולדת) · `cinematic` + Ken Burns (רומנטי, מינימלי) ·
  `parallax` (יוקרתי) · `cards3d` (מסיבה) · `wall` (מצחיק).
  אף פעם לא grid סתמי.
- **העלאה**: Drag & Drop, בחירה מרובה, כפתור 📷 צילום במובייל (`capture`),
  Progress bar, Preview מיידי, מחיקה, שינוי סדר וכיתובים.
- **דחיסה בצד הלקוח** (`lib/v2/imageCompress.ts`) — תמונות מוקטנות ל-2000px
  ומקודדות מחדש לפני ההעלאה. תמונת טלפון של 6MB הופכת לכמה מאות KB.
- **אבטחה**: סוג הקובץ וגודלו נבדקים בשרת (`/api/upload-media`), וכל ברכה
  מקבלת תיקייה משלה ב-R2 לפי UUID.

## מה הוכן אבל לא מומש — במכוון

- **תשלומים.** `plan` הוא עמודה, וכל השערים קוראים מ-`lib/v2/plan.ts`.
  חיבור ספק תשלום = עדכון `plan` ל-`premium` אחרי webhook. לא נבנתה מערכת
  תשלומים לפני שה-MVP עובד, בהתאם להנחיה.
- **ברכות קבוצתיות.** `greeting_contributions` ו-`allowContributions` כבר
  קיימים, כך שהפעלה בעתיד היא feature flag ולא מיגרציה של דאטה חי.
- **וידאו.** הארכיטקטורה תומכת (`MediaItem.type === 'video'`, והסצנות
  מרנדרות וידאו) והוא מוגדר כיכולת פרימיום.
- **הודעה קולית.** `MediaItem.type === 'audio'` נתמך במודל ובסצנות, אבל אין
  עדיין UI להקלטה.
- **שיוך מדיה לכל Scene.** ה-`role` קיים במודל ובמרנדר; ה-Editor מאפשר כרגע
  לבחור תמונת Cover בלבד, והשאר נכנס ל-Memories.
- **AI Photo Placement.** לא מומש. המודל (`role`) מוכן לקבל החלטה כזו,
  ובכל מקרה היא תדרוש אישור משתמש לפני שינוי.
- **ספקי מתנות אמיתיים (BUYME וכו').** ממשק `GiftProvider` מוכן; אין עדיין
  אינטגרציה.

## הערה על ביצועים

יצירת הברכה לוקחת כ-30 שניות מול Gemini. מסך ה-"בונה את ההפתעה" מחזיק
את המשתמש עד שהתשובה חוזרת. אם רוצים לרדת מזה — כדאי לבדוק מודל מהיר יותר
ב-`MODEL_CANDIDATES` שב-`lib/v2/ai.ts`.
