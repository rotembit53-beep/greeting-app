'use client';

import { OpeningConfig, OpeningMechanic, OpeningPreference } from '@/lib/v2/opening/types';
import BackButton from '@/components/v2/BackButton';

/**
 * "How should they unlock the greeting?"
 *
 * Surprise Me is the recommendation and the default, because the creator
 * should not have to think about game mechanics to get a good one — they
 * already told us about the person, which is the only input that matters.
 * Choosing a type by hand pins the mechanic; the content is still written
 * around the recipient either way.
 */

interface MechanicOption {
  id: OpeningMechanic;
  emoji: string;
  label: string;
  hint: string;
}

const MECHANICS: MechanicOption[] = [
  { id: 'tap-targets', emoji: '👆', label: 'תפיסה', hint: 'לתפוס את הדברים הנכונים' },
  { id: 'timing-bar', emoji: '🎯', label: 'תזמון', hint: 'לעצור בול ברגע הנכון' },
  { id: 'sequence-order', emoji: '🧩', label: 'סדר נכון', hint: 'להרכיב לפי הסדר' },
  { id: 'memory-match', emoji: '🃏', label: 'זיכרון', hint: 'למצוא את הזוגות' },
  { id: 'dodge-run', emoji: '🏃', label: 'מרוץ', hint: 'להגיע ליעד בזמן' },
  { id: 'quiz-unlock', emoji: '❓', label: 'חידון', hint: 'שאלות שרק הם יידעו' },
];

interface Props {
  preference: OpeningPreference;
  config: OpeningConfig | null;
  loading: boolean;
  error: string | null;
  onPreferenceChange: (preference: OpeningPreference) => void;
  onRegenerate: () => void;
  /** Standalone-only: the page's own heading and back/continue row. Omitted
   *  when `embedded`, since the step wrapping this then supplies its own. */
  onBack?: () => void;
  onContinue?: () => void;
  /** True when rendered as a tab inside the editor step rather than as its
   *  own full page — hides the page heading and the back/continue row. */
  embedded?: boolean;
}

export default function OpeningStep({
  preference,
  config,
  loading,
  error,
  onPreferenceChange,
  onRegenerate,
  onBack,
  onContinue,
  embedded,
}: Props) {
  const showPicker = preference !== 'surprise' && preference !== 'classic';

  return (
    <div>
      {!embedded && (
        <>
          <h1
            className="v2-display text-center mb-2"
            style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)', color: 'var(--v2-ink)' }}
          >
            איך הם יפתחו את הברכה?
          </h1>
          <p className="text-center mb-8" style={{ color: 'var(--v2-ink-soft)' }}>
            אתגר קטן ומהנה לפני שההפתעה נחשפת
          </p>
        </>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onPreferenceChange('surprise')}
          data-selected={preference === 'surprise'}
          className="v2-choice !flex-row !justify-start !text-start gap-3 !py-4 !px-5"
        >
          <span className="text-2xl">✨</span>
          <span className="flex flex-col gap-0.5">
            <span className="font-extrabold text-sm" style={{ color: 'var(--v2-ink)' }}>
              תפתיעו אותי <span style={{ color: 'var(--v2-accent)' }}>(מומלץ)</span>
            </span>
            <span className="text-xs" style={{ color: 'var(--v2-ink-soft)' }}>
              ניצור חוויית פתיחה אישית לפי מי שאתם חוגגים
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onPreferenceChange('tap-targets')}
          data-selected={showPicker}
          className="v2-choice !flex-row !justify-start !text-start gap-3 !py-4 !px-5"
        >
          <span className="text-2xl">🎮</span>
          <span className="flex flex-col gap-0.5">
            <span className="font-extrabold text-sm" style={{ color: 'var(--v2-ink)' }}>
              אני אבחר סוג
            </span>
            <span className="text-xs" style={{ color: 'var(--v2-ink-soft)' }}>
              גם אז התוכן ייכתב במיוחד עבורם
            </span>
          </span>
        </button>

        {showPicker && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1">
            {MECHANICS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onPreferenceChange(m.id)}
                data-selected={preference === m.id}
                className="v2-choice !py-3.5"
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[10px]" style={{ color: 'var(--v2-ink-soft)' }}>
                  {m.hint}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onPreferenceChange('classic')}
          data-selected={preference === 'classic'}
          className="v2-choice !flex-row !justify-start !text-start gap-3 !py-4 !px-5"
        >
          <span className="text-2xl">💌</span>
          <span className="flex flex-col gap-0.5">
            <span className="font-extrabold text-sm" style={{ color: 'var(--v2-ink)' }}>
              בלי משחק
            </span>
            <span className="text-xs" style={{ color: 'var(--v2-ink-soft)' }}>
              פתיחה קלאסית — מעטפה או מתנה שנפתחת
            </span>
          </span>
        </button>
      </div>

      {/* ---------------- What we made ---------------- */}
      {preference !== 'classic' && (
        <div className="mt-7">
          {loading && (
            <div
              className="rounded-2xl px-5 py-6 text-center"
              style={{ background: 'var(--v2-accent-soft)' }}
            >
              <p className="font-bold mb-1" style={{ color: 'var(--v2-ink)' }}>
                בונים את חוויית הפתיחה…
              </p>
              <p className="text-sm" style={{ color: 'var(--v2-ink-soft)' }}>
                מחפשים את הפרט הכי אישי שסיפרתם לנו
              </p>
            </div>
          )}

          {!loading && config && (
            <div
              className="rounded-2xl px-5 py-5"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-accent)',
              }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--v2-accent)' }}>
                חוויית הפתיחה שנוצרה
              </p>
              <p className="font-extrabold text-lg mb-1" style={{ color: 'var(--v2-ink)' }}>
                {config.title}
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--v2-ink-soft)' }}>
                {config.instruction}
              </p>
              <button
                type="button"
                onClick={onRegenerate}
                className="v2-btn v2-btn-ghost text-sm"
              >
                🔄 תנסו משהו אחר
              </button>
            </div>
          )}

          {/* A failure here is not the creator's problem to solve — the
            * greeting simply opens the classic way instead. */}
          {!loading && !config && error && (
            <div
              className="rounded-2xl px-5 py-5 text-center"
              style={{ background: 'var(--v2-surface)', border: '1.5px solid var(--v2-surface-border)' }}
            >
              <p className="text-sm mb-3" style={{ color: 'var(--v2-ink-soft)' }}>
                {error}
              </p>
              <button type="button" onClick={onRegenerate} className="v2-btn v2-btn-ghost text-sm">
                לנסות שוב
              </button>
            </div>
          )}
        </div>
      )}

      {!embedded && (
        <div className="flex items-center gap-3 mt-10">
          <BackButton onClick={onBack} />
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="v2-btn v2-btn-primary flex-1 text-lg"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'רגע…' : 'המשך למתנה ←'}
          </button>
        </div>
      )}
    </div>
  );
}
