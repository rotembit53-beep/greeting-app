-- ============================================================
-- Gifts + richer media model.
-- ============================================================

-- The attached digital gift, as JSON (see lib/v2/gifts.ts).
-- NULL / '' means the greeting has no gift.
ALTER TABLE greetings_v2 ADD COLUMN gift TEXT NOT NULL DEFAULT '';

-- Which media item (by id) is the cover / opening image.
ALTER TABLE greetings_v2 ADD COLUMN coverMediaId TEXT NOT NULL DEFAULT '';

-- What the sender told us about the recipient's interests + budget, kept so
-- the gift recommendations can be regenerated later without re-asking.
ALTER TABLE greetings_v2 ADD COLUMN giftInterests TEXT NOT NULL DEFAULT '[]';
ALTER TABLE greetings_v2 ADD COLUMN giftBudget TEXT NOT NULL DEFAULT '';
