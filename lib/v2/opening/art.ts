/**
 * The visual vocabulary of the opening games.
 *
 * This module is data only — no JSX — so the schema, the prompt and the
 * server-side generator can all import it. The components that actually draw
 * these live in `components/v2/experience/opening/kit/`.
 *
 * WHY A FIXED VOCABULARY
 *
 * The security model of the whole opening system is that the model writes a
 * *configuration*, never code or markup (see `types.ts`). That rule is what
 * keeps a model-authored game safe to run in a recipient's browser. But it
 * used to mean every game object was an emoji, because an emoji is the only
 * picture you can safely accept as a free-text string — and a screen full of
 * emoji is exactly what made the games read as cheap.
 *
 * Naming the art instead solves both halves: the model picks `icon: "ball-soccer"`
 * from a closed list, we draw a real layered vector, and nothing model-authored
 * ever reaches the DOM as markup. Same guarantee, an entirely different ceiling
 * on how good the result can look.
 */

/* ------------------------------------------------------------------ *
 * Icons — the objects a game is played with
 * ------------------------------------------------------------------ */

/**
 * Every object the games can draw.
 *
 * Chosen to cover the hooks people actually write in the "about them" box —
 * a sport, a drink, a pet, a destination, an instrument, a running joke — with
 * enough obstacles to give the dodging games something to avoid. Grouped by
 * subject so `inferIcon` below can fall back sensibly.
 */
export const GAME_ICONS = [
  // Sport & movement
  'ball-soccer', 'ball-basket', 'ball-tennis', 'trophy', 'medal', 'dumbbell',
  'bike', 'sneaker', 'surfboard', 'ski',
  // Food & drink
  'coffee', 'wine', 'beer', 'cocktail', 'pizza', 'burger', 'cake', 'icecream',
  'croissant', 'sushi', 'pan', 'chef-hat', 'avocado', 'watermelon',
  // Travel & place
  'plane', 'suitcase', 'palm', 'map-pin', 'compass', 'camera', 'mountain',
  'tent', 'boat', 'car', 'globe',
  // Music, art & screen
  'music-note', 'guitar', 'headphones', 'microphone', 'palette', 'film',
  'ticket', 'book',
  // Tech & play
  'laptop', 'phone', 'rocket', 'planet', 'gamepad', 'lightbulb',
  // Nature & sky
  'sun', 'moon', 'star', 'cloud', 'flower', 'leaf', 'tree', 'wave', 'fire',
  // Living things
  'dog', 'cat', 'paw', 'bird',
  // Love & celebration
  'heart', 'gift', 'balloon', 'ring', 'crown', 'sparkle', 'champagne', 'clover',
  // Everyday objects
  'key', 'clock', 'diamond', 'envelope', 'coin',
  // Obstacles — things a game asks you to avoid
  'rock', 'puddle', 'bomb', 'cone', 'rain-cloud', 'thorn', 'ice', 'trash',
] as const;

export type GameIcon = (typeof GAME_ICONS)[number];

const ICON_SET = new Set<string>(GAME_ICONS);

export function isGameIcon(value: string | undefined): value is GameIcon {
  return Boolean(value && ICON_SET.has(value));
}

/**
 * Icons that read as "avoid me".
 *
 * The dodging games need obstacles to look hostile at a glance, without the
 * player reading a label — so an engine can ask whether the art it was handed
 * already carries that meaning, and pick a hazard treatment (spikes, a red
 * wash, a warning pulse) when it does.
 */
export const HAZARD_ICONS = new Set<GameIcon>([
  'rock', 'puddle', 'bomb', 'cone', 'rain-cloud', 'thorn', 'ice', 'trash',
]);

/* ------------------------------------------------------------------ *
 * Legacy bridge — emoji to vector
 * ------------------------------------------------------------------ */

/**
 * Best-effort emoji → icon mapping.
 *
 * Greetings published before this vocabulary existed hold configs whose items
 * are emoji only, and those links are already out in the world — someone's
 * birthday page from last month has to keep working, and has to get the new
 * art rather than staying on the old emoji rendering forever. So an emoji is
 * resolved to real vector art wherever we can recognise it, and only genuinely
 * unknown ones fall through to being drawn as the emoji itself.
 */
