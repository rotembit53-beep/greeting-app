'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TEMPLATE_LIST, getTemplate } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import { TemplateId } from '@/lib/v2/types';
import DevicePreview from './DevicePreview';

gsap.registerPlugin(useGSAP);

/**
 * The style chooser: the phone showcase plus a compact picker.
 *
 * The phone stays — it's what sells the product, and a greeting really is
 * received on one. What changed is everything around and inside it: the
 * 21-card grid that used to sit beside it is now a single scrollable row of
 * names, and the design inside the phone runs full-bleed instead of being
 * broken into little cards.
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

  const pitch = <p className="style-picker-pitch">{styleArt(shown.id).pitch}</p>;

  if (!showDevice) {
    return (
      <div ref={rootRef}>
        {picker}
        {pitch}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="style-showcase">
      <div className="style-showcase-device">
        <DevicePreview template={shown} previewKey={shown.id} />
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--v2-ink-soft)' }} aria-live="polite">
        תצוגה חיה — <strong style={{ color: 'var(--v2-ink)' }}>{shown.label}</strong>
      </p>
      {picker}
      {pitch}
    </div>
  );
}
