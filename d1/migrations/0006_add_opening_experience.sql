-- ============================================================
-- The personalised opening experience.
--
-- Stores the validated game *configuration* (see lib/v2/opening/types.ts) as
-- JSON — never code. '' means "no game": the greeting falls back to the
-- classic envelope / gift / balloon gate, which is also what every failure
-- path resolves to.
-- ============================================================

ALTER TABLE greetings_v2 ADD COLUMN opening TEXT NOT NULL DEFAULT '';