const EMOJI_TO_ICON: Record<string, GameIcon> = {
  '⚽': 'ball-soccer', '🏀': 'ball-basket', '🎾': 'ball-tennis', '🏆': 'trophy',
  '🥇': 'medal', '🏅': 'medal', '🏋️': 'dumbbell', '🏋': 'dumbbell', '💪': 'dumbbell',
  '🚴': 'bike', '🚲': 'bike', '👟': 'sneaker', '🏄': 'surfboard', '⛷️': 'ski', '🎿': 'ski',
  '☕': 'coffee', '🍵': 'coffee', '🍷': 'wine', '🍺': 'beer', '🍻': 'beer',
  '🍸': 'cocktail', '🍹': 'cocktail', '🍕': 'pizza', '🍔': 'burger', '🎂': 'cake',
  '🍰': 'cake', '🧁': 'cake', '🍦': 'icecream', '🍨': 'icecream', '🥐': 'croissant',
  '🍣': 'sushi', '🍜': 'pan', '🍳': 'pan', '👨‍🍳': 'chef-hat', '👩‍🍳': 'chef-hat',
  '🥑': 'avocado', '🍉': 'watermelon',
  '✈️': 'plane', '✈': 'plane', '🧳': 'suitcase', '🌴': 'palm', '📍': 'map-pin',
  '🧭': 'compass', '📷': 'camera', '📸': 'camera', '⛰️': 'mountain', '🏔️': 'mountain',
  '🗻': 'mountain', '⛺': 'tent', '🏕️': 'tent', '⛵': 'boat', '🚗': 'car', '🌍': 'globe',
  '🌎': 'globe', '🌏': 'globe',
  '🎵': 'music-note', '🎶': 'music-note', '🎸': 'guitar', '🎧': 'headphones',
  '🎤': 'microphone', '🎨': 'palette', '🎬': 'film', '🎟️': 'ticket', '🎫': 'ticket',
  '📚': 'book', '📖': 'book',
  '💻': 'laptop', '📱': 'phone', '🚀': 'rocket', '🪐': 'planet', '🎮': 'gamepad',
  '💡': 'lightbulb',
  '☀️': 'sun', '🌞': 'sun', '🌙': 'moon', '⭐': 'star', '🌟': 'star', '☁️': 'cloud',
  '🌸': 'flower', '🌺': 'flower', '🌻': 'flower', '🌹': 'flower', '🍀': 'clover',
  '🍃': 'leaf', '🌳': 'tree', '🌊': 'wave', '🔥': 'fire',
  '🐕': 'dog', '🐶': 'dog', '🐱': 'cat', '🐈': 'cat', '🐾': 'paw', '🐦': 'bird',
  '❤️': 'heart', '💛': 'heart', '💜': 'heart', '💚': 'heart', '💙': 'heart',
  '🧡': 'heart', '💖': 'heart', '🎁': 'gift', '🎈': 'balloon', '💍': 'ring',
  '👑': 'crown', '✨': 'sparkle', '🥂': 'champagne', '🍾': 'champagne',
  '🔑': 'key', '⏰': 'clock', '⌚': 'clock', '💎': 'diamond', '💌': 'envelope',
  '✉️': 'envelope', '🪙': 'coin', '💰': 'coin', '💵': 'coin',
  '🪨': 'rock', '💣': 'bomb', '🚧': 'cone', '🌧️': 'rain-cloud', '⛈️': 'rain-cloud',
  '🧊': 'ice', '🗑️': 'trash', '🌵': 'thorn',
};

/**
 * The icon to draw for one item.
 *
 * Prefers what the model named. Falls back to the emoji map, then — for an
 * obstacle we can't recognise — to a generic hazard, since drawing an unknown
 * "avoid this" as a friendly star would actively mislead the player.
 */
export function resolveIcon(
  icon: string | undefined,
  emoji: string | undefined,
  good = true
): GameIcon | null {
  if (isGameIcon(icon)) return icon;

  if (emoji) {
    const direct = EMOJI_TO_ICON[emoji];
    if (direct) return direct;
    // Emoji frequently arrive with a variation selector or skin-tone modifier
    // attached; strip the modifiers and try the base character again.
    const base = [...emoji].filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return !(code === 0xfe0f || code === 0x200d || (code >= 0x1f3fb && code <= 0x1f3ff));
    })[0];
    if (base && EMOJI_TO_ICON[base]) return EMOJI_TO_ICON[base];
  }

  // Nothing recognised. An obstacle still needs to look like one.
  return good ? null : 'rock';
}

