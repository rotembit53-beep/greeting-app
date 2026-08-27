import { z } from 'zod';

/**
 * The opening experience: a short, personal challenge the recipient plays
 * before the greeting unlocks.
 *
 * The model does NOT write the game. It writes a *configuration* that one of
 * the engines below renders — the mechanic is chosen from a fixed vocabulary,
 * but everything that makes the game feel personal (the concept, the goal,
 * the objects, the narrative, every line of copy) is authored per greeting.
 *
 * That split is deliberate and non-negotiable: shipping model-written code to
 * a recipient's browser would be arbitrary script execution, and no amount of
 * prompt discipline makes that safe. A declarative config validated by the
 * schema below can be wrong or boring, but it can never be dangerous.
 */

export const OPENING_MECHANICS = [
  /** Tap the right things before the clock runs out. */
  'tap-targets',
  /** Stop a travelling marker inside a target zone. Timing, not speed. */
  'timing-bar',
  /** Choose items in the correct order (a recipe, a packing list, a route). */
  'sequence-order',
  /** Flip cards to find matching pairs — can be played with real photos. */
  'memory-match',
  /** Steer along a lane, collecting the good and dodging the bad. */
  'dodge-run',
  /** Answer a couple of questions only someone who knows them would get. */
  'quiz-unlock',
] as const;

export type OpeningMechanic = (typeof OPENING_MECHANICS)[number];

/**
 * What the creator asked for.
 *
 * 'classic' means the original envelope/gift/balloon gate — no game at all.
 * A specific mechanic still gets fully personalised content; only the
 * mechanic itself is pinned.
 */
export const OPENING_PREFERENCES = ['surprise', 'classic', ...OPENING_MECHANICS] as const;
export type OpeningPreference = (typeof OPENING_PREFERENCES)[number];

/**
 * A string the model is allowed to overshoot.
 *
 * Length limits here exist for layout, not correctness, and rejecting the
 * whole config over one long sentence throws away a perfectly good game — the
 * first real failure in testing was an over-long `hookUsed`, a field that is
 * never even rendered. So anything within a generous ceiling is trimmed to
 * fit (on a word boundary, so it still reads) instead of failing validation.
 * Genuinely absurd input still fails, which keeps this from being a way to
 * smuggle a wall of text into the page.
 */
function lenientText(max: number) {
  return z
    .string()
    .max(max * 5)
    .transform((value) => {
      const text = value.trim();
      if (text.length <= max) return text;
      const cut = text.slice(0, max);
      const lastSpace = cut.lastIndexOf(' ');
      return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
    });
}

/** One thing the player interacts with. */
export const OpeningItemSchema = z.object({
  /** A single emoji. The engines render this — never model-supplied markup. */
  emoji: z.string().min(1).max(8),
  /** Short Hebrew label, shown on cards and in the sequence list. */
  label: lenientText(28).optional().default(''),
  /**
   * Whether collecting/tapping this is correct. For 'sequence-order' the
   * array order *is* the correct order and this stays true.
   */
  good: z.boolean().optional().default(true),
});

export type OpeningItem = z.infer<typeof OpeningItemSchema>;

export const OpeningQuestionSchema = z.object({
  question: lenientText(120).pipe(z.string().min(1)),
  options: z.array(lenientText(48).pipe(z.string().min(1))).min(2).max(4),
  answerIndex: z.number().int().min(0).max(3),
});

