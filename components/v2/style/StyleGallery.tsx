'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TEMPLATE_LIST, getTemplate } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import { TemplateId } from '@/lib/v2/types';
import StyleArt from './StyleArt';
import DevicePreview from './DevicePreview';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The style gallery, bound to a live device preview.
 *
 * Picking a card doesn't just highlight it — it reloads the phone with that
 * style's own composition, so the gallery reads as a demo of the product
 * rather than a grid of swatches.
 */

interface Props {
  /** Controlled selection (the editor); omit for the landing's own state. */
  value?: TemplateId;
  onSelect?: (id: TemplateId) => void;
  /** Templates the current plan can't use — shown, but marked. */
  lockedIds?: TemplateId[];
  onLockedClick?: () => void;
  /** The landing shows the device; the editor already has its own preview. */
  showDevice?: boolean;
}

export default function StyleGallery({
  value,
  onSelect,
  lockedIds = [],
  onLockedClick,
  showDevice = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState<TemplateId>(TEMPLATE_LIST[0].id);
  const [hovered, setHovered] = useState<TemplateId | null>(null);

  const selected = value ?? internal;
  // Hovering previews that style without committing to it.
  const shown = getTemplate(hovered ?? selected);

  const pick = (id: TemplateId) => {
    if (lockedIds.includes(id)) {
      onLockedClick?.();
      return;
    }
    if (onSelect) onSelect(id);
    else setInternal(id);
  };

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set('[data-style-card]', { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        '[data-style-card]',
        { y: 34, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.055,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
        }
      );
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef}>
      <div
        className={showDevice ? 'grid gap-10 lg:gap-14 items-start lg:grid-cols-[1fr_auto]' : ''}
      >
        {/* ---------------- cards ---------------- */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATE_LIST.map((t) => {
            const spec = styleArt(t.id);
            const locked = lockedIds.includes(t.id);
            const isSel = selected === t.id;

            return (
              <button
                key={t.id}
                type="button"
                data-style-card
                data-selected={isSel}
                aria-pressed={isSel}
                onClick={() => pick(t.id)}
                onPointerEnter={() => setHovered(t.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(t.id)}
                onBlur={() => setHovered(null)}
                className="style-card"
              >
                {locked && <span className="premium-pill">PREMIUM</span>}
                <span className="style-check" aria-hidden="true">✓</span>

                <div className="art-window">
                  <StyleArt template={t} active={hovered === t.id || isSel} />
                </div>

                <div className="p-4 sm:p-[1.15rem] flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="text-sm leading-none"
                      style={{ opacity: 0.85 }}
                    >
                      {t.preview.emoji}
                    </span>
                    <h3
                      className="v2-display"
                      style={{
                        fontSize: '1.08rem',
                        fontWeight: 700,
                        color: 'var(--v2-ink)',
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t.label}
                    </h3>
                  </div>

                  <p
                    style={{
                      fontSize: '.83rem',
                      lineHeight: 1.65,
                      color: 'var(--v2-ink-soft)',
                      margin: 0,
                    }}
                  >
                    {spec.pitch}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {spec.tags.map((tag) => (
                      <span key={tag.label} className="style-tag">
                        <span aria-hidden="true">{tag.emoji}</span>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ---------------- live device ---------------- */}
        {showDevice && (
          <div className="lg:sticky lg:top-8 flex flex-col items-center">
            <div style={{ position: 'relative' }}>
              <DevicePreview template={shown} previewKey={shown.id} />
            </div>
            <p
              className="text-center mt-1 text-sm"
              style={{ color: 'var(--v2-ink-soft)' }}
              aria-live="polite"
            >
              תצוגה חיה — <strong style={{ color: 'var(--v2-ink)' }}>{shown.label}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
