-- ============================================================
-- Recipient / sender gender for the V2 flow.
--
-- Hebrew conjugates verbs, adjectives and pronouns by gender, so the
-- generated greeting has to know both: who it is written *about* and who it
-- is written *as*. Until now the model inferred this from the free-text
-- description, which it gets wrong whenever the description is short or
-- gender-neutral.
--
-- '' is a valid stored value — the sender may skip both, and the prompt then
-- falls back to phrasing that works either way.
-- ============================================================

ALTER TABLE greetings_v2 ADD COLUMN recipientGender TEXT NOT NULL DEFAULT '';
ALTER TABLE greetings_v2 ADD COLUMN senderGender TEXT NOT NULL DEFAULT '';
