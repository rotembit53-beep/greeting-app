'use client';

import { CSSProperties, ReactNode } from 'react';
import { TemplateDef } from '@/lib/v2/templates';

/**
 * Projects a template's palette onto CSS custom properties so every V2
 * component styles itself from `--v2-*` and instantly re-themes when the
 * template changes — no per-template component branches anywhere.
 */
/** WCAG relative luminance of a `#rrggbb` colour. Null if not parseable. */
function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Warm near-black, used instead of #000 wherever dark text sits on colour. */
const DARK_ON_ACCENT = '#241A22';

/**
 * Text colour for anything filled with the accent. Picks whichever of white
 * or the dark ink actually contrasts better against that specific accent,
 * rather than assuming white: nine of the templates (elegant's gold, party
 * and aurora's mints, blueprint, candy, fairytale, military, midnight,
 * romantic) have accents light enough that white-on-accent was failing
 * WCAG outright — a CTA nobody could read.
 */
export function onAccentFor(t: TemplateDef): string {
  // Funny's yellow-on-black is a deliberate brand mark, not a default.
  if (t.id === 'funny') return '#ffe75e';
  const lum = luminance(t.palette.accent);
  if (lum === null) return '#ffffff';
  const darkLum = luminance(DARK_ON_ACCENT) ?? 0;
  return contrast(lum, darkLum) > contrast(lum, 1) ? DARK_ON_ACCENT : '#ffffff';
}

export function templateVars(t: TemplateDef): CSSProperties {
  return {
    ['--v2-ink' as string]: t.palette.ink,
    ['--v2-ink-soft' as string]: t.palette.inkSoft,
    ['--v2-accent' as string]: t.palette.accent,
    ['--v2-accent-soft' as string]: t.palette.accentSoft,
    ['--v2-surface' as string]: t.palette.surface,
    ['--v2-surface-border' as string]: t.palette.surfaceBorder,
    ['--v2-glow' as string]: t.palette.glow,
    ['--v2-on-accent' as string]: onAccentFor(t),
  };
}

interface TemplateSurfaceProps {
  template: TemplateDef;
  children: ReactNode;
  className?: string;
  /** Renders the template's page background; off inside the editor preview. */
  withBackground?: boolean;
  style?: CSSProperties;
}

export default function TemplateSurface({
  template,
  children,
  className = '',
  withBackground = true,
  style,
}: TemplateSurfaceProps) {
  return (
    <div
      className={`v2-scope ${className}`}
      /* Lets v2.css retint the shadow/hairline system for dark grounds —
       * a warm umber shadow reads as a smudge on a dark surface, and a
       * dark hairline disappears into it. See `.v2-scope[data-dark]`. */
      data-dark={template.dark ? 'true' : 'false'}
      style={{
        ...templateVars(template),
        ...(withBackground ? { background: template.palette.pageBg } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
