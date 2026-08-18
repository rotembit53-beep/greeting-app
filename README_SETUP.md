# ברכות אישיות - Personal Interactive Greeting App

## 🎨 About This App

A premium, localhost-only web application for creating beautiful, personalized Hebrew greeting pages. Users fill a 6-step wizard to create greetings with:
- AI-generated Hebrew text (Gemini API)
- Selected background music (auto-scanned from ~/Downloads)
- Custom images/videos
- Admin approval workflow (email-based)
- Share modal (WhatsApp, Gmail, Instagram, Facebook, copy-link)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Gemini API Key (from https://aistudio.google.com/apikey)
- (Optional) Gmail App Password for email approval flow

### 1. Install & Environment Setup

```bash
npm install
```

Create `.env.local`:
```env
GEMINI_API_KEY=your-gemini-api-key
GMAIL_USER=rotembit53@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password-here
ADMIN_EMAIL=rotembit53@gmail.com
```

**To set up Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2FA if not already enabled
3. Go to App Passwords (https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password and paste into `.env.local`

### 2. Run Dev Server

```bash
npm run dev
```

Open http://localhost:3000

### 3. File Structure

```
/greeting-app
  /app
    /page.tsx                    - Main wizard page
    /greeting/[id]/page.tsx      - Published greeting display
    /admin/approved/page.tsx     - Approval confirmation page
    /api
      /scan-audio/route.ts       - Scans ~/Downloads for MP3s
      /upload-media/route.ts     - Image/video upload
      /upload-audio/route.ts     - Custom MP3 upload (reserved)
      /generate-greeting/route.ts- Gemini API integration
      /request-activation/route.ts - Sends approval email
      /greeting-status/route.ts  - Polls greeting approval status
      /approve/route.ts          - Email link approval endpoint
  /components
    /wizard/*.tsx                - 6-step wizard components
    /share/ShareModal.tsx        - Share buttons
  /lib
    audioScanner.ts              - MP3 categorization
    jsonStore.ts                 - Local JSON persistence
    gemini.ts                    - Gemini API client
    mailer.ts                    - Email sending (Nodemailer)
    ids.ts                       - UUID/token generation
  /data
    greetings.json               - All greetings (auto-created)
    requests.json                - Approval requests (auto-created)
  /public/audio                  - Auto-scanned MP3s
  /public/uploads                - User media uploads
```

## 🎨 Design System

**Color Palette (Premium Warm):**
- Primary: `#c95c3c` (Terracotta/Coral)
- Secondary: `#2c3e50` (Deep Navy)
- Accent: `#f4a460` (Sandy Orange)
- Background: `#faf7f2` (Cream)

**Typography:**
- Font: Heebo (Hebrew-optimized)
- RTL (Right-to-Left) layout throughout

## 📋 The 6-Step Wizard

### Step 1: פרטים (Details)
- Recipient name
- Event type (birthday, wedding, graduation, etc.)
- Theme/topic
- Optional user notes

### Step 2: מוזיקה ותמונות (Media & Audio)
- Upload images/videos
- Auto-scanned MP3s from ~/Downloads (categorized)
- Custom MP3 upload
- BuyMe gift link (optional)

### Step 3: טקסט ברכה (AI Text)
- Gemini generates Hebrew greeting text (120-180 words)
- Share data for WhatsApp/Gmail
- Regenerate option

### Step 4: עיצוב ויזואלי (Visual Design)
- Choose visual concept (minimal / cinematic / warm)
- Preview with watermark

### Step 5: אישור (Approval Request)
- Enter recipient contact details
- Submit request → admin email sent
- Polls for approval in background

### Step 6: פורסום ושיתוף (Published & Share)
- Published greeting page at `/greeting/[id]`
- Share modal with buttons
- Auto-unlock when approved

## 🔌 API Endpoints

### GET `/api/scan-audio`
Scans ~/Downloads/~/Music/~/Desktop for MP3s, categorizes them.

### POST `/api/upload-media`
Upload image/video for greeting.

### POST `/api/generate-greeting`
Call Gemini API to generate Hebrew greeting text.

### POST `/api/request-activation`
Submit contact details, send approval email to admin.

### GET `/api/greeting-status?id=<greetingId>`
Poll to check if greeting was approved.

### GET `/api/approve?id=<greetingId>&token=<token>`
Admin clicks email link to approve greeting.

## 📊 Data Flow

1. User fills Steps 1-4 (stored in sessionStorage)
2. User submits contact in Step 5 → `POST /api/request-activation`
3. Admin receives email with approval link
4. Admin clicks link → `GET /api/approve`
5. Request status flips to "approved" in `requests.json`
6. Client polling detects approval → redirects to `/greeting/[id]`
7. Published page renders with Share Modal

## 🛠️ Development Notes

- **Deployed on Cloudflare Workers** (via `@opennextjs/cloudflare`), not localhost-only anymore. Data lives in Cloudflare D1, media/audio in R2 — see "Cloud Deployment" below.
- **Gemini API Key**: If you see auth errors, verify the key format at https://aistudio.google.com/apikey
- **Email Setup**: Approval emails send via Resend (`RESEND_API_KEY`). If unset, the approval endpoint still works — the manual approve link is printed to the Worker logs (`wrangler tail`).
- **Audio Library**: No longer scanned from `~/Downloads` at runtime. `/api/scan-audio` now returns a static manifest (`lib/audioLibrary.json`) of tracks pre-uploaded to the R2 bucket under `audio/{category}/`.

## ✅ What's Implemented

- ✅ 6-step wizard flow with full persistence
- ✅ Hebrew RTL layout throughout
- ✅ Premium warm color palette
- ✅ Local MP3 scanning & categorization
- ✅ Image/video upload
- ✅ Gemini API integration for greeting generation
- ✅ Email approval workflow (Nodemailer + Gmail SMTP)
- ✅ Published greeting page with share modal
- ✅ Social share buttons (WhatsApp, Gmail, Instagram, Facebook)
- ✅ Local JSON persistence (greetings.json, requests.json)
- ✅ Polling approval status

## 🚫 Limitations

- **Localhost-only**: No cloud database, no multi-user sync. Each machine has its own isolated data.
- **Audio categorization**: Keyword-scored, not AI-powered. May misclassify some files.
- **Email (optional)**: Requires Gmail App Password. If not set, email sending fails but approval flow still works via manual URL.
- **No Sanity CMS**: Content is not editable via UI. Greetings are stored as JSON.

## 🧪 Testing Checklist

1. ✅ Form validation (Step 1 requires all fields, Step 2 media upload)
2. ✅ Audio scanning (MP3 category buttons populate from ~/Downloads)
3. ✅ AI generation (Gemini API generates greeting text or shows error)
4. ✅ Visual previews (3 concepts load)
5. ✅ Email sending (approval email arrives in inbox, contains approval link)
6. ✅ Status polling (published page waits for approval)
7. ✅ Share modal (buttons open WhatsApp, Gmail, Instagram, Facebook)

## 📝 Deployment (Cloudflare)

The app deploys as a Cloudflare Worker via `@opennextjs/cloudflare` (Next.js 16 isn't
supported by the legacy `@cloudflare/next-on-pages` adapter, so this project uses the
current OpenNext adapter instead — same Workers & Pages product, newer toolchain).

Wrangler (and the OpenNext CLI) require **Node ≥22**; if your default `node` is older,
prefix commands with a Node 22 binary on PATH, e.g.:
`PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run deploy`

```bash
npm run build      # plain `next build` — type-checks against Cloudflare's runtime types
npm run preview     # opennextjs-cloudflare build + local wrangler preview
npm run deploy       # opennextjs-cloudflare build + wrangler deploy (prod)
npm run cf-typegen  # regenerate cloudflare-env.d.ts after changing wrangler.toml bindings
```

Bindings (`wrangler.toml`): D1 database `interagift-db` (binding `DB`), R2 bucket
`interagift-media` (binding `MEDIA_BUCKET`). Secrets (`wrangler secret put <NAME>`):
`GEMINI_API_KEY`, `RESEND_API_KEY`. `ADMIN_EMAIL` is a plain `[vars]` entry in
`wrangler.toml`. For local `wrangler dev`/`preview`, the same keys go in `.dev.vars`
(gitignored).

D1 schema lives in `d1/schema.sql` — apply with
`wrangler d1 execute interagift-db --remote --file=./d1/schema.sql` (drop `--remote`
for the local dev database).

## 💡 Tips

- **Audio files won't show initially**: Run `/api/scan-audio` first or click the step to trigger it.
- **No email? That's OK**: The approval link appears in server logs anyway. Copy it manually.
- **Restart for env changes**: If you update `.env.local`, restart `npm run dev`.
- **Music from Apple Music**: Your MP3 files in ~/Downloads are recognized. Ensure they're `.mp3` format.

---

**Version**: 1.0 (Localhost Preview)  
**Last Updated**: 2026-08-16  
**Author**: Built with Claude Code
