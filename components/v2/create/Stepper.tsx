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
  /** Only past, completed steps are clickable — never skip ahead. */
  onGoTo: (stage: FlowStage) => void;
}

/**
 * Named, clickable progress indicator.
 *
 * Replaces a set of unlabeled `aria-hidden` dots that gave no orientation —
 * neither a sighted user nor a screen reader could tell what step they were
 * on or how many remained. This is also the only way back to an earlier
 * step once you're past it (previously: none).
 */
export default function Stepper({ stage, onGoTo }: StepperProps) {
  if (stage === 'share') return null;

  const current = STAGE_ORDER[stage];

  return (
    <nav aria-label="שלבי היצירה" className="w-full overflow-x-auto">
      <ol className="flex items-center gap-1.5 sm:gap-2 min-w-max mx-auto justify-center">
        {STEPS.map((step, i) => {
          if (step.id === 'share') return null;
          const stepOrder = STAGE_ORDER[step.id];
          const done = stepOrder < current;
          const active = stepOrder === current;
          const clickable = done;

          return (
            <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onGoTo(step.id)}
                aria-current={active ? 'step' : undefined}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 sm:px-2.5 transition-colors"
                style={{
                  cursor: clickable ? 'pointer' : 'default',
                  background: active ? 'var(--v2-accent-soft)' : 'transparent',
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: done || active ? 'var(--v2-accent)' : 'var(--v2-surface-border)',
                    color: done || active ? 'var(--v2-on-accent, #fff)' : 'var(--v2-ink-soft)',
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
