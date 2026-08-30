import { EVENT_BY_ID, EventType, GenderValue } from '../types';
import { GAME_ICONS, GAME_THEMES } from './art';
import { OPENING_MECHANICS, OpeningPreference } from './types';

/**
 * The prompt that turns "who is this person" into "what game would they
 * actually enjoy".
 *
 * The instruction that matters most is the negative one: do not take a stock
 * game and rename it. The mechanic is chosen to serve the concept, and the
 * concept comes from one strong personal detail — not from cramming every
 * fact into one board.
 */

export const OPENING_SYSTEM_PROMPT = `You design a tiny interactive challenge that someone plays for 10-30
seconds to unlock a personal Hebrew greeting made for them.

You are given real details about the recipient, written by the person who knows them.
Your job is to invent a game that could only have been made for THIS person.

HOW TO THINK
1. Read everything and find the single strongest personal HOOK — a hobby, a team, a
   destination, a job, a running joke, a food they love, a shared story. One strong hook
   beats five weak references.
2. Decide what tiny challenge would express that hook. Think of the concept FIRST.
3. Only then pick the mechanic from the list that best carries the concept.
4. Write every piece of content so it belongs to that concept. An item list of generic
   emoji is a failure; the objects must be the actual things from their life.

THE MECHANICS (pick the one that fits the concept — never the other way round)
- tap-targets: things fly across the screen and they tap the right ones.
  Good for: collecting, catching, scoring, gathering favourite things.
- timing-bar: a marker sweeps a bar and they must stop it in the zone.
  Good for: a penalty kick, a perfect shot, a precise moment, landing something.
- sequence-order: they pick items in the correct order. items[] order IS the answer.
  Good for: a recipe, packing for a trip, a route, steps of a ritual.
- memory-match: flip cards to find pairs.
  Good for: memories, couples, "how well do you remember".
- dodge-run: steer along a lane, collect the good, avoid the bad.
  Good for: a journey, getting somewhere on time, an obstacle they joke about.
- quiz-unlock: 1-3 questions only someone who knows them could answer.
  Good for: rich free text, inside jokes, long friendships.

ART DIRECTION (this decides whether the game looks real)
The game is DRAWN, not rendered from emoji. You choose from a fixed art library
and the engine draws layered vector illustrations of what you pick.

- theme: the WORLD the game is staged in. Pick the place the hook actually lives:
  football -> stadium, cooking -> kitchen, a trip -> travel or beach, a band -> concert,
  gaming -> arcade, hiking -> mountain, coffee -> cafe, a birthday party -> party.
  Choosing well is the single biggest factor in how good the game looks.
- icon (per item): the object to draw, from the icon library. ALWAYS set this.
  Pick the closest real object — "ball-soccer", "coffee", "dog", "plane".
- avatarIcon: for dodge-run, the thing the player controls. Optional elsewhere.
- goalLabel: 1-2 Hebrew words for what the score counts ("גולים", "זיכרונות",
  "כוסות קפה"). It appears in the HUD, so the score reads as part of the story.
- emoji: still required per item as a fallback. Pick one that matches the icon.

RULES
- Write ALL player-facing text in Hebrew. Match the recipient's gender in every
  verb and pronoun; match the sender's gender when the text speaks as the sender.
- NEVER invent facts. Use only what you were told. If you were told little, choose a
  concept that works from the occasion and relationship alone, and say so via a generic hook.
- Keep it winnable and short. This is a doorway, not a game session.
- The victory line should land the joke or the warmth — it is the payoff.
- The fail line is gentle and funny. Never harsh, never "game over".
- One emoji per item, as the fallback only. No markup, no URLs, no hashtags.
- Do not put the product name anywhere.

Return ONLY the JSON object. No markdown fences, no commentary.`;

export interface OpeningPromptInput {
  eventType: EventType;
  recipientName: string;
  recipientGender: GenderValue;
  senderName?: string;
  senderGender?: GenderValue;
  relationship?: string;
  recipientAge?: string;
  aboutThem?: string;
  sharedMemory?: string;
  tone?: string;
  /** Text already written for the greeting — a rich source of personal detail. */
  greetingText?: string;
  photoCount: number;
  videoCount: number;
  preference: OpeningPreference;
}

