import { useMemo } from 'react';
import {
  GameIcon,
  GameTheme,
  HAZARD_ICONS,
  resolveIcon,
  resolveTheme,
} from '@/lib/v2/opening/art';
import { OpeningConfig } from '@/lib/v2/opening/types';
import { SceneryPalette, themePalette } from './Scenery';

/**
 * Turns one model-authored config into everything an engine needs to draw.
 *
 * Engines never touch `config.items` directly — they take the resolved list
 * from here, which guarantees a config written before the art vocabulary
 * existed (emoji only, no theme) still comes out the other side with real
 * vector art and a real world. Doing that resolution once, here, is also what
 * keeps it out of the render path of a game running at 60fps.
 */

export interface GameItem {
  /** Index in the original config — `sequence-order` compares against this. */
  index: number;
  icon: GameIcon | null;
  emoji: string;
  label: string;
  good: boolean;
  /** True when the art itself reads as "avoid me". */
  hazard: boolean;
}

export interface GameArt {
  theme: GameTheme;
  palette: SceneryPalette;
  items: GameItem[];
  goods: GameItem[];
  bads: GameItem[];
  /** The player's character, for engines that show one. */
  avatar: { icon: GameIcon | null; emoji: string };
  /** What the HUD counts, already defaulted. */
  goalLabel: string;
}

export function useGameArt(config: OpeningConfig): GameArt {
  return useMemo(() => {
    const items: GameItem[] = config.items.map((item, index) => {
      const icon = resolveIcon(item.icon, item.emoji, item.good);
      return {
        index,
        icon,
        emoji: item.emoji,
        label: item.label,
        good: item.good,
        hazard: !item.good || (icon !== null && HAZARD_ICONS.has(icon)),
      };
    });

    const theme = resolveTheme(
      config.theme,
      // Only collectibles vote on the world: a game whose obstacles are rocks
      // should be staged wherever its *rewards* live, not in a quarry.
      items.filter((i) => i.good).map((i) => i.icon)
    );

    const goods = items.filter((i) => i.good);
    const bads = items.filter((i) => !i.good);

    const avatarIcon = resolveIcon(config.avatarIcon, undefined, true);

    return {
      theme,
      palette: themePalette(theme),
      items,
      goods,
      bads,
      avatar: {
        // The named avatar, else the thing they're collecting, else nothing —
        // engines draw a generic runner when there's no icon at all.
        icon: avatarIcon ?? goods[0]?.icon ?? null,
        emoji: goods[0]?.emoji ?? '',
      },
      goalLabel: config.goalLabel || '',
    };
  }, [config]);
}
