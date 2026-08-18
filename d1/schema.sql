CREATE TABLE IF NOT EXISTS greetings (
  id TEXT PRIMARY KEY,
  recipientName TEXT NOT NULL,
  eventType TEXT NOT NULL,
  theme TEXT NOT NULL,
  userNotes TEXT NOT NULL DEFAULT '',
  recipientGender TEXT NOT NULL DEFAULT '',
  relationship TEXT NOT NULL DEFAULT '',
  mediaFiles TEXT NOT NULL DEFAULT '[]',
  mediaAudioSettings TEXT NOT NULL DEFAULT '{}',
  buyMeLink TEXT NOT NULL DEFAULT '',
  audioTrack TEXT NOT NULL DEFAULT '',
  aiText TEXT NOT NULL,
  giftCard TEXT,
  visualConcept TEXT NOT NULL,
  designPrompt TEXT NOT NULL DEFAULT '',
  designOverrides TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  greetingId TEXT NOT NULL,
  contactName TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL,
  requestedAt TEXT NOT NULL,
  approvedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_requests_greetingId ON requests(greetingId);

-- ============================================================
-- Version 2 tables (see d1/migrations/0003_v2_schema.sql).
-- Additive only — V1 continues to use `greetings` / `requests` above.
-- ============================================================

CREATE TABLE IF NOT EXISTS greetings_v2 (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  ownerToken TEXT NOT NULL,
  eventType TEXT NOT NULL,
  recipientName TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT '',
  recipientAge TEXT NOT NULL DEFAULT '',
  aboutThem TEXT NOT NULL DEFAULT '',
  sharedMemory TEXT NOT NULL DEFAULT '',
  senderName TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  templateId TEXT NOT NULL,
  musicTrack TEXT NOT NULL DEFAULT '',
  musicEnabled INTEGER NOT NULL DEFAULT 1,
  media TEXT NOT NULL DEFAULT '[]',
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'draft',
  allowContributions INTEGER NOT NULL DEFAULT 0,
  gift TEXT NOT NULL DEFAULT '',
  coverMediaId TEXT NOT NULL DEFAULT '',
  giftInterests TEXT NOT NULL DEFAULT '[]',
  giftBudget TEXT NOT NULL DEFAULT '',
  viewCount INTEGER NOT NULL DEFAULT 0,
  openCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_greetings_v2_slug ON greetings_v2(slug);

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
