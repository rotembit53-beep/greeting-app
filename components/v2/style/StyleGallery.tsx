'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TEMPLATE_LIST, getTemplate } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import { TemplateId } from '@/lib/v2/types';
import StyleCanvas from './StyleCanvas';

gsap.registerPlugin(useGSAP);

/**
 * The style chooser: one full-screen live canvas plus a compact picker.
 *
 * Replaces the previous 21-card grid bound to a phone mockup. Both of those
 * showed each design as a small framed thumbnail; a greeting is a full-screen
 * experience, so the chooser now shows it at that size and the picker is
 * reduced to a single scrollable row of names.
 */

interface Props {
  /** Controlled selection (the editor); omit for the landing's own state. */
  value?: TemplateId;
  onSelect?: (id: TemplateId) => void;
  /** Templates the current plan can't use — shown, but marked. */
  lockedIds?: TemplateId[];
  onLockedClick?: () => void;
  /**
   * The landing shows the full-screen canvas; the editor already renders its
   * own live preview beside the form, so there it's picker-only.
   */
  showCanvas?: boolean;
}

export default function StyleGallery({
  value,
  onSelect,
  lockedIds = [],
  onLockedClick,
  showCanvas = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState<TemplateId>(TEMPLATE_LIST[0].id);

  const selected = value ?? internal;
  const shown = getTemplate(selected);

  const pick = (id: TemplateId) => {
    if (lockedIds.includes(id)) {
      onLockedClick?.();
      return;
    }
    if (onSelect) onSelect(id);
    else setInternal(id);
  };

  const picker = (
    <div className="style-picker" role="listbox" aria-label="בחירת סגנון">
      <div className="style-picker-track">
        {TEMPLATE_LIST.map((t) => {
          const locked = lockedIds.includes(t.id);
          const isSel = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={isSel}
              data-selected={isSel}
              onClick={() => pick(t.id)}
              className="style-pill"
            >
              <span aria-hidden="true">{t.preview.emoji}</span>
              {t.label}
              {locked && <span className="style-pill-lock">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!showCanvas) {
    // Editor: picker only, plus the one-line pitch for the current style so
    // the choice still explains itself without a card to carry the copy.
    return (
      <div ref={rootRef}>
        {picker}
        <p className="style-picker-pitch">{styleArt(shown.id).pitch}</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="style-stage">
      <StyleCanvas template={shown} canvasKey={shown.id} />
      {picker}
      <p className="style-picker-pitch">{styleArt(shown.id).pitch}</p>
    </div>
  );
}
