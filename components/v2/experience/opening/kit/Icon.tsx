'use client';

import { memo } from 'react';
import { GameIcon, resolveIcon } from '@/lib/v2/opening/art';

/**
 * The game objects, drawn as real vector art.
 *
 * Every icon is authored in a 48×48 box and built from layered shapes — a
 * base, a shade and a highlight — rather than a single flat silhouette. That
 * layering is the whole point: it is what makes a collectible read as an
 * object with weight sitting in a lit world, instead of a glyph pasted onto a
 * background. Emoji, which is what this replaces, can never do that because it
 * carries someone else's rendering and someone else's lighting.
 *
 * Sizing is driven by `size` in px so engines can scale objects with the
 * gameplay (a near-lane collectible is bigger than a far one) without the art
 * going soft.
 */

type Paths = React.ReactNode;

/* Shared tokens, so the whole set is lit from the same direction and reads as
 * one family rather than fifty separate drawings. */
const SHADE = 'rgba(0,0,0,0.18)';
const GLINT = 'rgba(255,255,255,0.55)';

/** A soft top-left highlight, the family's signature lighting cue. */
const Glint = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.72} fill={GLINT} opacity={0.5} />
);

const ICONS: Record<GameIcon, Paths> = {
  /* ---------------- Sport & movement ---------------- */
  'ball-soccer': (
    <>
      <circle cx="24" cy="24" r="18" fill="#fdfdfd" />
      <circle cx="24" cy="24" r="18" fill={SHADE} opacity={0.12} />
      <path d="M24 12l6.5 4.7-2.5 7.6h-8l-2.5-7.6z" fill="#1f2937" />
      <path d="M13 26l6 1.5 2.5 7.2-4.6 3.4-5.4-5z" fill="#1f2937" opacity={0.9} />
      <path d="M35 26l-6 1.5-2.5 7.2 4.6 3.4 5.4-5z" fill="#1f2937" opacity={0.9} />
      <circle cx="24" cy="24" r="18" fill="none" stroke="#111827" strokeOpacity={0.25} strokeWidth="1.5" />
      <Glint cx={18} cy={16} r={4.5} />
    </>
  ),
  'ball-basket': (
    <>
      <circle cx="24" cy="24" r="18" fill="#e8843a" />
      <path d="M24 6v36M6 24h36" stroke="#7c2d12" strokeWidth="1.8" fill="none" />
      <path d="M11 11c8 6 8 20 0 26M37 11c-8 6-8 20 0 26" stroke="#7c2d12" strokeWidth="1.8" fill="none" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="#7c2d12" strokeOpacity={0.5} strokeWidth="1.5" />
      <Glint cx={17} cy={15} r={4} />
    </>
  ),
  'ball-tennis': (
    <>
      <circle cx="24" cy="24" r="17" fill="#d9f34a" />
      <path d="M9 16c7 3 10 10 9 19M39 16c-7 3-10 10-9 19" stroke="#fff" strokeWidth="2.4" fill="none" />
      <circle cx="24" cy="24" r="17" fill={SHADE} opacity={0.1} />
      <Glint cx={18} cy={16} r={4} />
    </>
  ),
  trophy: (
    <>
      <path d="M15 8h18v11a9 9 0 01-18 0z" fill="#f5c246" />
      <path d="M24 8h9v11a9 9 0 01-9 9z" fill={SHADE} />
      <path d="M15 11H10a5 5 0 005 6zM33 11h5a5 5 0 01-5 6z" fill="#d9a021" />
      <rect x="21" y="27" width="6" height="7" fill="#d9a021" />
      <rect x="15" y="34" width="18" height="5" rx="1.6" fill="#b8860f" />
      <Glint cx={19} cy={13} r={3} />
    </>
  ),
  medal: (
    <>
      <path d="M17 6l4 13h6L23 6z" fill="#e05a5a" />
      <path d="M31 6l-4 13h-6l4-13z" fill="#4a7fd4" />
      <circle cx="24" cy="30" r="12" fill="#f5c246" />
      <circle cx="24" cy="30" r="8" fill="#d9a021" />
      <path d="M24 25l1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" fill="#fff8dc" />
    </>
  ),
  dumbbell: (
    <>
      <rect x="18" y="21" width="12" height="6" rx="1" fill="#9aa4b2" />
      <rect x="10" y="16" width="7" height="16" rx="2.5" fill="#4b5563" />
      <rect x="31" y="16" width="7" height="16" rx="2.5" fill="#4b5563" />
      <rect x="5" y="19" width="5" height="10" rx="2" fill="#374151" />
      <rect x="38" y="19" width="5" height="10" rx="2" fill="#374151" />
      <rect x="10" y="16" width="7" height="5" rx="2.5" fill={GLINT} opacity={0.3} />
    </>
  ),
  bike: (
    <>
      <circle cx="13" cy="31" r="9" fill="none" stroke="#374151" strokeWidth="2.6" />
      <circle cx="35" cy="31" r="9" fill="none" stroke="#374151" strokeWidth="2.6" />
      <path d="M13 31l8-13h7l6 13M21 18h8" stroke="#e05a5a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M20 31h9" stroke="#e05a5a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="13" cy="31" r="2" fill="#6b7280" />
      <circle cx="35" cy="31" r="2" fill="#6b7280" />
    </>
  ),
  sneaker: (
    <>
      <path d="M7 30c0-5 3-9 8-11l4 4 4-4 5 3 10 5c3 1.4 4 3.2 4 5v3H7z" fill="#f1f5f9" />
      <path d="M7 33h35v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" fill="#e05a5a" />
      <path d="M15 19l4 4 4-4" stroke="#94a3b8" strokeWidth="1.8" fill="none" />
      <path d="M26 24l3 4M31 27l3 3" stroke="#94a3b8" strokeWidth="1.6" fill="none" />
    </>
  ),
  surfboard: (
    <>
      <ellipse cx="24" cy="24" rx="8" ry="19" fill="#fef3c7" transform="rotate(24 24 24)" />
      <path d="M17 8c6 8 8 22 5 32" stroke="#f59e0b" strokeWidth="2.6" fill="none" transform="rotate(24 24 24)" />
      <ellipse cx="24" cy="24" rx="8" ry="19" fill="none" stroke="#d97706" strokeWidth="1.6" transform="rotate(24 24 24)" />
    </>
  ),
  ski: (
    <>
      <path d="M11 38l16-30M21 40l16-30" stroke="#e05a5a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M9 39c2 2 5 2 6 0M19 41c2 2 5 2 6 0" stroke="#b91c1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M31 10l4 26" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),

  /* ---------------- Food & drink ---------------- */
  coffee: (
    <>
      <path d="M10 16h24v13a10 10 0 01-10 10h-4a10 10 0 01-10-10z" fill="#f8fafc" />
      <path d="M24 16h10v13a10 10 0 01-10 10z" fill={SHADE} opacity={0.55} />
      <path d="M34 20h3a5 5 0 010 10h-3" fill="none" stroke="#cbd5e1" strokeWidth="2.6" />
      <path d="M12 18h20v5a10 10 0 01-20 0z" fill="#7b4a2d" />
      <path d="M16 10c0-2 2-2 2-4M23 10c0-2 2-2 2-4M30 10c0-2 2-2 2-4" stroke="#cbd5e1" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.85} />
    </>
  ),
  wine: (
    <>
      <path d="M16 7h16l-1.5 11a6.5 6.5 0 01-13 0z" fill="#7f1d3a" />
      <path d="M24 7h8l-1.5 11a6.5 6.5 0 01-6.5 5.6z" fill={SHADE} opacity={0.4} />
      <path d="M16 7h16l-.5 4H16.5z" fill="#a8324f" />
      <rect x="22.6" y="24" width="2.8" height="12" fill="#e2e8f0" />
      <rect x="16" y="36" width="16" height="3.4" rx="1.7" fill="#cbd5e1" />
      <Glint cx={19.5} cy={12} r={2.2} />
    </>
  ),
  beer: (
    <>
      <path d="M12 15h20v22a4 4 0 01-4 4H16a4 4 0 01-4-4z" fill="#f5b426" />
      <path d="M24 15h8v22a4 4 0 01-4 4h-4z" fill={SHADE} opacity={0.35} />
      <path d="M32 20h4a4 4 0 010 8h-4" fill="none" stroke="#e2e8f0" strokeWidth="2.6" />
      <path d="M12 15c2-5 6-6 8-3 2-4 8-4 10 0 3-1 4 1 2 3z" fill="#fefce8" />
      <Glint cx={16.5} cy={22} r={2} />
    </>
  ),
  cocktail: (
    <>
      <path d="M9 11h30L26 27v10h6v3H16v-3h6V27z" fill="#e2e8f0" />
      <path d="M13 15h22l-9 11h-4z" fill="#f97362" />
      <circle cx="31" cy="12" r="3.4" fill="#84cc16" />
      <path d="M31 9v-4" stroke="#65a30d" strokeWidth="1.6" />
    </>
  ),
  pizza: (
    <>
      <path d="M24 5l17 33a2 2 0 01-2.4 2.8 46 46 0 01-29.2 0A2 2 0 017 38z" fill="#f2c14e" />
      <path d="M24 10l14 27a41 41 0 01-28 0z" fill="#e8654a" />
      <circle cx="20" cy="24" r="3" fill="#b91c1c" />
      <circle cx="29" cy="29" r="3" fill="#b91c1c" />
      <circle cx="22" cy="34" r="2.6" fill="#b91c1c" />
      <circle cx="25" cy="18" r="1.8" fill="#fde68a" />
    </>
  ),
  burger: (
    <>
      <path d="M8 18a16 9 0 0132 0z" fill="#e0a35e" />
      <rect x="8" y="18" width="32" height="4" rx="2" fill="#84cc16" />
      <rect x="8" y="22" width="32" height="5" rx="2" fill="#8b4a2b" />
      <rect x="8" y="27" width="32" height="4" rx="2" fill="#fbbf24" />
      <path d="M8 31h32a0 0 0 010 0 8 8 0 01-8 8H16a8 8 0 01-8-8z" fill="#d08b45" />
      <circle cx="17" cy="15" r="1.1" fill="#fef3c7" />
      <circle cx="24" cy="13" r="1.1" fill="#fef3c7" />
      <circle cx="31" cy="15" r="1.1" fill="#fef3c7" />
    </>
  ),
  cake: (
    <>
      <path d="M9 24h30v13a3 3 0 01-3 3H12a3 3 0 01-3-3z" fill="#f2a0b5" />
      <path d="M9 30c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 6-3v-6H9z" fill="#fdf2f8" />
      <rect x="22.6" y="12" width="2.8" height="12" fill="#fbbf24" />
      <path d="M24 6c2.5 3 3 4.4 3 5.6a3 3 0 01-6 0c0-1.2.5-2.6 3-5.6z" fill="#fb923c" />
      <circle cx="15" cy="35" r="1.4" fill="#fdf2f8" opacity={0.8} />
      <circle cx="33" cy="35" r="1.4" fill="#fdf2f8" opacity={0.8} />
    </>
  ),
  icecream: (
    <>
      <path d="M17 22h14l-5.4 17a1.7 1.7 0 01-3.2 0z" fill="#e0a35e" />
      <path d="M17 22h14l-1 3H18z" fill="#c78544" />
      <circle cx="19.5" cy="18" r="7" fill="#f9a8c4" />
      <circle cx="28.5" cy="18" r="7" fill="#fde68a" />
      <circle cx="24" cy="12" r="7" fill="#a7d8f0" />
      <Glint cx={21} cy={9} r={2.4} />
    </>
  ),
  croissant: (
    <>
      <path d="M7 30c2-11 11-18 17-18s15 7 17 18c-4-3-8-2-10 1-3-4-8-4-10 0-3-4-7-4-10 0-2-3-6-4-4-1z" fill="#e0a35e" />
      <path d="M14 26c2-5 5-8 10-8s8 3 10 8" stroke="#c78544" strokeWidth="1.8" fill="none" />
      <Glint cx={20} cy={19} r={3} />
    </>
  ),
  sushi: (
    <>
      <rect x="10" y="16" width="28" height="18" rx="4" fill="#fdfdfd" />
      <rect x="19" y="16" width="10" height="18" fill="#1f2937" />
      <circle cx="24" cy="25" r="5" fill="#f97362" />
      <circle cx="24" cy="25" r="5" fill="none" stroke="#e0503c" strokeWidth="1.2" />
      <circle cx="15" cy="22" r="1" fill="#e2e8f0" />
      <circle cx="34" cy="28" r="1" fill="#e2e8f0" />
    </>
  ),
  pan: (
    <>
      <ellipse cx="21" cy="26" rx="15" ry="11" fill="#374151" />
      <ellipse cx="21" cy="24.5" rx="12" ry="8.5" fill="#4b5563" />
      <path d="M35 24h9a2.5 2.5 0 010 5h-9" fill="#1f2937" />
      <ellipse cx="19" cy="23" rx="4.5" ry="3.2" fill="#fbbf24" />
      <ellipse cx="19" cy="23" rx="2" ry="1.4" fill="#f97316" />
      <Glint cx={15} cy={20} r={2.6} />
    </>
  ),
  'chef-hat': (
    <>
      <path d="M12 22a8 8 0 01.6-14.6A8 8 0 0124 5a8 8 0 0111.4 2.4A8 8 0 0136 22z" fill="#fdfdfd" />
      <rect x="13" y="22" width="22" height="10" rx="2" fill="#f1f5f9" />
      <path d="M17 22v10M24 22v10M31 22v10" stroke="#cbd5e1" strokeWidth="1.4" />
      <Glint cx={17} cy={12} r={3} />
    </>
  ),
  avocado: (
    <>
      <path d="M24 6c8 0 14 8 14 17 0 10-6 19-14 19s-14-9-14-19c0-9 6-17 14-17z" fill="#4d7c0f" />
      <path d="M24 11c6 0 10 6 10 13s-4 14-10 14-10-7-10-14 4-13 10-13z" fill="#a3d94a" />
      <ellipse cx="24" cy="26" rx="6" ry="7" fill="#8b5a2b" />
      <Glint cx={20} cy={19} r={2.4} />
    </>
  ),
  watermelon: (
    <>
      <path d="M6 34a18 18 0 0136 0z" fill="#f97362" />
      <path d="M6 34a18 18 0 01.6-4.6h34.8A18 18 0 0142 34z" fill="#fdfdfd" opacity={0.9} />
      <path d="M4 34h40a2 2 0 01-2 2H6a2 2 0 01-2-2z" fill="#4d7c0f" />
      <ellipse cx="18" cy="27" rx="1.3" ry="1.8" fill="#1f2937" />
      <ellipse cx="24" cy="24" rx="1.3" ry="1.8" fill="#1f2937" />
      <ellipse cx="30" cy="27" rx="1.3" ry="1.8" fill="#1f2937" />
    </>
  ),

  /* ---------------- Travel & place ---------------- */
  plane: (
    <>
      <path d="M43 22.5c0 1.6-1.2 2.9-2.7 3l-9.6.8-6.3 12.4a1.6 1.6 0 01-1.5.9h-2.6l3.2-12.8-8.1.7-3 4.4a1.4 1.4 0 01-1.2.6H8.6l2.2-9.9-2.2-9.9h2.6c.5 0 1 .2 1.2.6l3 4.4 8.1.7L20.3 5h2.6c.6 0 1.2.3 1.5.9l6.3 12.4 9.6.8c1.5.1 2.7 1.4 2.7 3z" fill="#e2e8f0" />
      <path d="M43 22.5c0 1.6-1.2 2.9-2.7 3l-9.6.8-6.3 12.4a1.6 1.6 0 01-1.5.9h-2.6l3.2-12.8" fill={SHADE} opacity={0.35} />
      <circle cx="35" cy="22.5" r="1.5" fill="#7fb2e5" />
    </>
  ),
  suitcase: (
    <>
      <path d="M18 12V9a3 3 0 013-3h6a3 3 0 013 3v3" fill="none" stroke="#6b7280" strokeWidth="2.6" />
      <rect x="7" y="12" width="34" height="26" rx="4" fill="#8b4a2b" />
      <rect x="7" y="12" width="34" height="26" rx="4" fill="none" stroke="#6b3a20" strokeWidth="1.4" />
      <rect x="7" y="21" width="34" height="4" fill="#c78544" />
      <rect x="21" y="19" width="6" height="8" rx="1.4" fill="#f5c246" />
      <Glint cx={14} cy={17} r={2.6} />
    </>
  ),
  palm: (
    <>
      <path d="M22 20c1 7 1 14 0 21h5c-1-7-1-14-1-21z" fill="#8b5a2b" />
      <path d="M24 18C18 12 10 12 6 17c6-2 11 0 14 4zM24 18c6-6 14-6 18-1-6-2-11 0-14 4zM24 18c-2-7 1-13 7-14-4 3-5 8-4 12zM24 18c2-6-2-12-8-13 4 4 5 8 4 12z" fill="#3f8f3f" />
      <circle cx="24" cy="19" r="2.6" fill="#8b5a2b" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M24 4c8 0 14 6 14 14 0 10-14 26-14 26S10 28 10 18c0-8 6-14 14-14z" fill="#e0503c" />
      <path d="M24 4c8 0 14 6 14 14 0 10-14 26-14 26z" fill={SHADE} opacity={0.28} />
      <circle cx="24" cy="18" r="5.5" fill="#fdfdfd" />
      <Glint cx={19} cy={12} r={2.6} />
    </>
  ),
  compass: (
    <>
      <circle cx="24" cy="24" r="19" fill="#e2e8f0" />
      <circle cx="24" cy="24" r="15" fill="#3b5f8f" />
      <path d="M31 17l-4.5 10.5L16 32l4.5-10.5z" fill="#e0503c" />
      <path d="M31 17l-4.5 10.5L24 24z" fill="#fdfdfd" />
      <circle cx="24" cy="24" r="1.8" fill="#e2e8f0" />
    </>
  ),
  camera: (
    <>
      <path d="M18 10h12l2.5 4H40a4 4 0 014 4v16a4 4 0 01-4 4H8a4 4 0 01-4-4V18a4 4 0 014-4h7.5z" fill="#374151" />
      <circle cx="24" cy="26" r="9" fill="#1f2937" />
      <circle cx="24" cy="26" r="6.5" fill="#3b5f8f" />
      <circle cx="24" cy="26" r="3" fill="#0f172a" />
      <circle cx="21.5" cy="23.5" r="1.8" fill={GLINT} opacity={0.7} />
      <rect x="35" y="17" width="4" height="2.6" rx="1.3" fill="#f5c246" />
    </>
  ),
  mountain: (
    <>
      <path d="M2 40L18 12l10 16 5-7 13 19z" fill="#5b7a99" />
      <path d="M18 12l10 16H8z" fill="#7593b0" />
      <path d="M18 12l5.4 8.6h-10.8zM33 21l3.4 5h-6.8z" fill="#f8fafc" />
    </>
  ),
  tent: (
    <>
      <path d="M24 8L42 38H6z" fill="#e0503c" />
      <path d="M24 8L42 38H24z" fill={SHADE} opacity={0.28} />
      <path d="M24 16l8 22h-16z" fill="#1f2937" />
      <path d="M24 16v22" stroke="#374151" strokeWidth="1.4" />
      <rect x="4" y="37" width="40" height="3" rx="1.5" fill="#6b7280" />
    </>
  ),
  boat: (
    <>
      <path d="M23 6l14 22H23z" fill="#fdfdfd" />
      <path d="M21 12L11 28h10z" fill="#e2e8f0" />
      <path d="M5 30h38l-4.5 8a3 3 0 01-2.7 1.7H12.2A3 3 0 019.5 38z" fill="#8b4a2b" />
      <rect x="22" y="4" width="1.8" height="26" fill="#6b7280" />
    </>
  ),
  car: (
    <>
      <path d="M7 30l3.5-9A5 5 0 0115.2 18h17.6a5 5 0 014.7 3l3.5 9z" fill="#e0503c" />
      <rect x="5" y="29" width="38" height="8" rx="3" fill="#c23b2c" />
      <path d="M14 21h20l2 6H12z" fill="#a7d8f0" />
      <circle cx="14" cy="37" r="4.2" fill="#1f2937" />
      <circle cx="34" cy="37" r="4.2" fill="#1f2937" />
      <circle cx="14" cy="37" r="1.7" fill="#9aa4b2" />
      <circle cx="34" cy="37" r="1.7" fill="#9aa4b2" />
    </>
  ),
  globe: (
    <>
      <circle cx="24" cy="24" r="18" fill="#3b82c4" />
      <path d="M13 14c5 2 4 6 8 7s5-3 9-2 4 5 2 8-8 2-9 6 2 6 0 8c-6-1-11-7-12-14s0-11 2-13z" fill="#4d9c4d" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="#1e5f8f" strokeOpacity={0.4} strokeWidth="1.4" />
      <Glint cx={17} cy={15} r={4} />
    </>
  ),

  /* ---------------- Music, art & screen ---------------- */
  'music-note': (
    <>
      <path d="M20 34V11l18-4v20" fill="none" stroke="#4c3d8f" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="15" cy="34" rx="6.5" ry="5.2" fill="#6d5bd0" transform="rotate(-18 15 34)" />
      <ellipse cx="33" cy="30" rx="6" ry="4.8" fill="#6d5bd0" transform="rotate(-18 33 30)" />
      <path d="M20 15l18-4" stroke="#4c3d8f" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  guitar: (
    <>
      <path d="M17 44c-6 0-10-4-10-9 0-4 3-6 3-10s-3-5-3-9c0-4 4-7 9-7 6 0 9 4 9 9 0 6-2 8-2 12s2 6 2 9c0 3-3 5-8 5z" fill="#c1652c" transform="rotate(-30 20 27)" />
      <path d="M27 22l12-13" stroke="#8b4a2b" strokeWidth="4" strokeLinecap="round" />
      <rect x="36" y="4" width="7" height="7" rx="1.6" fill="#6b3a20" transform="rotate(45 39.5 7.5)" />
      <circle cx="17" cy="28" r="4.4" fill="#3b2412" />
      <path d="M26 23l-10 10" stroke="#fde68a" strokeWidth="1" opacity={0.7} />
    </>
  ),
  headphones: (
    <>
      <path d="M9 30v-6a15 15 0 0130 0v6" fill="none" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      <rect x="4" y="26" width="9" height="15" rx="4" fill="#e0503c" />
      <rect x="35" y="26" width="9" height="15" rx="4" fill="#e0503c" />
      <rect x="6" y="28" width="5" height="6" rx="2.5" fill={GLINT} opacity={0.3} />
    </>
  ),
  microphone: (
    <>
      <rect x="18" y="4" width="12" height="22" rx="6" fill="#4b5563" />
      <rect x="18" y="4" width="12" height="22" rx="6" fill="none" stroke="#374151" strokeWidth="1.4" />
      <path d="M20 9h8M20 13h8M20 17h8" stroke="#6b7280" strokeWidth="1.2" />
      <path d="M12 23a12 12 0 0024 0" fill="none" stroke="#9aa4b2" strokeWidth="2.8" strokeLinecap="round" />
      <rect x="22.6" y="34" width="2.8" height="8" fill="#9aa4b2" />
      <rect x="17" y="41" width="14" height="3" rx="1.5" fill="#6b7280" />
    </>
  ),
  palette: (
    <>
      <path d="M24 6c11 0 19 7 19 16 0 6-5 8-9 8h-3c-3 0-5 2-5 4 0 3 2 3 2 5 0 2-2 3-4 3C13 42 5 34 5 23S13 6 24 6z" fill="#f1e4c8" />
      <circle cx="15" cy="18" r="3.4" fill="#e0503c" />
      <circle cx="24" cy="14" r="3.4" fill="#f5c246" />
      <circle cx="33" cy="18" r="3.4" fill="#4d9c4d" />
      <circle cx="14" cy="29" r="3.4" fill="#3b82c4" />
    </>
  ),
  film: (
    <>
      <rect x="6" y="10" width="36" height="28" rx="3" fill="#1f2937" />
      <rect x="13" y="15" width="22" height="18" rx="1.6" fill="#4b5563" />
      <g fill="#f1f5f9">
        <rect x="8.5" y="13" width="3" height="3" rx="0.8" />
        <rect x="8.5" y="19" width="3" height="3" rx="0.8" />
        <rect x="8.5" y="25" width="3" height="3" rx="0.8" />
        <rect x="8.5" y="31" width="3" height="3" rx="0.8" />
        <rect x="36.5" y="13" width="3" height="3" rx="0.8" />
        <rect x="36.5" y="19" width="3" height="3" rx="0.8" />
        <rect x="36.5" y="25" width="3" height="3" rx="0.8" />
        <rect x="36.5" y="31" width="3" height="3" rx="0.8" />
      </g>
    </>
  ),
  ticket: (
    <>
      <path d="M5 14h38v8a4 4 0 000 8v8H5v-8a4 4 0 000-8z" fill="#f5c246" />
      <path d="M24 14v24" stroke="#d9a021" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="14" cy="26" r="3.4" fill="#d9a021" opacity={0.5} />
      <rect x="30" y="22" width="9" height="2" rx="1" fill="#d9a021" />
      <rect x="30" y="27" width="6" height="2" rx="1" fill="#d9a021" />
    </>
  ),
  book: (
    <>
      <path d="M8 8h13c2.6 0 3 1.5 3 3v29c0-1.5-1-2.5-3-2.5H8z" fill="#c23b2c" />
      <path d="M40 8H27c-2.6 0-3 1.5-3 3v29c0-1.5 1-2.5 3-2.5h13z" fill="#e0503c" />
      <path d="M8 8h13c2.6 0 3 1.5 3 3v3H8z" fill={SHADE} opacity={0.25} />
      <path d="M28 19h9M28 24h9M28 29h6" stroke="#fdfdfd" strokeWidth="1.4" opacity={0.6} />
    </>
  ),

  /* ---------------- Tech & play ---------------- */
  laptop: (
    <>
      <path d="M10 10h28a2 2 0 012 2v20H8V12a2 2 0 012-2z" fill="#4b5563" />
      <rect x="11" y="13" width="26" height="16" rx="1.4" fill="#7fb2e5" />
      <path d="M3 32h42l-2.6 5a2 2 0 01-1.8 1.1H7.4A2 2 0 015.6 37z" fill="#9aa4b2" />
      <rect x="20" y="33.5" width="8" height="1.6" rx="0.8" fill="#6b7280" />
      <path d="M11 13h26v4H11z" fill={GLINT} opacity={0.22} />
    </>
  ),
  phone: (
    <>
      <rect x="13" y="4" width="22" height="40" rx="4.5" fill="#374151" />
      <rect x="15.5" y="9" width="17" height="28" rx="1.6" fill="#7fb2e5" />
      <rect x="21" y="6" width="6" height="1.6" rx="0.8" fill="#6b7280" />
      <circle cx="24" cy="40.5" r="1.8" fill="#6b7280" />
      <path d="M15.5 9h17v7h-17z" fill={GLINT} opacity={0.22} />
    </>
  ),
  rocket: (
    <>
      <path d="M24 3c6 5 9 13 9 21v7H15v-7c0-8 3-16 9-21z" fill="#f1f5f9" />
      <path d="M24 3c6 5 9 13 9 21v7h-9z" fill={SHADE} opacity={0.3} />
      <circle cx="24" cy="18" r="4.6" fill="#3b82c4" />
      <circle cx="24" cy="18" r="4.6" fill="none" stroke="#1e5f8f" strokeWidth="1.2" />
      <path d="M15 24l-6 8 6-1zM33 24l6 8-6-1z" fill="#e0503c" />
      <path d="M20 31h8l-2 7-2 4-2-4z" fill="#f5c246" />
      <path d="M22 34h4l-1 5-1 2-1-2z" fill="#e0503c" />
    </>
  ),
  planet: (
    <>
      <circle cx="24" cy="22" r="13" fill="#c1652c" />
      <path d="M14 16c5 1 12 1 17-1M13 26c6 2 14 2 20-1" stroke="#8b4a2b" strokeWidth="1.8" fill="none" opacity={0.7} />
      <ellipse cx="24" cy="24" rx="22" ry="6" fill="none" stroke="#f5c246" strokeWidth="3" transform="rotate(-18 24 24)" />
      <Glint cx={18} cy={15} r={3} />
    </>
  ),
  gamepad: (
    <>
      <path d="M14 14h20c6 0 10 5 11 11l1.5 8c.6 3.4-1.6 5.6-4.4 5.6-2.4 0-3.8-1.6-5.4-3.6l-2-2.6H13.3l-2 2.6C9.7 37 8.3 38.6 5.9 38.6 3.1 38.6.9 36.4 1.5 33l1.5-8C4 19 8 14 14 14z" fill="#4b5563" />
      <rect x="10.5" y="22" width="3" height="9" rx="1.5" fill="#e2e8f0" />
      <rect x="7.5" y="25" width="9" height="3" rx="1.5" fill="#e2e8f0" />
      <circle cx="33" cy="23.5" r="2.4" fill="#e0503c" />
      <circle cx="38" cy="28" r="2.4" fill="#4d9c4d" />
      <circle cx="33" cy="32" r="2.4" fill="#f5c246" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M24 5c8 0 13 6 13 13 0 6-4 9-5 13H16c-1-4-5-7-5-13C11 11 16 5 24 5z" fill="#f5c246" />
      <path d="M24 5c8 0 13 6 13 13 0 6-4 9-5 13h-8z" fill={SHADE} opacity={0.22} />
      <rect x="17" y="32" width="14" height="3.4" rx="1.7" fill="#9aa4b2" />
      <rect x="18.5" y="36" width="11" height="3" rx="1.5" fill="#6b7280" />
      <path d="M20 40h8" stroke="#4b5563" strokeWidth="2.4" strokeLinecap="round" />
      <Glint cx={19} cy={13} r={3.2} />
    </>
  ),

  /* ---------------- Nature & sky ---------------- */
  sun: (
    <>
      <circle cx="24" cy="24" r="11" fill="#f5c246" />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#f59e0b" strokeWidth="1.4" />
      <g stroke="#f5c246" strokeWidth="3.4" strokeLinecap="round">
        <path d="M24 3v6M24 39v6M3 24h6M39 24h6M9 9l4.2 4.2M34.8 34.8L39 39M39 9l-4.2 4.2M13.2 34.8L9 39" />
      </g>
      <Glint cx={20} cy={20} r={3} />
    </>
  ),
  moon: (
    <>
      <path d="M30 4a20 20 0 100 40 16 16 0 010-40z" fill="#f1e4c8" />
      <circle cx="26" cy="16" r="2.6" fill="#d6c7a8" />
      <circle cx="33" cy="27" r="3.4" fill="#d6c7a8" />
      <circle cx="24" cy="33" r="2" fill="#d6c7a8" />
    </>
  ),
  star: (
    <>
      <path d="M24 3l6.2 12.9 14.1 1.9-10.3 9.8 2.6 14L24 35l-12.6 6.6 2.6-14L3.7 17.8l14.1-1.9z" fill="#f5c246" />
      <path d="M24 3l6.2 12.9 14.1 1.9-10.3 9.8 2.6 14L24 35z" fill={SHADE} opacity={0.18} />
      <Glint cx={19} cy={15} r={2.6} />
    </>
  ),
  cloud: (
    <>
      <path d="M13 34a9 9 0 01-.6-18 12 12 0 0122.4-2A8 8 0 0136 34z" fill="#f8fafc" />
      <path d="M24 34h12a8 8 0 001-16 12 12 0 00-2.2-4z" fill="#dbe4ee" />
    </>
  ),
  flower: (
    <>
      <path d="M24 22c0-8 3-12 0-16-3 4 0 8 0 16zM24 22c0-8-3-12 0-16" fill="#f2a0b5" />
      <g fill="#f2a0b5">
        <ellipse cx="24" cy="12" rx="5" ry="8" />
        <ellipse cx="24" cy="12" rx="5" ry="8" transform="rotate(72 24 20)" />
        <ellipse cx="24" cy="12" rx="5" ry="8" transform="rotate(144 24 20)" />
        <ellipse cx="24" cy="12" rx="5" ry="8" transform="rotate(216 24 20)" />
        <ellipse cx="24" cy="12" rx="5" ry="8" transform="rotate(288 24 20)" />
      </g>
      <circle cx="24" cy="20" r="4.6" fill="#f5c246" />
      <path d="M24 25v18" stroke="#4d9c4d" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M24 34c-4 0-6-2-7-5 4-1 6 1 7 5z" fill="#4d9c4d" />
    </>
  ),
  leaf: (
    <>
      <path d="M40 6C20 6 8 16 8 30c0 5 2 9 5 12C16 26 26 18 40 6z" fill="#4d9c4d" />
      <path d="M40 6C26 18 16 26 13 42c14 2 27-8 27-24z" fill="#3f8f3f" />
      <path d="M40 6C26 18 16 26 13 42" stroke="#2f6f2f" strokeWidth="1.6" fill="none" />
    </>
  ),
  tree: (
    <>
      <rect x="21" y="28" width="6" height="15" fill="#8b5a2b" />
      <circle cx="24" cy="18" r="12" fill="#4d9c4d" />
      <circle cx="15" cy="24" r="8" fill="#3f8f3f" />
      <circle cx="33" cy="24" r="8" fill="#3f8f3f" />
      <circle cx="20" cy="14" r="4" fill="#5cb85c" opacity={0.6} />
    </>
  ),
  wave: (
    <>
      <path d="M4 30c5-9 11-9 16 0 5-9 11-9 16 0 3 6 6 6 8 4v9H4z" fill="#3b82c4" />
      <path d="M4 24c5-9 11-9 16 0 5-9 11-9 16 0 3 6 6 6 8 4" fill="none" stroke="#7fb2e5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="14" cy="22" r="1.6" fill="#e0f2fe" opacity={0.8} />
      <circle cx="31" cy="23" r="1.3" fill="#e0f2fe" opacity={0.8} />
    </>
  ),
  fire: (
    <>
      <path d="M24 3c2 8 12 11 12 22a12 12 0 01-24 0C12 17 20 15 24 3z" fill="#e0503c" />
      <path d="M24 16c1.5 5 7 6 7 12a7 7 0 01-14 0c0-5 5-7 7-12z" fill="#f5c246" />
      <path d="M24 26c.8 2 3 2.6 3 5a3 3 0 01-6 0c0-2 2-3 3-5z" fill="#fef3c7" />
    </>
  ),

  /* ---------------- Living things ---------------- */
  /* Long floppy ears down the sides of the head, not round ones on top —
   * round ears read unmistakably as a bear at the 30px these are drawn at. */
  dog: (
    <>
      <path d="M11 18c-2 8-1 15 3 18 3-3 4-9 3-18a3.5 5 0 00-6 0z" fill="#8b5a2b" />
      <path d="M37 18c2 8 1 15-3 18-3-3-4-9-3-18a3.5 5 0 016 0z" fill="#8b5a2b" />
      <ellipse cx="24" cy="25" rx="12.5" ry="12" fill="#c1652c" />
      <ellipse cx="24" cy="31" rx="7.5" ry="6.5" fill="#e0a35e" />
      <ellipse cx="24" cy="28" rx="2.8" ry="2.2" fill="#3b2412" />
      <circle cx="19" cy="22" r="1.9" fill="#3b2412" />
      <circle cx="29" cy="22" r="1.9" fill="#3b2412" />
      <circle cx="19.7" cy="21.3" r="0.7" fill="#fff" />
      <circle cx="29.7" cy="21.3" r="0.7" fill="#fff" />
      <path d="M24 30.5v2M20.5 34c2 1.6 5 1.6 7 0" stroke="#3b2412" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* A tongue — the detail that makes it unambiguously a dog. */}
      <path d="M23 36.5h2.4a1.2 1.2 0 010 2.4H23z" fill="#f2a0b5" />
    </>
  ),
  cat: (
    <>
      <path d="M11 12l2 12 8-5zM37 12l-2 12-8-5z" fill="#9aa4b2" />
      <path d="M12.5 15l1 7 4.5-3zM35.5 15l-1 7-4.5-3z" fill="#f2a0b5" />
      <ellipse cx="24" cy="27" rx="13" ry="12" fill="#9aa4b2" />
      <ellipse cx="19" cy="25" rx="2" ry="2.8" fill="#3b2412" />
      <ellipse cx="29" cy="25" rx="2" ry="2.8" fill="#3b2412" />
      <path d="M22.5 31h3l-1.5 2z" fill="#f2a0b5" />
      <path d="M24 33c-1 1.6-3 1.6-4 .4M24 33c1 1.6 3 1.6 4 .4" stroke="#3b2412" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M12 29h-6M12 32h-6M36 29h6M36 32h6" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="24" cy="32" rx="10" ry="8.5" fill="#c1652c" />
      <ellipse cx="12" cy="21" rx="4.6" ry="5.6" fill="#c1652c" />
      <ellipse cx="20" cy="15" rx="4.6" ry="5.8" fill="#c1652c" />
      <ellipse cx="28" cy="15" rx="4.6" ry="5.8" fill="#c1652c" />
      <ellipse cx="36" cy="21" rx="4.6" ry="5.6" fill="#c1652c" />
      <ellipse cx="24" cy="31" rx="5" ry="4" fill="#e0a35e" opacity={0.6} />
    </>
  ),
  bird: (
    <>
      <ellipse cx="22" cy="26" rx="12" ry="10" fill="#3b82c4" />
      <circle cx="33" cy="18" r="7" fill="#4d9cd4" />
      <path d="M39 17l6 2-6 2.6z" fill="#f5c246" />
      <circle cx="34.5" cy="16.5" r="1.6" fill="#1f2937" />
      <path d="M14 24c5-3 12-2 15 3-4 4-12 4-15-3z" fill="#7fb2e5" />
      <path d="M10 30l-6 6 8-2z" fill="#4d9cd4" />
    </>
  ),

  /* ---------------- Love & celebration ---------------- */
  heart: (
    <>
      <path d="M24 42S5 29 5 17.5C5 10.6 10.4 6 16.5 6 20.4 6 23 8 24 10c1-2 3.6-4 7.5-4C37.6 6 43 10.6 43 17.5 43 29 24 42 24 42z" fill="#e0503c" />
      <path d="M24 42S5 29 5 17.5C5 10.6 10.4 6 16.5 6 20.4 6 23 8 24 10z" fill="#f2705f" />
      <Glint cx={15} cy={15} r={3.4} />
    </>
  ),
  gift: (
    <>
      <rect x="5" y="17" width="38" height="7" rx="2" fill="#e0503c" />
      <rect x="8" y="24" width="32" height="18" rx="2" fill="#f2705f" />
      <rect x="20.5" y="17" width="7" height="25" fill="#f5c246" />
      <path d="M24 17c-6 0-9-2-9-5s5-4 9 5c4-7 9-6 9-5s-3 5-9 5z" fill="#f5c246" />
      <rect x="5" y="17" width="38" height="3" fill={GLINT} opacity={0.2} />
    </>
  ),
  balloon: (
    <>
      <ellipse cx="24" cy="18" rx="12" ry="14" fill="#e0503c" />
      <path d="M24 32l-3 4h6z" fill="#c23b2c" />
      <path d="M24 36c0 4-5 4-5 8" stroke="#9aa4b2" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="19" cy="12" rx="3.4" ry="4.6" fill={GLINT} opacity={0.45} />
    </>
  ),
  ring: (
    <>
      <circle cx="24" cy="30" r="12" fill="none" stroke="#f5c246" strokeWidth="4" />
      <path d="M24 6l7 8-7 7-7-7z" fill="#a7d8f0" />
      <path d="M24 6l7 8H17z" fill="#e0f2fe" />
      <path d="M17 14l7 7 7-7" fill="none" stroke="#7fb2e5" strokeWidth="1" />
    </>
  ),
  crown: (
    <>
      <path d="M6 34l-2-20 11 8 9-14 9 14 11-8-2 20z" fill="#f5c246" />
      <path d="M6 34l-2-20 11 8 9-14v26z" fill="#fbd36b" />
      <rect x="6" y="34" width="36" height="6" rx="2" fill="#d9a021" />
      <circle cx="24" cy="24" r="2.6" fill="#e0503c" />
      <circle cx="14" cy="27" r="2" fill="#4d9c4d" />
      <circle cx="34" cy="27" r="2" fill="#3b82c4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M24 4c1.5 11 6.5 16 18 18-11.5 2-16.5 7-18 18-1.5-11-6.5-16-18-18 11.5-2 16.5-7 18-18z" fill="#f5c246" />
      <path d="M24 4c1.5 11 6.5 16 18 18-11.5 2-16.5 7-18 18z" fill="#fbd36b" />
      <path d="M39 6c.6 4 2.4 5.8 6.4 6.4-4 .6-5.8 2.4-6.4 6.4-.6-4-2.4-5.8-6.4-6.4 4-.6 5.8-2.4 6.4-6.4z" fill="#fde68a" />
    </>
  ),
  champagne: (
    <>
      <path d="M13 6h9l-1 15a3.5 3.5 0 01-7 0z" fill="#f5c246" transform="rotate(-16 17 20)" />
      <path d="M26 6h9l-1 15a3.5 3.5 0 01-7 0z" fill="#f5c246" transform="rotate(16 31 20)" />
      <path d="M17 26l-4 14M31 26l4 14" stroke="#e2e8f0" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="12" r="1.6" fill="#fde68a" />
      <circle cx="20" cy="7" r="1.2" fill="#fde68a" />
      <circle cx="29" cy="8" r="1.4" fill="#fde68a" />
    </>
  ),
  clover: (
    <>
      <g fill="#4d9c4d">
        <path d="M24 22c-6-2-10-6-8-10s7-2 8 4c1-6 6-8 8-4s-2 8-8 10z" />
        <path d="M24 22c-2 6-6 10-10 8s-2-7 4-8c-6-1-8-6-4-8s8 2 10 8z" />
      </g>
      <path d="M24 22c2 6 6 10 10 8s2-7-4-8c6-1 8-6 4-8s-8 2-10 8z" fill="#3f8f3f" />
      <path d="M24 24c1 6 0 12-3 18" stroke="#3f8f3f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),

  /* ---------------- Everyday objects ---------------- */
  key: (
    <>
      <circle cx="15" cy="17" r="10" fill="none" stroke="#f5c246" strokeWidth="5" />
      <path d="M21 23l18 18" stroke="#f5c246" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 34l5-5M36 38l4-4" stroke="#f5c246" strokeWidth="5" strokeLinecap="round" />
      <circle cx="15" cy="17" r="4" fill="#d9a021" />
    </>
  ),
  clock: (
    <>
      <circle cx="24" cy="25" r="18" fill="#f1f5f9" />
      <circle cx="24" cy="25" r="15" fill="#fdfdfd" />
      <circle cx="24" cy="25" r="18" fill="none" stroke="#9aa4b2" strokeWidth="2.4" />
      <path d="M24 15v10l7 4" stroke="#374151" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="25" r="1.8" fill="#e0503c" />
      <path d="M14 6l5 4M34 6l-5 4" stroke="#9aa4b2" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  diamond: (
    <>
      <path d="M14 6h20l10 12-20 24L4 18z" fill="#7fb2e5" />
      <path d="M14 6l-4 12 14 24 14-24-4-12z" fill="#a7d8f0" />
      <path d="M24 6l-6 12 6 24 6-24z" fill="#e0f2fe" />
      <path d="M4 18h40" stroke="#3b82c4" strokeWidth="1.2" opacity={0.5} />
    </>
  ),
  envelope: (
    <>
      <rect x="4" y="11" width="40" height="27" rx="3" fill="#f1e4c8" />
      <path d="M4 14l20 14 20-14" fill="none" stroke="#c78544" strokeWidth="2.4" />
      <path d="M4 38l15-13M44 38L29 25" stroke="#d6c7a8" strokeWidth="1.6" fill="none" />
      <path d="M24 22a5 5 0 11.1 0z" fill="#e0503c" opacity={0.9} />
    </>
  ),
  coin: (
    <>
      <ellipse cx="24" cy="26" rx="16" ry="15" fill="#d9a021" />
      <ellipse cx="24" cy="23" rx="16" ry="15" fill="#f5c246" />
      <ellipse cx="24" cy="23" rx="11.5" ry="10.5" fill="#fbd36b" />
      <path d="M24 15v16M20 19h6a3 3 0 010 6h-4a3 3 0 000 6h6" stroke="#b8860f" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),

  /* ---------------- Obstacles ---------------- */
  rock: (
    <>
      <path d="M8 36l5-16 11-8 13 6 5 18z" fill="#6b7280" />
      <path d="M13 20l11-8 4 12-9 8z" fill="#9aa4b2" />
      <path d="M28 24l9-6 5 18-14-4z" fill="#4b5563" />
      <path d="M6 36h36a2 2 0 01-2 2H8a2 2 0 01-2-2z" fill="#374151" />
    </>
  ),
  puddle: (
    <>
      <ellipse cx="24" cy="30" rx="19" ry="9" fill="#3b5f8f" />
      <ellipse cx="24" cy="28.5" rx="16" ry="7" fill="#4d7fb0" />
      <ellipse cx="18" cy="26" rx="5" ry="2" fill="#7fb2e5" opacity={0.6} />
      <path d="M32 33c2-1 3-2 4-4" stroke="#7fb2e5" strokeWidth="1.4" fill="none" opacity={0.7} />
    </>
  ),
  bomb: (
    <>
      <circle cx="22" cy="29" r="14" fill="#374151" />
      <circle cx="22" cy="29" r="14" fill="none" stroke="#1f2937" strokeWidth="1.4" />
      <rect x="27" y="11" width="6" height="6" rx="1.4" fill="#6b7280" transform="rotate(38 30 14)" />
      <path d="M33 11c3-3 7-3 8 1" stroke="#c78544" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M41 10c1.6-1.4 4-1 4.4 1.4-2 .6-3.4.2-4.4-1.4z" fill="#f5c246" />
      <ellipse cx="16" cy="23" rx="4" ry="2.6" fill={GLINT} opacity={0.28} transform="rotate(-30 16 23)" />
    </>
  ),
  cone: (
    <>
      <path d="M24 6l11 30H13z" fill="#e8843a" />
      <path d="M24 6l11 30h-11z" fill={SHADE} opacity={0.25} />
      <path d="M18.6 21h10.8l1.4 4H17.2zM16.4 28h15.2l1.4 4H15z" fill="#fdfdfd" />
      <rect x="8" y="36" width="32" height="5" rx="2" fill="#c1652c" />
    </>
  ),
  'rain-cloud': (
    <>
      <path d="M14 27a8.5 8.5 0 01-.5-17 11 11 0 0121-2A7.5 7.5 0 0135 27z" fill="#6b7280" />
      <path d="M24 27h11a7.5 7.5 0 001-14 11 11 0 00-2-4z" fill="#4b5563" />
      <g stroke="#3b82c4" strokeWidth="2.6" strokeLinecap="round">
        <path d="M16 32l-2 7M24 32l-2 7M32 32l-2 7" />
      </g>
    </>
  ),
  thorn: (
    <>
      <path d="M20 42V16h8v26z" fill="#3f8f3f" />
      <path d="M24 16v26h4V16z" fill={SHADE} opacity={0.25} />
      <path d="M20 22l-8-4 8 8zM28 28l8-4-8 8zM20 33l-7-3 7 7z" fill="#4d9c4d" />
      <g fill="#f5c246">
        <path d="M20 20l-3-1 3 3zM28 26l3-1-3 3zM20 31l-3-1 3 3z" />
      </g>
      <path d="M24 10c2 3 3 4 3 5.4a3 3 0 01-6 0c0-1.4 1-2.4 3-5.4z" fill="#f2a0b5" />
    </>
  ),
  ice: (
    <>
      <path d="M16 12h16l6 10-6 10H16l-6-10z" fill="#a7d8f0" />
      <path d="M24 12h8l6 10-6 10h-8z" fill="#7fb2e5" />
      <path d="M16 12h16l-4 6H20z" fill="#e0f2fe" opacity={0.8} />
      <path d="M24 18v8M20 22h8" stroke="#e0f2fe" strokeWidth="1.6" opacity={0.7} />
    </>
  ),
  trash: (
    <>
      <path d="M10 14h28l-2.6 25a4 4 0 01-4 3.6H16.6a4 4 0 01-4-3.6z" fill="#6b7280" />
      <rect x="7" y="9" width="34" height="5" rx="2.4" fill="#4b5563" />
      <rect x="19" y="5" width="10" height="4" rx="1.6" fill="#4b5563" />
      <path d="M19 21v14M24 21v14M29 21v14" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

interface Props {
  /** Vocabulary name. Wins over `emoji` whenever it resolves. */
  icon?: string;
  /** Legacy / fallback glyph, drawn only when no vector art resolves. */
  emoji?: string;
  /** Whether this is a collectible; drives the unknown-obstacle fallback. */
  good?: boolean;
  /** Rendered size in px. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Drops a soft contact shadow beneath the object, so it sits in the world. */
  shadow?: boolean;
}

/**
 * One game object.
 *
 * Memoised because the action engines re-render on every score change while
 * dozens of these are on screen — and the art never changes for a given item.
 */
const GameIconArt = memo(function GameIconArt({
  icon,
  emoji,
  good = true,
  size = 44,
  className,
  style,
  shadow = true,
}: Props) {
  const resolved = resolveIcon(icon, emoji, good);

  // Nothing in the vocabulary matched. Rather than drop the object (which
  // would silently remove a collectible the game counts on), fall back to the
  // emoji the config always carries.
  if (!resolved) {
    return (
      <span
        className={className}
        style={{
          fontSize: size * 0.86,
          lineHeight: 1,
          display: 'inline-block',
          filter: shadow ? 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))' : undefined,
          ...style,
        }}
        aria-hidden="true"
      >
        {emoji}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        overflow: 'visible',
        filter: shadow ? 'drop-shadow(0 3px 5px rgba(0,0,0,0.32))' : undefined,
        ...style,
      }}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[resolved]}
    </svg>
  );
});

export default GameIconArt;
