'use client';

import { ReactNode } from 'react';

/**
 * One switchable block of the greeting's text.
 *
 * Every part the AI wrote is on by default — the checkbox is how a sender
 * drops the ones they don't want. Unchecking never deletes anything: the
 * fields stay filled and editable-looking but dim and disabled, so turning a
 * part back on is one click and the text is exactly where it was left.
 */

interface Props {
  label: string;
  /** Shown under the label — what this part is, or where it appears. */
  hint?: string;
  included: boolean;
  onToggle: (included: boolean) => void;
  /** The field(s) this switch governs. */
  children: ReactNode;
  id: string;
}

export default function PartToggle({
  label,
  hint,
  included,
  onToggle,
  children,
  id,
}: Props) {
  return (
    <div className="ed-part" data-off={!included}>
      <div className="ed-part-head">
        <label className="v2-check" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={included}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="v2-check-box" aria-hidden="true" />
          <span className="v2-check-label">{label}</span>
        </label>
        {!included && <span className="ed-part-off">לא ייכלל בברכה</span>}
      </div>
      {hint && <p className="v2-hint ed-part-hint">{hint}</p>}
      <div className="ed-part-body" aria-hidden={!included}>
        {children}
      </div>
    </div>
  );
}
