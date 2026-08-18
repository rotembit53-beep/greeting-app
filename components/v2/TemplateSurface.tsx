'use client';

import { CSSProperties, ReactNode } from 'react';
import { TemplateDef } from '@/lib/v2/templates';

/**
 * Projects a template's palette onto CSS custom properties so every V2
 * component styles itself from `--v2-*` and instantly re-themes when the
 * template changes — no per-template component branches anywhere.
 */
export function templateVars(t: TemplateDef): CSSProperties {
  return {
    ['--v2-ink' as string]: t.palette.ink,
    ['--v2-ink-soft' as string]: t.palette.inkSoft,
    ['--v2-accent' as string]: t.palette.accent,
    ['--v2-accent-soft' as string]: t.palette.accentSoft,
    ['--v2-surface' as string]: t.palette.surface,
    ['--v2-surface-border' as string]: t.palette.surfaceBorder,
    ['--v2-glow' as string]: t.palette.glow,
    // Funny's accent is near-black, so white-on-accent would vanish.
    ['--v2-on-accent' as string]: t.id === 'funny' ? '#ffe75e' : '#ffffff',
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