/* ------------------------------------------------------------------ *
 * Themes — the world a game is played in
 * ------------------------------------------------------------------ */

/**
 * The environments a game can be staged in.
 *
 * Deliberately a small list of *places*, not moods: "stadium" tells the
 * renderer to draw a pitch, floodlights and a crowd, where "energetic" would
 * tell it nothing it could draw. A game set somewhere real is the single
 * biggest difference between this and a page of buttons.
 */
export const GAME_THEMES = [
  'stadium',   // floodlit pitch, crowd, grass
  'space',     // starfield, planets, nebula
  'kitchen',   // counter, tiles, warm light
  'beach',     // sea, sand, palms, sunset
  'city',      // skyline, windows, street
  'travel',    // clouds from a plane window, distant land
  'concert',   // stage, spotlights, crowd silhouettes
  'garden',    // hills, flowers, soft daylight
  'cafe',      // warm interior, window light, plants
  'party',     // dim room, string lights, confetti
  'mountain',  // peaks, pines, cold sky
  'ocean',     // underwater light shafts, bubbles
  'arcade',    // neon grid, dark room, glow
  'sunset',    // wide gradient sky, soft hills — the safe default
] as const;

export type GameTheme = (typeof GAME_THEMES)[number];

const THEME_SET = new Set<string>(GAME_THEMES);

export function isGameTheme(value: string | undefined): value is GameTheme {
  return Boolean(value && THEME_SET.has(value));
}

/**
 * Which theme suits an icon, used to place a game somewhere sensible when the
 * config predates themes (or the model skipped the field). A football game
 * landing in a stadium rather than on a neutral gradient is most of the win.
 */
const ICON_THEME_HINT: Partial<Record<GameIcon, GameTheme>> = {
  'ball-soccer': 'stadium', 'ball-basket': 'stadium', 'ball-tennis': 'stadium',
  trophy: 'stadium', medal: 'stadium', dumbbell: 'stadium', sneaker: 'stadium',
  rocket: 'space', planet: 'space', star: 'space', moon: 'space',
  pan: 'kitchen', 'chef-hat': 'kitchen', pizza: 'kitchen', burger: 'kitchen',
  sushi: 'kitchen', croissant: 'kitchen', avocado: 'kitchen',
  palm: 'beach', surfboard: 'beach', wave: 'ocean', boat: 'ocean',
  watermelon: 'beach', icecream: 'beach',
  plane: 'travel', suitcase: 'travel', compass: 'travel', globe: 'travel',
  'map-pin': 'travel', camera: 'travel',
  guitar: 'concert', microphone: 'concert', 'music-note': 'concert',
  headphones: 'concert',
  flower: 'garden', leaf: 'garden', tree: 'garden', bird: 'garden',
  coffee: 'cafe', book: 'cafe',
  cake: 'party', balloon: 'party', gift: 'party', champagne: 'party',
  wine: 'party', beer: 'party', cocktail: 'party', crown: 'party',
  mountain: 'mountain', tent: 'mountain', ski: 'mountain',
  gamepad: 'arcade', laptop: 'arcade', phone: 'arcade',
};

/**
 * Picks the world a game is staged in.
 *
 * `theme` when the model named one, otherwise a vote among the item icons —
 * whichever world the most objects belong to. Falls back to `sunset`, which is
 * deliberately the prettiest neutral rather than a grey box, because "we knew
 * nothing about you" still has to look like it was made on purpose.
 */
export function resolveTheme(
  theme: string | undefined,
  icons: (GameIcon | null)[]
): GameTheme {
  if (isGameTheme(theme)) return theme;

  const votes = new Map<GameTheme, number>();
  for (const icon of icons) {
    if (!icon) continue;
    const hint = ICON_THEME_HINT[icon];
    if (hint) votes.set(hint, (votes.get(hint) ?? 0) + 1);
  }

  let best: GameTheme = 'sunset';
  let bestCount = 0;
  for (const [candidate, count] of votes) {
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}
