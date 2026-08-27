'use client';

import { useCallback, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TEMPLATE_LIST, getTemplate } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import { TemplateId } from '@/lib/v2/types';
import DevicePreview from './DevicePreview';

gsap.registerPlugin(useGSAP);

/**
 * The style chooser: the phone showcase beside a full swatch board.
 *
 * The previous version hid all 21 styles inside a single horizontal strip of
 * identical white pills that clipped at both viewport edges — nothing showed
 * that it scrolled, the selected pill was a hairline ring among twenty
 * others, and the styles themselves were invisible until you clicked one.
 *
 * Now every style is on screen at once and wears its own palette: the
 * gradient IS the swatch, the way a paint chip is the paint. Selection is
 * carried by the chip lifting and taking a gold ring, and the brief beside
 * the phone names what you're looking at. Borderless throughout — the colour
 * is the surface, not something boxed inside a card.
 */

interface Props {
  /** Controlled selection (the editor); omit for the landing's own state. */
  value?: TemplateId;
  onSelect?: (id: TemplateId) => void;
  /** Templates the current plan can't use — shown, but marked. */
  lockedIds?: TemplateId[];
  onLockedClick?: () => void;
  /** The landing shows the phone; the editor is picker-only. */
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
  const briefRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [internal, setInternal] = useState<TemplateId>(TEMPLATE_LIST[0].id);

  const selected = value ?? internal;
  const shown = getTemplate(selected);
  const art = styleArt(shown.id);
  const index = TEMPLATE_LIST.findIndex((t) => t.id === selected);

  const pick = useCallback(
    (id: TemplateId) => {
      if (lockedIds.includes(id)) {
        onLockedClick?.();
        return;
      }
      if (onSelect) onSelect(id);
      else setInternal(id);
    },
    [lockedIds, onLockedClick, onSelect]
  );

  /* Roving selection with the arrow keys. The board is RTL, so ArrowLeft
   * advances and ArrowRight goes back — matching what the eye sees, not the
   * LTR array order. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = TEMPLATE_LIST.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.min(index + 1, last);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.max(index - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null || next === index) return;
    e.preventDefault();
    pick(TEMPLATE_LIST[next].id);
    btnRefs.current[next]?.focus();
  };

  // The brief re-reads on every change; a short fade-up keeps the swap from
  // reading as a text glitch next to the phone's own 3D turn.
  useGSAP(
    () => {
      const el = briefRef.current;
      if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    },
    { dependencies: [selected], scope: rootRef }
  );

  const brief = (
    <div ref={briefRef} className="style-brief" aria-live="polite">
      <p className="v2-eyebrow">
        {showDevice ? 'תצוגה חיה' : 'הסגנון שנבחר'} · {index + 1} מתוך {TEMPLATE_LIST.length}
      </p>
      <h3 className="style-brief-name">
        {shown.label}
      </h3>
      <p className="style-brief-pitch">{art.pitch}</p>
      <ul className="style-brief-tags">
        {art.tags.map((tag) => (
          <li key={tag.label}>
            <span aria-hidden="true">{tag.emoji}</span> {tag.label}
          </li>
        ))}
      </ul>
    </div>
  );

  const board = (
    <div className="style-board">
      <p className="style-board-head">
        בחרו סגנון
        <span>{TEMPLATE_LIST.length} סגנונות</span>
      </p>
      <div
        className="style-swatches"
        role="listbox"
        aria-label="בחירת סגנון עיצוב"
        onKeyDown={onKeyDown}
      >
        {TEMPLATE_LIST.map((t, i) => {
          const locked = lockedIds.includes(t.id);
          const isSel = selected === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              role="option"
              aria-selected={isSel}
              data-selected={isSel}
              data-locked={locked}
              tabIndex={isSel ? 0 : -1}
              onClick={() => pick(t.id)}
              className="style-swatch"
              title={t.description}
            >
              <span
                className="style-swatch-chip"
                style={{ background: t.preview.gradient }}
                aria-hidden="true"
              >
                <span className="style-swatch-emoji">{t.preview.emoji}</span>
              </span>
              <span className="style-swatch-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!showDevice) {
    return (
      <div ref={rootRef} className="style-chooser style-chooser-compact">
        {brief}
        {board}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="style-chooser">
      <div className="style-showcase-device">
        <DevicePreview template={shown} previewKey={shown.id} />
      </div>
      <div className="style-chooser-side">
        {brief}
        {board}
      </div>
    </div>
  );
}
