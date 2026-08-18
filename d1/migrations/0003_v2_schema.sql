-- ============================================================
-- Version 2 schema — fully additive.
-- V1 keeps using the `greetings` / `requests` tables untouched;
-- everything below is new and isolated so the two versions can
-- run side by side while they're being compared.
-- ============================================================

CREATE TABLE IF NOT EXISTS greetings_v2 (
  id TEXT PRIMARY KEY,
  -- Short, shareable id used in the public URL (/g/<slug>).
  slug TEXT NOT NULL UNIQUE,
  -- Secret held only by the creator; lets them re-open the editor
  -- without any accounts or login.
  ownerToken TEXT NOT NULL,

  eventType TEXT NOT NULL,
  recipientName TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT '',
  recipientAge TEXT NOT NULL DEFAULT '',
  aboutThem TEXT NOT NULL DEFAULT '',
  sharedMemory TEXT NOT NULL DEFAULT '',
  senderName TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT '',

  -- The AI-authored greeting as structured JSON (see lib/v2/types.ts).
  -- Rendering is driven entirely off this, so new templates can be added
  -- later without touching the generation pipeline.
  content TEXT NOT NULL,

  templateId TEXT NOT NULL,
  musicTrack TEXT NOT NULL DEFAULT '',
  musicEnabled INTEGER NOT NULL DEFAULT 1,
  -- [{ url, type: 'image'|'video', caption }]
  media TEXT NOT NULL DEFAULT '[]',

  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'draft',

  -- Group greetings ("ספר ברכות קבוצתי") are not built yet, but the flag
  -- and the contributions table below exist so turning it on later is a
  -- feature switch rather than a migration of live data.
  allowContributions INTEGER NOT NULL DEFAULT 0,

  viewCount INTEGER NOT NULL DEFAULT 0,
  openCount INTEGER NOT NULL DEFAULT 0,

  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_greetings_v2_slug ON greetings_v2(slug);

-- Future: each friend's entry in a group greeting.
CREATE TABLE IF NOT EXISTS greeting_contributions (
  id TEXT PRIMARY KEY,
  greetingId TEXT NOT NULL,
  authorName TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  mediaUrl TEXT,
  mediaType TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contributions_greeting
  ON greeting_contributions(greetingId);

-- Funnel analytics. Deliberately schemaless in `props` so new events
-- don't need a migration.
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  greetingId TEXT,
  sessionId TEXT,
  props TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_name ON analytics_events(name);
CREATE INDEX IF NOT EXISTS idx_analytics_greeting ON analytics_events(greetingId);
