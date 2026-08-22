'use client';

export type FlowStage =
  | 'event'
  | 'details'
  | 'generating'
  | 'editor'
  | 'gift'
  | 'preview'
  | 'share';

const STEPS: { id: FlowStage; label: string }[] = [
  { id: 'event', label: 'אירוע' },
  { id: 'details', label: 'פרטים' },
  { id: 'editor', label: 'עריכה' },
  { id: 'gift', label: 'מתנה' },
  { id: 'share', label: 'שיתוף' },
];

/** Sub-stages fold into the labeled step they belong to. */
const STAGE_ORDER: Record<FlowStage, number> = {
  event: 0,
  details: 1,
  generating: 2,
  editor: 2,
  preview: 2,
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
 * on or how many remained. Every step is clickable, in either direction;
 * the checkmark/number still communicates which ones are actually done.
 */
export default function Stepper({ stage, onGoTo, completed }: StepperProps) {
  if (stage === 'share') return null;

  const current = STAGE_ORDER[stage];

  return (
    <nav aria-label="שלבי היצירה" className="w-full overflow-x-auto">
      <ol className="flex items-center gap-1.5 sm:gap-2 min-w-max mx-auto justify-center">
        {STEPS.map((step, i) => {
          if (step.id === 'share') return null;
          const stepOrder = STAGE_ORDER[step.id];
          const active = stepOrder === current;
          const done = Boolean(completed[step.id]) && !active;

          return (
            <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onGoTo(step.id)}
                aria-current={active ? 'step' : undefined}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 sm:px-2.5 transition-colors"
                style={{
                  cursor: 'pointer',
                  background: active ? 'var(--v2-accent-soft)' : 'transparent',
                }}
              >
                {/* Filled only once the step actually holds an answer. The
                  * "you are here" cue is the pill behind the label, so an
                  * unfinished current step still reads as unfinished. */}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: done ? 'var(--v2-accent)' : 'var(--v2-surface-border)',
                    color: done ? 'var(--v2-on-accent, #fff)' : 'var(--v2-ink-soft)',
                    outline: active ? '2px solid var(--v2-accent)' : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span
                  className="hidden sm:inline text-xs font-semibold whitespace-nowrap"
                  style={{ color: active ? 'var(--v2-accent)' : 'var(--v2-ink-soft)' }}
                >
                  {step.label}
                </span>
              </button>

              {i < STEPS.length - 2 && (
                <span
                  className="w-3 sm:w-5 h-px flex-shrink-0"
                  style={{ background: 'var(--v2-surface-border)' }}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
