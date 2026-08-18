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
