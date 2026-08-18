-- Recipient gender (male/female) so the AI writes grammatically-correct
-- gendered Hebrew, and a per-video map of whether that video keeps its
-- own audio or plays muted (so background music can take over instead).
ALTER TABLE greetings ADD COLUMN recipientGender TEXT NOT NULL DEFAULT '';
ALTER TABLE greetings ADD COLUMN mediaAudioSettings TEXT NOT NULL DEFAULT '{}';
