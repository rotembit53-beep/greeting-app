-- Sender's relationship to the recipient (dad/mom/sister/etc.), used to
-- ground the AI-generated text in something other than just the hobby/theme.
ALTER TABLE greetings ADD COLUMN relationship TEXT NOT NULL DEFAULT '';
