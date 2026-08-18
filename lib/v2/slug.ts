/**
 * Short, URL-safe, unambiguous ids for the public /g/<slug> links.
 *
 * Deliberately excludes look-alike characters (0/O, 1/l/I) so a slug can be
 * read out loud or re-typed from a screenshot without ambiguity.
 */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const SLUG_LENGTH = 8;

export function generateSlug(length = SLUG_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export const SLUG_PATTERN = new RegExp(`^[${ALPHABET}]{4,16}$`);

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
