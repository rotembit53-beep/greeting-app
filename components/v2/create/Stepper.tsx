'use client';

export type FlowStage =
  | 'event'
  | 'details'
  | 'generating'
  | 'editor'
  | 'opening'
  | 'gift'
  | 'share';

/** Numbered 1-4 in display order; `share` sits outside the numbering — it's
 *  the destination, not a step the creator works through. */
const STEPS: { id: FlowStage; label: string }[] = [
  { id: 'event', label: '1. סוג האירוע' },
  { id: 'details', label: '2. פרטים טכניים' },
  { id: 'editor', label: '3. עיצוב ועריכה' },
  { id: 'gift', label: '4. הוספת מתנה' },
  { id: 'share', label: 'שיתוף' },
];

/**
 * Sub-stages fold into the labeled step they belong to.
 *
 * `opening` shares `editor`'s order on purpose: the two used to be separate
 * numbered steps, but the "design the greeting text" and "design the unlock
 * experience" screens are now presented as one combined "עיצוב ועריכה"
 * step, the same way `generating` already folds into it as a transient view
 * rather than a step of its own.
 */
const STAGE_ORDER: Record<FlowStage, number> = {
  event: 0,
  details: 1,
  generating: 2,
  editor: 2,
  opening: 2,
  gift: 3,
  share: 4,
};

interface StepperProps {
  stage: FlowStage;
  /** Every step is reachable — earlier ones to review, later ones to jump
   *  ahead. A step whose own data doesn't exist yet (no generated text, no
   *  published link) renders a friendly prompt instead of blocking the click. */
  onGoTo: (stage: FlowStage) => void;
  /**
   * Which steps actually hold answers. Deliberately *not* derived from
   * position: now that the stepper can jump forward, "everything behind the
   * cursor is done" would tick off steps the user skipped straight past.
   */
  completed: Partial<Record<FlowStage, boolean>>;
}

/**
 * Named, clickable progress indicator.
 *
 * Replaces a set of unlabeled `aria-hidden` dots that gave no orientation —
 * neither a sighted user nor a screen reader could tell what step they were
 * on or how many remained. Every step's own word sits inside its badge on
 * every breakpoint, not just from `sm` up beside a bare numbered dot — so
 * which step is which is legible at a glance, on a phone, without having to
 * tap in to find out. Done/active/upcoming still reads from color and the
 * checkmark; the word itself never gets replaced, so a finished step still
 * says what it was.
 */
export default function Stepper({ stage, onGoTo, completed }: StepperProps) {
  if (stage === 'share') return null;

  const current = STAGE_ORDER[stage];

  return (
    <nav aria-label="שלבי היצירה" className="w-full overflow-x-auto">
      <ol className="stepper-list">
        {STEPS.map((step, i) => {
          if (step.id === 'share') return null;
          const stepOrder = STAGE_ORDER[step.id];
          const active = stepOrder === current;
          const done = Boolean(completed[step.id]) && !active;

          return (
            <li key={step.id} className="stepper-item">
              <button
                type="button"
                onClick={() => onGoTo(step.id)}
                aria-current={active ? 'step' : undefined}
                className="stepper-badge"
                data-done={done || undefined}
                data-active={active || undefined}
              >
                {done && (
                  <span className="stepper-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                {step.label}
              </button>

              {i < STEPS.length - 2 && (
                <span className="stepper-connector" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