export const OpeningConfigSchema = z
  .object({
    mechanic: z.enum(OPENING_MECHANICS),

    /** The game's name, e.g. "בעיטת העונשין של דני". Short — it's a headline. */
    title: lenientText(60).pipe(z.string().min(1)),
    /** One line telling the player exactly what to do. */
    instruction: lenientText(140).pipe(z.string().min(1)),

    /** How long they get. Clamped hard: this is a doorway, not a game session. */
    durationSec: z.number().int().min(8).max(60).optional().default(20),
    /** How many successes are needed to win. */
    targetCount: z.number().int().min(1).max(12).optional().default(3),
    difficulty: z.enum(['easy', 'medium']).optional().default('easy'),

    items: z.array(OpeningItemSchema).max(12).optional().default([]),
    questions: z.array(OpeningQuestionSchema).max(3).optional().default([]),

    victoryTitle: lenientText(60).pipe(z.string().min(1)),
    victoryLine: lenientText(180).optional().default(''),
    /** Shown on a miss. Must stay light — never a harsh "game over". */
    failLine: lenientText(140).optional().default(''),

    /**
     * Which personal detail this was built from. Not rendered; kept so we can
     * tell a genuinely personal game from a generic one when reviewing.
     */
    hookUsed: lenientText(80).optional().default(''),
    /** Whether the recipient's own photos are used as game objects. */
    usePhotos: z.boolean().optional().default(false),
  })
  .superRefine((cfg, ctx) => {
    const needsItems: OpeningMechanic[] = [
      'tap-targets',
      'sequence-order',
      'memory-match',
      'dodge-run',
    ];

    if (needsItems.includes(cfg.mechanic) && cfg.items.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: `${cfg.mechanic} needs at least 2 items`,
      });
    }

    // The whole point of an ordering game is the order, and two steps is not
    // an order worth playing.
    if (cfg.mechanic === 'sequence-order' && cfg.items.length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'sequence-order needs at least 3 steps',
      });
    }

    // Something has to be worth avoiding, or there is no game.
    if (cfg.mechanic === 'dodge-run' && !cfg.items.some((i) => !i.good)) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'dodge-run needs at least one obstacle (good: false)',
      });
    }

    if (cfg.mechanic === 'tap-targets' && !cfg.items.some((i) => i.good)) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'tap-targets needs at least one good item',
      });
    }

    if (cfg.mechanic === 'quiz-unlock') {
      if (!cfg.questions.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions'],
          message: 'quiz-unlock needs at least one question',
        });
      }
      cfg.questions.forEach((q, i) => {
        if (q.answerIndex >= q.options.length) {
          ctx.addIssue({
            code: 'custom',
            path: ['questions', i, 'answerIndex'],
            message: 'answerIndex is out of range for this question',
          });
        }
      });
    }
  });

export type OpeningConfig = z.infer<typeof OpeningConfigSchema>;

/**
 * Normalises a config so an engine can trust it without re-deriving limits.
 *
 * The model is asked for a sensible targetCount, but it routinely asks for
 * more successes than there are objects to succeed on — which would be an
 * unwinnable doorway. Clamping here (rather than in each engine) means every
 * engine gets a config that is winnable by construction.
 */
export function normaliseOpening(config: OpeningConfig): OpeningConfig {
  const goodCount = config.items.filter((i) => i.good).length;

  let targetCount = config.targetCount;

  if (config.mechanic === 'sequence-order') {
    targetCount = config.items.length;
  } else if (config.mechanic === 'memory-match') {
    // Pairs, capped at 6 so the board stays a doorway and not a puzzle night.
    targetCount = Math.min(Math.max(config.items.length, 2), 6);
  } else if (config.mechanic === 'quiz-unlock') {
    targetCount = config.questions.length;
  } else if (config.mechanic === 'tap-targets') {
    // Targets respawn, so more successes than objects is fine — but keep it
    // reachable inside the time limit.
    targetCount = Math.min(targetCount, 10);
  } else if (config.mechanic === 'dodge-run') {
    targetCount = Math.min(targetCount, Math.max(goodCount, 1) * 2);
  }

  return { ...config, targetCount: Math.max(1, targetCount) };
}

/** Parses stored JSON, returning null for anything unusable. */
export function parseOpening(raw: string): OpeningConfig | null {
  if (!raw) return null;
  try {
    const parsed = OpeningConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? normaliseOpening(parsed.data) : null;
  } catch {
    return null;
  }
}
