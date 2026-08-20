'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import { TemplateDef } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import { onAccentFor } from '@/components/v2/TemplateSurface';
import StyleArt from './StyleArt';

gsap.registerPlugin(useGSAP, CustomEase);

if (!CustomEase.get('caseOut')) CustomEase.create('caseOut', '0.25, 1, 0.5, 1');

/**
 * A style rendered as a full-screen canvas — the design at the size it will
 * actually be seen, not a thumbnail of it.
 *
 * This replaces both the 4:3 card art-window and the phone mockup that used
 * to frame the preview. The art runs edge to edge; only the running copy is
 * held to a readable measure, because a line of Hebrew stretched across a
 * 1400px viewport is unreadable no matter how good the type is.
 *
 * Type comes from the template's OWN scale (`template.type.titleSize` etc.),
 * which is authored for the real greeting page — so what you see here is
 * genuinely what the recipient gets, rather than a shrunken approximation.
 */

interface Props {
  template: TemplateDef;
  /** Bumped on every style change so the canvas re-animates. */
  canvasKey: string | number;
}

export default function StyleCanvas({ template, canvasKey }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const spec = styleArt(template.id);
  const p = template.palette;
  const t = template.type;
  const serif = t.display === 'serif';

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set('[data-canvas-in]', { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        '[data-canvas-in]',
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.09,
          ease: 'caseOut',
        }
      );
    },
    { dependencies: [canvasKey], scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className="style-canvas"
      style={{ background: p.pageBg, color: p.ink }}
    >
      {/* Full-bleed art — the whole point of the canvas. */}
      <div className="style-canvas-art" aria-hidden="true">
        <StyleArt template={template} active style={{ background: 'transparent' }} />
      </div>

      {/* Readable measure for the copy, centred on the canvas. */}
      <div className="style-canvas-copy">
        <span
          data-canvas-in
          className="style-canvas-kicker"
          style={{ color: p.accent }}
        >
          {spec.sample.kicker}
        </span>

        <h3
          data-canvas-in
          className={serif ? 'v2-serif' : ''}
          style={{
            fontSize: t.titleSize,
            fontWeight: t.titleWeight,
            letterSpacing: t.titleTracking,
            textTransform: t.titleTransform,
            lineHeight: 1.1,
            color: p.ink,
            margin: 0,
          }}
        >
          {spec.sample.title}
        </h3>

        <p
          data-canvas-in
          style={{
            fontSize: t.bodySize,
            lineHeight: t.bodyLeading,
            color: p.ink,
            opacity: 0.86,
            margin: 0,
            maxWidth: '46ch',
          }}
        >
          {spec.sample.body}
        </p>

        <span
          data-canvas-in
          className="style-canvas-cta"
          style={{
            background: p.accent,
            color: onAccentFor(template),
            boxShadow: `0 14px 34px -16px ${p.glow}`,
          }}
        >
          {spec.sample.cta}
        </span>
      </div>
    </div>
  );
}