function describeGender(value: GenderValue | undefined): string {
  if (value === 'male') return 'male (masculine Hebrew forms)';
  if (value === 'female') return 'female (feminine Hebrew forms)';
  return 'not specified — use phrasing that works for either';
}

export function buildOpeningPrompt(input: OpeningPromptInput): string {
  const event = EVENT_BY_ID[input.eventType];
  const lines: string[] = [
    `Occasion: ${event?.label ?? input.eventType}`,
    `Recipient's name: ${input.recipientName}`,
    `Recipient's gender: ${describeGender(input.recipientGender)}`,
    `Sender's gender: ${describeGender(input.senderGender)}`,
  ];

  if (input.relationship) lines.push(`Relationship to the sender: ${input.relationship}`);
  if (input.recipientAge) lines.push(`Age: ${input.recipientAge}`);
  if (input.senderName) lines.push(`Sender's name: ${input.senderName}`);
  if (input.tone) lines.push(`Requested tone: ${input.tone}`);
  if (input.aboutThem) lines.push(`What the sender says about them: """${input.aboutThem}"""`);
  if (input.sharedMemory) lines.push(`A shared memory: """${input.sharedMemory}"""`);
  if (input.greetingText) {
    lines.push(`The greeting already written for them: """${input.greetingText}"""`);
  }

  lines.push(
    `They uploaded ${input.photoCount} photo(s) and ${input.videoCount} video(s).`
  );

  // A pinned mechanic still gets a fully personal concept — only the engine
  // is fixed. Otherwise the model owns the choice completely.
  const mechanicRule =
    input.preference === 'surprise'
      ? `Choose whichever mechanic best serves your concept. Allowed: ${OPENING_MECHANICS.join(', ')}.`
      : `The creator specifically chose the "${input.preference}" mechanic. You MUST use mechanic: "${input.preference}", but the concept, objects and all copy must still be built around this person's strongest hook.`;

  const photoRule = input.photoCount >= 4
    ? `They have enough photos to play memory-match with real pictures. Set usePhotos: true ONLY if you choose memory-match and the photos genuinely improve it.`
    : `Set usePhotos: false — there are not enough photos to build a board from.`;

  return `${lines.join('\n')}

${mechanicRule}
${photoRule}

Design the opening challenge now.

Output exactly ONE JSON object and nothing else, with these keys:
- mechanic (one of: ${OPENING_MECHANICS.join(', ')})
- theme (one of: ${GAME_THEMES.join(', ')})
- title (string, Hebrew, max 60 — the game's name)
- instruction (string, Hebrew, max 140 — what the player does, in one line)
- goalLabel (string, Hebrew, max 14 — what the score counts)
- avatarIcon (icon name, or "" — the player's character; dodge-run especially)
- durationSec (integer 8-60)
- targetCount (integer 1-12 — how many successes are needed to win)
- difficulty ("easy" or "medium")
- items (array, max 12, each: { icon, emoji, label (Hebrew, short), good (boolean) })
    icon MUST be one of: ${GAME_ICONS.join(', ')}
    tap-targets: good items are the ones to tap, good:false are the ones to avoid
    sequence-order: array order IS the correct order, all good:true
    memory-match: each entry is ONE card that will be paired automatically, all good:true
    dodge-run: good:true are collectibles, good:false are obstacles (need at least one)
    timing-bar / quiz-unlock: may be an empty array
- questions (array, max 3, each: { question, options (2-4 strings), answerIndex }) — quiz-unlock only, otherwise []
- victoryTitle (string, Hebrew, max 60)
- victoryLine (string, Hebrew, max 180)
- failLine (string, Hebrew, max 140 — gentle and funny)
- hookUsed (string, max 80 — the personal detail you built this from, in English)
- usePhotos (boolean)`;
}
