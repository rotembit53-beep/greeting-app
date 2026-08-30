'use client';

import { memo, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { GameTheme } from '@/lib/v2/opening/art';
import { reduceMotion } from '../engines/shared';

gsap.registerPlugin(useGSAP);

/**
 * The world a game is played in.
 *
 * Each theme is a stack of layers at different depths — sky, far, mid, near,
 * ground — that scroll at different speeds. That parallax is doing real work:
 * it is what stops the stage reading as a flat rectangle with objects pasted
 * on, which was the single biggest reason the old games looked like web
 * components rather than games.
 *
 * Every layer is authored as an SVG band drawn twice side by side and
 * translated from 0 to -50%, so the loop is seamless without any seam logic in
 * the engines. Engines pass a `speed` (0 = still) and get a world that moves
 * with their gameplay.
 */

export interface SceneryPalette {
  /** Behind everything — the engines tint their HUD against this. */
  sky: string;
  /** Ground/horizon colour, for engines that place objects on a surface. */
  ground: string;
  /** Ink that stays legible on this sky. */
  ink: string;
  inkSoft: string;
  /** The world's own accent, used for glows and hit effects. */
  accent: string;
}

interface LayerDef {
  /** 0 = pinned to the sky, 1 = moves with the player. */
  depth: number;
  /** Vertical placement as a % of stage height. */
  bottom: number;
  /** Layer height as a % of stage height. */
  height: number;
  opacity?: number;
  /** One tile of the band. Drawn twice for the seamless loop. */
  art: React.ReactNode;
}

interface ThemeDef {
  palette: SceneryPalette;
  /** CSS gradient painted as the backdrop. */
  sky: string;
  layers: LayerDef[];
  /** Drifting atmosphere: stars twinkle, bubbles rise, dust floats. */
  ambient?: 'stars' | 'bubbles' | 'dust' | 'confetti' | 'snow' | 'none';
}

/* Bands are authored in a 100×40 viewBox with `preserveAspectRatio="none"`, so
 * one definition stretches correctly across any stage width. */
const band = (children: React.ReactNode) => (
  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full" aria-hidden="true">
    {children}
  </svg>
);

const THEMES: Record<GameTheme, ThemeDef> = {
  /* ---------------- Stadium ---------------- */
  stadium: {
    palette: { sky: '#0d2a4a', ground: '#2f7d3a', ink: '#f8fafc', inkSoft: '#b6c8dc', accent: '#7bd95c' },
    sky: 'linear-gradient(180deg, #071a30 0%, #10375c 55%, #1b4f74 100%)',
    ambient: 'dust',
    layers: [
      {
        depth: 0.1, bottom: 40, height: 30, opacity: 0.5,
        art: band(
          <>
            {/* Floodlight towers */}
            <g fill="#1c3f63">
              <rect x="9" y="8" width="1.4" height="32" />
              <rect x="4" y="2" width="11" height="7" rx="1.2" />
              <rect x="52" y="6" width="1.4" height="34" />
              <rect x="47" y="0" width="11" height="7" rx="1.2" />
            </g>
            <g fill="#fff8dc" opacity="0.85">
              <circle cx="6.5" cy="5.5" r="1.5" /><circle cx="9.5" cy="5.5" r="1.5" /><circle cx="12.5" cy="5.5" r="1.5" />
              <circle cx="49.5" cy="3.5" r="1.5" /><circle cx="52.5" cy="3.5" r="1.5" /><circle cx="55.5" cy="3.5" r="1.5" />
            </g>
            {/* Light cones */}
            <path d="M9.5 9L2 40h15z" fill="#fff8dc" opacity="0.12" />
            <path d="M52.5 7L44 40h17z" fill="#fff8dc" opacity="0.12" />
          </>
        ),
      },
      {
        depth: 0.35, bottom: 30, height: 22,
        art: band(
          <>
            {/* Crowd stand */}
            <rect x="0" y="18" width="100" height="22" fill="#14243a" />
            <path d="M0 18h100v4H0z" fill="#1d3350" />
            {Array.from({ length: 50 }).map((_, i) => (
              <circle
                key={i}
                cx={1 + i * 2}
                cy={24 + (i % 4) * 3.4}
                r={1.1}
                fill={['#e8b4a0', '#c98d76', '#f0d0b8', '#a86f56'][i % 4]}
                opacity={0.75}
              />
            ))}
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 32,
        art: band(
          <>
            {/* Pitch, with mown stripes running into the distance */}
            <rect x="0" y="0" width="100" height="40" fill="#2f7d3a" />
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={i} x={i * 10} y="0" width="5" height="40" fill="#37913f" opacity="0.55" />
            ))}
            <rect x="0" y="0" width="100" height="1" fill="#eaf7ea" opacity="0.45" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Space ---------------- */
  space: {
    palette: { sky: '#080b24', ground: '#1a1f4a', ink: '#f1f5ff', inkSoft: '#9aa7d4', accent: '#8b7bf0' },
    sky: 'radial-gradient(120% 90% at 70% 15%, #2c2160 0%, #14113a 45%, #06081c 100%)',
    ambient: 'stars',
    layers: [
      {
        depth: 0.12, bottom: 32, height: 46, opacity: 0.75,
        art: band(
          <>
            <ellipse cx="22" cy="16" rx="26" ry="13" fill="#5b3fa8" opacity="0.3" />
            <ellipse cx="74" cy="9" rx="22" ry="10" fill="#3f5fa8" opacity="0.26" />
            <circle cx="80" cy="12" r="6.5" fill="#c1652c" />
            <ellipse cx="80" cy="12" rx="11" ry="2.6" fill="none" stroke="#f5c246" strokeWidth="1" transform="rotate(-16 80 12)" />
            <circle cx="17" cy="20" r="3.4" fill="#7fb2e5" opacity="0.85" />
          </>
        ),
      },
      {
        depth: 0.5, bottom: 6, height: 26, opacity: 0.9,
        art: band(
          <>
            {/* Distant asteroid field */}
            <g fill="#2a2f5e">
              <ellipse cx="12" cy="30" rx="9" ry="4" />
              <ellipse cx="40" cy="34" rx="12" ry="5" />
              <ellipse cx="72" cy="31" rx="10" ry="4.4" />
              <ellipse cx="94" cy="35" rx="8" ry="3.6" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 16,
        art: band(
          <>
            <path d="M0 40V16c8-4 14 2 22 0s12-6 20-4 14 6 22 4 12-6 20-2 16 4 16 4v22z" fill="#1a1f4a" />
            <path d="M0 40V22c10-2 16 2 26 0s16-4 26-2 16 4 26 2 22 2 22 2v16z" fill="#242a5e" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Kitchen ---------------- */
  kitchen: {
    palette: { sky: '#f5ead8', ground: '#c78544', ink: '#3b2412', inkSoft: '#8a6a4f', accent: '#e0503c' },
    sky: 'linear-gradient(180deg, #fdf5e6 0%, #f3e4cc 60%, #e8d3b4 100%)',
    ambient: 'dust',
    layers: [
      {
        // Runs to the top of the world box: a splashback that stops in mid-air
        // with blank wall above it is the single most "unfinished" thing an
        // interior theme can do, and it is what a shorter band left behind on
        // anything taller than a phone.
        depth: 0.15, bottom: 22, height: 78, opacity: 0.55,
        art: band(
          <>
            {/* Tiled splashback, filling the whole band */}
            {Array.from({ length: 6 }).map((_, row) =>
              Array.from({ length: 14 }).map((_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 7.2 + (row % 2 ? 3.6 : 0)}
                  y={row * 6.8 + 0.4}
                  width="6.4"
                  height="6"
                  rx="0.6"
                  fill={row % 2 ? '#ddc8ab' : '#e6d4bb'}
                />
              ))
            )}
          </>
        ),
      },
      {
        depth: 0.4, bottom: 22, height: 26,
        art: band(
          <>
            {/* Hanging pans and a shelf of jars */}
            <rect x="0" y="14" width="100" height="2" fill="#8b5a2b" />
            <g fill="#9aa4b2">
              <circle cx="14" cy="10" r="4.4" /><rect x="18" y="9" width="7" height="1.6" rx="0.8" />
              <circle cx="34" cy="9" r="3.6" /><rect x="37" y="8.2" width="6" height="1.4" rx="0.7" />
              <circle cx="70" cy="10" r="4" /><rect x="73.5" y="9.2" width="6.5" height="1.5" rx="0.75" />
            </g>
            <g>
              <rect x="48" y="6" width="5" height="8" rx="1" fill="#c8a97a" />
              <rect x="55" y="4" width="5" height="10" rx="1" fill="#a8894f" />
              <rect x="86" y="5" width="5" height="9" rx="1" fill="#c8a97a" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 24,
        art: band(
          <>
            <rect x="0" y="6" width="100" height="34" fill="#c78544" />
            <rect x="0" y="6" width="100" height="3" fill="#e0a35e" />
            <rect x="0" y="4" width="100" height="2.4" rx="1" fill="#8b5a2b" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Beach ---------------- */
  beach: {
    palette: { sky: '#ffd9a8', ground: '#f0d9a8', ink: '#3b2412', inkSoft: '#8a6a4f', accent: '#e0503c' },
    sky: 'linear-gradient(180deg, #ffb877 0%, #ffd9a8 40%, #ffeccd 70%, #cfe8f0 100%)',
    ambient: 'dust',
    layers: [
      {
        depth: 0.08, bottom: 46, height: 32, opacity: 0.95,
        art: band(
          <>
            <circle cx="72" cy="26" r="9" fill="#fff1c2" />
            <circle cx="72" cy="26" r="13" fill="#ffd98a" opacity="0.35" />
          </>
        ),
      },
      {
        depth: 0.3, bottom: 30, height: 22,
        art: band(
          <>
            <rect x="0" y="20" width="100" height="20" fill="#3b82c4" />
            <path d="M0 22c10-2 14 2 24 0s16-3 26-1 16 3 26 1 24-2 24-2v-4H0z" fill="#4d9cd4" />
            <g fill="#e0f2fe" opacity="0.55">
              <rect x="8" y="26" width="12" height="0.9" rx="0.45" />
              <rect x="40" y="30" width="16" height="0.9" rx="0.45" />
              <rect x="72" y="27" width="14" height="0.9" rx="0.45" />
            </g>
          </>
        ),
      },
      {
        depth: 0.65, bottom: 18, height: 26, opacity: 0.9,
        art: band(
          <>
            {/* Palm silhouettes */}
            <g fill="#2f6f4f">
              <path d="M16 40V20c-.4-1 1.4-1 1.6 0L18 40z" />
              <path d="M17 20c-5-4-11-3-13 1 4-1 8 0 11 2zM17 20c5-4 11-3 13 1-4-1-8 0-11 2zM17 19c-1-5 1-9 5-10-3 3-4 6-3 9z" />
              <path d="M84 40V22c-.4-1 1.4-1 1.6 0L86 40z" />
              <path d="M85 22c-4-3-9-2-11 1 3-1 7 0 9 2zM85 22c4-3 9-2 11 1-3-1-7 0-9 2z" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 22,
        art: band(
          <>
            <path d="M0 40V10c14-3 24 3 38 1s24-5 38-3 24 3 24 3v29z" fill="#f0d9a8" />
            <path d="M0 40V18c16-2 26 3 40 1s26-4 40-2 20 2 20 2v21z" fill="#e8cb92" opacity="0.7" />
          </>
        ),
      },
    ],
  },

  /* ---------------- City ---------------- */
  city: {
    palette: { sky: '#1b2340', ground: '#2a3050', ink: '#f1f5ff', inkSoft: '#9fabc9', accent: '#f5c246' },
    sky: 'linear-gradient(180deg, #0d1228 0%, #242c50 55%, #45375e 100%)',
    ambient: 'stars',
    layers: [
      {
        depth: 0.15, bottom: 22, height: 44, opacity: 0.6,
        art: band(
          <>
            <g fill="#2a3358">
              <rect x="4" y="14" width="10" height="26" /><rect x="18" y="8" width="8" height="32" />
              <rect x="30" y="18" width="12" height="22" /><rect x="46" y="6" width="9" height="34" />
              <rect x="59" y="16" width="11" height="24" /><rect x="74" y="10" width="8" height="30" />
              <rect x="86" y="20" width="12" height="20" />
            </g>
          </>
        ),
      },
      {
        depth: 0.5, bottom: 12, height: 38,
        art: band(
          <>
            <g fill="#171d38">
              <rect x="0" y="16" width="14" height="24" /><rect x="17" y="8" width="12" height="32" />
              <rect x="32" y="20" width="15" height="20" /><rect x="50" y="4" width="11" height="36" />
              <rect x="64" y="14" width="14" height="26" /><rect x="81" y="18" width="16" height="22" />
            </g>
            {/* Lit windows */}
            <g fill="#f5c246" opacity="0.8">
              {Array.from({ length: 34 }).map((_, i) => (
                <rect
                  key={i}
                  x={2 + (i % 17) * 5.6 + (i % 3)}
                  y={12 + Math.floor(i / 17) * 8 + (i % 4) * 2.4}
                  width="1.8" height="2.4"
                  opacity={i % 3 === 0 ? 0.35 : 0.9}
                />
              ))}
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 16,
        art: band(
          <>
            <rect x="0" y="10" width="100" height="30" fill="#2a3050" />
            <rect x="0" y="10" width="100" height="1.6" fill="#3d4570" />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={i * 8.4 + 2} y="24" width="4.5" height="1.2" rx="0.6" fill="#f5c246" opacity="0.28" />
            ))}
          </>
        ),
      },
    ],
  },

  /* ---------------- Travel (above the clouds) ---------------- */
  travel: {
    palette: { sky: '#bfe0f5', ground: '#f8fafc', ink: '#1f3350', inkSoft: '#5b7391', accent: '#3b82c4' },
    sky: 'linear-gradient(180deg, #5fa8dd 0%, #9fd0ee 45%, #d9eefb 100%)',
    ambient: 'none',
    layers: [
      {
        depth: 0.18, bottom: 40, height: 34, opacity: 0.75,
        art: band(
          <>
            <g fill="#ffffff" opacity="0.8">
              <ellipse cx="16" cy="26" rx="15" ry="6" /><ellipse cx="26" cy="22" rx="10" ry="5" />
              <ellipse cx="62" cy="28" rx="17" ry="6.5" /><ellipse cx="72" cy="24" rx="11" ry="5" />
            </g>
          </>
        ),
      },
      {
        depth: 0.55, bottom: 14, height: 30, opacity: 0.9,
        art: band(
          <>
            <g fill="#ffffff">
              <ellipse cx="10" cy="30" rx="20" ry="9" /><ellipse cx="30" cy="26" rx="14" ry="7" />
              <ellipse cx="55" cy="32" rx="22" ry="9" /><ellipse cx="80" cy="27" rx="17" ry="8" />
              <ellipse cx="97" cy="31" rx="14" ry="7" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 18,
        art: band(
          <>
            <ellipse cx="20" cy="26" rx="30" ry="12" fill="#f8fafc" />
            <ellipse cx="66" cy="30" rx="34" ry="13" fill="#f8fafc" />
            <ellipse cx="44" cy="34" rx="30" ry="12" fill="#eef4fa" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Concert ---------------- */
  concert: {
    palette: { sky: '#160d2c', ground: '#241640', ink: '#f6f1ff', inkSoft: '#a795c9', accent: '#e0503c' },
    sky: 'radial-gradient(100% 70% at 50% 0%, #4a2a6e 0%, #24123f 50%, #0d0620 100%)',
    ambient: 'dust',
    layers: [
      {
        depth: 0.1, bottom: 30, height: 50, opacity: 0.5,
        art: band(
          <>
            {/* Spotlight beams from the rig */}
            <path d="M22 0L6 40h14L28 0z" fill="#e0503c" opacity="0.22" />
            <path d="M50 0L40 40h13L58 0z" fill="#f5c246" opacity="0.2" />
            <path d="M78 0L70 40h14L86 0z" fill="#7fb2e5" opacity="0.2" />
          </>
        ),
      },
      {
        depth: 0.45, bottom: 16, height: 24, opacity: 0.9,
        art: band(
          <>
            <rect x="0" y="30" width="100" height="10" fill="#1a0f30" />
            <g fill="#120a24">
              {Array.from({ length: 26 }).map((_, i) => (
                <g key={i} transform={`translate(${i * 4 - 1}, ${26 + (i % 3)})`}>
                  <circle cx="2" cy="2" r="1.8" />
                  <path d="M0 4h4v10H0z" />
                </g>
              ))}
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 18,
        art: band(
          <>
            <rect x="0" y="8" width="100" height="32" fill="#241640" />
            <rect x="0" y="8" width="100" height="2" fill="#3d2668" />
            <rect x="0" y="6" width="100" height="2.4" fill="#e0503c" opacity="0.55" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Garden ---------------- */
  garden: {
    palette: { sky: '#cdeaf5', ground: '#63a84a', ink: '#25401f', inkSoft: '#5d7a52', accent: '#e05a8a' },
    sky: 'linear-gradient(180deg, #9fd8ef 0%, #cdeaf5 50%, #eaf7ea 100%)',
    ambient: 'dust',
    layers: [
      {
        depth: 0.12, bottom: 40, height: 30, opacity: 0.85,
        art: band(
          <>
            <circle cx="80" cy="12" r="7" fill="#fff3c4" />
            <g fill="#ffffff" opacity="0.85">
              <ellipse cx="20" cy="18" rx="13" ry="5.5" /><ellipse cx="30" cy="15" rx="9" ry="4.4" />
              <ellipse cx="56" cy="22" rx="11" ry="4.6" />
            </g>
          </>
        ),
      },
      {
        depth: 0.45, bottom: 20, height: 28,
        art: band(
          <>
            <path d="M0 40V26c10-6 18 2 28-2s18-8 28-4 18 8 28 4 16-4 16-4v20z" fill="#4f8f3d" opacity="0.85" />
            <g fill="#3f7a32">
              <circle cx="14" cy="24" r="7" /><circle cx="22" cy="27" r="5.4" />
              <circle cx="62" cy="22" r="8" /><circle cx="71" cy="26" r="6" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 24,
        art: band(
          <>
            <rect x="0" y="8" width="100" height="32" fill="#63a84a" />
            <path d="M0 10c12-3 20 2 32 0s22-4 34-2 22 2 34 2v-4H0z" fill="#74b85a" />
            {/* Flowers dotted through the grass */}
            <g>
              {[6, 19, 33, 48, 62, 77, 91].map((x, i) => (
                <g key={x} transform={`translate(${x}, ${16 + (i % 3) * 4})`}>
                  <rect x="-0.3" y="0" width="0.6" height="6" fill="#3f7a32" />
                  <circle cx="0" cy="-0.6" r="1.8" fill={['#e05a8a', '#f5c246', '#f8fafc', '#c77bd0'][i % 4]} />
                  <circle cx="0" cy="-0.6" r="0.7" fill="#f5c246" />
                </g>
              ))}
            </g>
          </>
        ),
      },
    ],
  },

  /* ---------------- Café ---------------- */
  cafe: {
    palette: { sky: '#f0e2cc', ground: '#8b5a2b', ink: '#3b2412', inkSoft: '#8a6a4f', accent: '#c1652c' },
    sky: 'linear-gradient(180deg, #fdf3e2 0%, #f0e2cc 55%, #e2cfae 100%)',
    ambient: 'dust',
    layers: [
      {
        // Full-height wall: panelling above the windows rather than blank space.
        depth: 0.14, bottom: 20, height: 80, opacity: 0.7,
        art: band(
          <>
            <g stroke="#c8a97a" strokeWidth="0.5" opacity="0.55">
              <path d="M0 6h100M0 12h100" />
            </g>
            {/* Windows */}
            <rect x="8" y="16" width="26" height="24" rx="2" fill="#fdfbf4" opacity="0.9" />
            <rect x="8" y="16" width="26" height="24" rx="2" fill="none" stroke="#c8a97a" strokeWidth="1.2" />
            <path d="M21 16v24M8 28h26" stroke="#c8a97a" strokeWidth="1" />
            <rect x="62" y="16" width="26" height="24" rx="2" fill="#fdfbf4" opacity="0.9" />
            <rect x="62" y="16" width="26" height="24" rx="2" fill="none" stroke="#c8a97a" strokeWidth="1.2" />
            <path d="M75 16v24M62 28h26" stroke="#c8a97a" strokeWidth="1" />
          </>
        ),
      },
      {
        depth: 0.42, bottom: 20, height: 24,
        art: band(
          <>
            <rect x="0" y="18" width="100" height="1.8" fill="#8b5a2b" />
            <g fill="#4d9c4d">
              <ellipse cx="46" cy="14" rx="6" ry="4" />
              <path d="M44 16c-2 6-1 10 0 12M48 16c2 5 1 9 0 11" stroke="#4d9c4d" strokeWidth="1.2" fill="none" />
            </g>
            <g fill="#c8a97a">
              <rect x="12" y="12" width="4" height="6" rx="0.8" />
              <rect x="82" y="13" width="4" height="5" rx="0.8" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 22,
        art: band(
          <>
            <rect x="0" y="6" width="100" height="34" fill="#8b5a2b" />
            <rect x="0" y="6" width="100" height="3" fill="#a06a36" />
            {Array.from({ length: 20 }).map((_, i) => (
              <rect key={i} x={i * 5} y="9" width="0.5" height="31" fill="#6b3a20" opacity="0.4" />
            ))}
          </>
        ),
      },
    ],
  },

  /* ---------------- Party ---------------- */
  party: {
    palette: { sky: '#2a1030', ground: '#3d1a44', ink: '#fdf2f8', inkSoft: '#c9a0cf', accent: '#f5c246' },
    sky: 'radial-gradient(110% 80% at 50% 10%, #56215e 0%, #33143a 50%, #1a0820 100%)',
    ambient: 'confetti',
    layers: [
      {
        depth: 0.12, bottom: 42, height: 34,
        art: band(
          <>
            {/* String lights swagging across the room */}
            <path d="M0 6q12 12 25 4t25 4 25-4 25 4" fill="none" stroke="#7a4a80" strokeWidth="0.8" />
            {Array.from({ length: 17 }).map((_, i) => {
              const x = i * 6 + 2;
              const y = 8 + Math.sin(i * 0.85) * 4.5 + 2;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="1.9" fill={['#f5c246', '#f2a0b5', '#a7d8f0', '#b9f0a0'][i % 4]} />
                  <circle cx={x} cy={y} r="4" fill={['#f5c246', '#f2a0b5', '#a7d8f0', '#b9f0a0'][i % 4]} opacity="0.18" />
                </g>
              );
            })}
          </>
        ),
      },
      {
        depth: 0.45, bottom: 16, height: 26, opacity: 0.8,
        art: band(
          <>
            <g fill="#4a1e52">
              <ellipse cx="18" cy="34" rx="12" ry="10" /><ellipse cx="52" cy="36" rx="14" ry="11" />
              <ellipse cx="84" cy="34" rx="12" ry="10" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 18,
        art: band(
          <>
            <rect x="0" y="8" width="100" height="32" fill="#3d1a44" />
            <rect x="0" y="8" width="100" height="2" fill="#5c2a63" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Mountain ---------------- */
  mountain: {
    palette: { sky: '#cfe3f0', ground: '#f4f8fb', ink: '#1f3350', inkSoft: '#5b7391', accent: '#e0503c' },
    sky: 'linear-gradient(180deg, #7fb0d6 0%, #b8d6ea 45%, #e6f1f8 100%)',
    ambient: 'snow',
    layers: [
      {
        depth: 0.14, bottom: 26, height: 42, opacity: 0.55,
        art: band(
          <>
            <path d="M0 40L18 8l14 20 10-12 16 24H0z" fill="#8fabc4" />
            <path d="M52 40L70 10l14 18 16 12z" fill="#8fabc4" />
          </>
        ),
      },
      {
        depth: 0.45, bottom: 12, height: 36,
        art: band(
          <>
            <path d="M0 40L22 6l16 22 12-14 20 26H0z" fill="#5b7a99" />
            <path d="M22 6l6.6 9.2h-13.2zM50 14l4.6 6.4h-9.2z" fill="#f8fafc" />
            <path d="M62 40L82 12l18 28z" fill="#4d6a87" />
            <path d="M82 12l5.4 8.4h-10.8z" fill="#f8fafc" />
          </>
        ),
      },
      {
        depth: 0.8, bottom: 6, height: 22, opacity: 0.95,
        art: band(
          <>
            {/* Pine treeline */}
            <g fill="#254a3a">
              {Array.from({ length: 22 }).map((_, i) => (
                <path key={i} d={`M${i * 4.6 + 1} 40 l2.4-11 2.4 11z`} />
              ))}
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 16,
        art: band(
          <>
            <path d="M0 40V12c14-4 24 2 38 0s26-4 40-2 22 2 22 2v28z" fill="#f4f8fb" />
            <path d="M0 40V20c16-2 26 2 40 0s26-3 40-1 20 1 20 1v20z" fill="#e4eef6" />
          </>
        ),
      },
    ],
  },

  /* ---------------- Ocean (underwater) ---------------- */
  ocean: {
    palette: { sky: '#0d3e5c', ground: '#0a5a70', ink: '#eafaff', inkSoft: '#8fc4d6', accent: '#f5c246' },
    sky: 'linear-gradient(180deg, #1e7fa8 0%, #0f5877 45%, #06334a 100%)',
    ambient: 'bubbles',
    layers: [
      {
        depth: 0.1, bottom: 34, height: 50, opacity: 0.4,
        art: band(
          <>
            {/* Light shafts from the surface */}
            <path d="M14 0L4 40h10L22 0z" fill="#bfeaff" opacity="0.35" />
            <path d="M46 0L38 40h11L54 0z" fill="#bfeaff" opacity="0.3" />
            <path d="M80 0L72 40h12L88 0z" fill="#bfeaff" opacity="0.28" />
          </>
        ),
      },
      {
        depth: 0.5, bottom: 4, height: 30, opacity: 0.8,
        art: band(
          <>
            {/* Kelp */}
            <g stroke="#0f6b52" strokeWidth="1.6" fill="none" strokeLinecap="round">
              <path d="M10 40q-3-10 1-18t-1-12" /><path d="M16 40q3-9-1-16t1-10" />
              <path d="M58 40q-3-11 1-19" /><path d="M64 40q3-10-1-17" />
              <path d="M92 40q-2-9 2-15" />
            </g>
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 14,
        art: band(
          <>
            <path d="M0 40V16c10-4 16 2 26 0s16-4 26-2 16 4 26 2 22-2 22-2v26z" fill="#0a5a70" />
            <g fill="#0d6b82">
              <ellipse cx="20" cy="30" rx="7" ry="3" /><ellipse cx="58" cy="32" rx="9" ry="3.4" />
              <ellipse cx="88" cy="30" rx="6" ry="2.6" />
            </g>
          </>
        ),
      },
    ],
  },

  /* ---------------- Arcade ---------------- */
  arcade: {
    palette: { sky: '#0a0a1e', ground: '#150e35', ink: '#eafaff', inkSoft: '#8fa0d0', accent: '#3ee0d0' },
    sky: 'linear-gradient(180deg, #12082e 0%, #1c0f45 40%, #2b1160 100%)',
    ambient: 'stars',
    layers: [
      {
        depth: 0.1, bottom: 34, height: 40, opacity: 0.55,
        art: band(
          <>
            <circle cx="50" cy="30" r="14" fill="none" stroke="#f0409a" strokeWidth="1" opacity="0.7" />
            <circle cx="50" cy="30" r="20" fill="none" stroke="#3ee0d0" strokeWidth="0.8" opacity="0.5" />
            <circle cx="50" cy="30" r="9" fill="#f0409a" opacity="0.16" />
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 34,
        art: band(
          <>
            {/* Neon perspective grid */}
            <rect x="0" y="0" width="100" height="40" fill="#150e35" />
            <g stroke="#3ee0d0" strokeWidth="0.55" opacity="0.75">
              {Array.from({ length: 15 }).map((_, i) => (
                <path key={i} d={`M${50 + (i - 7) * 4} 0 L${50 + (i - 7) * 22} 40`} />
              ))}
              {[2, 6, 12, 20, 30, 40].map((y) => (
                <path key={y} d={`M0 ${y}h100`} opacity={0.3 + y / 60} />
              ))}
            </g>
          </>
        ),
      },
    ],
  },

  /* ---------------- Sunset (the neutral default) ---------------- */
  sunset: {
    palette: { sky: '#f7d4b0', ground: '#8a5f7d', ink: '#3a2440', inkSoft: '#7d5f80', accent: '#e0503c' },
    sky: 'linear-gradient(180deg, #6a4a86 0%, #c26a86 38%, #f09a6e 68%, #f8d5a8 100%)',
    ambient: 'dust',
    layers: [
      {
        depth: 0.08, bottom: 40, height: 34,
        art: band(
          <>
            <circle cx="50" cy="34" r="13" fill="#ffd08a" />
            <circle cx="50" cy="34" r="19" fill="#ffb877" opacity="0.28" />
          </>
        ),
      },
      {
        depth: 0.35, bottom: 22, height: 26, opacity: 0.75,
        art: band(
          <>
            <path d="M0 40V28c12-6 20 2 32-2s20-6 32-2 20 4 36 2v14z" fill="#9a5a7e" />
          </>
        ),
      },
      {
        depth: 0.7, bottom: 10, height: 24, opacity: 0.9,
        art: band(
          <>
            <path d="M0 40V30c14-8 22 2 36-2s22-8 34-3 18 5 30 3v12z" fill="#6e4068" />
          </>
        ),
      },
      {
        depth: 1, bottom: 0, height: 16,
        art: band(<path d="M0 40V16c16-6 26 4 42 0s26-6 38-2 20 2 20 2v24z" fill="#472a4e" />),
      },
    ],
  },
};

export function themePalette(theme: GameTheme): SceneryPalette {
  return THEMES[theme].palette;
}

export function themeSky(theme: GameTheme): string {
  return THEMES[theme].sky;
}

/* ------------------------------------------------------------------ *
 * Ambient atmosphere
 * ------------------------------------------------------------------ */

/**
 * The drifting particles that sit *behind* gameplay — stars twinkling, bubbles
 * rising, dust catching the light. Purely atmospheric and entirely skipped
 * under reduced motion, so nothing here can ever obscure a game object or
 * compete with the feedback effects that carry meaning.
 */
const Ambient = memo(function Ambient({ kind }: { kind: NonNullable<ThemeDef['ambient']> }) {
  const ref = useRef<HTMLDivElement>(null);

  const count = kind === 'stars' ? 34 : kind === 'confetti' ? 22 : 18;

  const seeds = useRef(
    Array.from({ length: count }, (_, i) => ({
      left: (i * 37) % 100,
      top: (i * 53) % 100,
      size: 1.6 + ((i * 7) % 5) * 0.7,
      delay: ((i * 13) % 40) / 10,
      dur: 3 + ((i * 11) % 30) / 10,
      hue: ['#f5c246', '#f2a0b5', '#a7d8f0', '#b9f0a0'][i % 4],
    }))
  ).current;

  useGSAP(
    () => {
      if (reduceMotion()) return;
      const nodes = gsap.utils.toArray<HTMLElement>('[data-mote]');

      nodes.forEach((node, i) => {
        const seed = seeds[i];
        if (kind === 'stars') {
          gsap.to(node, {
            opacity: 0.15,
            duration: seed.dur,
            delay: seed.delay,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        } else if (kind === 'bubbles') {
          gsap.fromTo(
            node,
            { y: 0, opacity: 0 },
            {
              y: -260,
              opacity: 0.55,
              duration: seed.dur + 3,
              delay: seed.delay,
              repeat: -1,
              ease: 'none',
              onRepeat: () => gsap.set(node, { x: gsap.utils.random(-14, 14) }),
            }
          );
        } else if (kind === 'snow' || kind === 'confetti') {
          gsap.fromTo(
            node,
            { y: -30, opacity: 0.9, rotation: 0 },
            {
              y: 320,
              rotation: kind === 'confetti' ? 420 : 90,
              opacity: 0.25,
              duration: seed.dur + 4,
              delay: seed.delay,
              repeat: -1,
              ease: 'none',
            }
          );
        } else {
          // dust — a slow, barely-there float
          gsap.to(node, {
            y: gsap.utils.random(-24, 24),
            x: gsap.utils.random(-18, 18),
            opacity: 0.5,
            duration: seed.dur + 4,
            delay: seed.delay,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      });
    },
    { scope: ref, dependencies: [kind] }
  );

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {seeds.map((seed, i) => (
        <span
          key={i}
          data-mote
          className="absolute"
          style={{
            left: `${seed.left}%`,
            top: `${seed.top}%`,
            width: kind === 'confetti' ? seed.size * 2.2 : seed.size,
            height: kind === 'confetti' ? seed.size : seed.size,
            borderRadius: kind === 'confetti' ? '1px' : '50%',
            background: kind === 'confetti' ? seed.hue : kind === 'bubbles' ? 'rgba(255,255,255,0.5)' : '#fff',
            opacity: kind === 'stars' ? 0.85 : 0.35,
            boxShadow: kind === 'stars' ? '0 0 4px rgba(255,255,255,0.8)' : undefined,
          }}
        />
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Scenery
 * ------------------------------------------------------------------ */

interface Props {
  theme: GameTheme;
  /**
   * How fast the world travels, in screen-widths per second. 0 holds it still
   * (memory, quiz, timing); the runner-style engines raise it as they speed up.
   */
  speed?: number;
  /** Hides the ambient motes — used when gameplay already fills the stage. */
  quiet?: boolean;
  /**
   * How tall the layer stack is allowed to get, bottom-anchored.
   *
   * Every theme is composed against a stage roughly a phone's shape. Stretched
   * across a full desktop viewport those same percentage bands pull apart and
   * the scene reads as half-drawn — a tiled wall ending in mid-air with a flat
   * slab above it. Capping the world and anchoring it to the floor keeps the
   * composition at its intended proportions and lets the sky gradient own the
   * space above, which is what a backdrop should do anyway.
   */
  worldHeight?: string;
}

/**
 * Renders one theme's full layer stack.
 *
 * Each scrolling band is duplicated side by side and the pair is translated by
 * -50%, which loops seamlessly forever with a single tween per layer. Deeper
 * layers move slower (`depth`), which is the parallax.
 */
const Scenery = memo(function Scenery({
  theme,
  speed = 0,
  quiet = false,
  worldHeight = '100%',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const def = THEMES[theme];
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  /* Rate control, decoupled from tween construction — see the effect below.
   *
   * Keyed on `theme` as well as `speed`: a theme change rebuilds the tweens in
   * their paused state, and without re-running this they would stay parked
   * even though the caller had already asked for movement. */
  useEffect(() => {
    tweensRef.current.forEach((tween) => {
      if (speed <= 0) {
        tween.pause();
        return;
      }
      tween.timeScale(speed);
      if (!tween.isActive()) tween.play();
    });
  }, [speed, theme]);

  useGSAP(
    () => {
      if (reduceMotion()) return;

      const tweens = def.layers.map((layer, i) => {
        const el = ref.current?.querySelector<HTMLElement>(`[data-layer="${i}"] > div`);
        if (!el) return null;
        // A tile pair spans 200% of the stage, so travelling -50% lands the
        // second copy exactly where the first began. Built at a fixed base
        // rate and started paused; `speed` is applied as a time scale below.
        return gsap.fromTo(
          el,
          { xPercent: 0 },
          {
            xPercent: -50,
            duration: 1 / Math.max(0.02, layer.depth),
            ease: 'none',
            repeat: -1,
            paused: true,
          }
        );
      });

      tweensRef.current = tweens.filter((t): t is gsap.core.Tween => Boolean(t));

      return () => {
        tweensRef.current.forEach((t) => t.kill());
        tweensRef.current = [];
      };
    },
    // Deliberately NOT keyed on `speed`. The runner feeds this the difficulty
    // ramp, which ticks several times a second — rebuilding the tweens on each
    // change restarted every layer from xPercent 0, so the whole world snapped
    // back repeatedly and the game read as stuttering. Speed is a time scale on
    // the running tweens instead, which is continuous.
    { scope: ref, dependencies: [theme] }
  );

  return (
    <div
      ref={ref}
      // Pinned to LTR for the whole subtree. The app runs `dir="rtl"`, where a
      // block wider than its parent overflows LEFTWARD and a flex row lays out
      // right-to-left — so each 200%-wide tile pair sat at -100%..100% and the
      // negative scroll below walked it further off, leaving bare strips of
      // undrawn background down the right of every theme. The art is abstract
      // and direction-agnostic, so forcing LTR here costs nothing and makes the
      // loop behave identically whichever way the page reads.
      dir="ltr"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ background: def.sky }}
      aria-hidden="true"
    >
      {/* The world, bottom-anchored. Layer percentages are relative to THIS
        * box, not the viewport, so the scene keeps its proportions whatever
        * shape the screen is. */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: worldHeight }}>
        {def.layers.map((layer, i) => (
          <div
            key={i}
            data-layer={i}
            className="absolute inset-x-0"
            style={{
              bottom: `${layer.bottom}%`,
              height: `${layer.height}%`,
              opacity: layer.opacity ?? 1,
            }}
          >
            {/* Two tiles side by side — the seamless loop. */}
            <div className="flex h-full" style={{ width: '200%' }}>
              <div className="w-1/2 h-full">{layer.art}</div>
              <div className="w-1/2 h-full">{layer.art}</div>
            </div>
          </div>
        ))}
      </div>

      {!quiet && def.ambient && def.ambient !== 'none' && <Ambient kind={def.ambient} />}
    </div>
  );
});

export default Scenery;
