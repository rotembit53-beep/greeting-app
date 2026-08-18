'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface StepProps {
  state: any;
  updateState: (updates: any) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  AI_UNAVAILABLE: 'השרת עמוס כרגע, אנא נסו שוב בעוד מספר שניות',
  AI_NOT_CONFIGURED: 'שירות יצירת הברכות אינו זמין כרגע, אנא פנו לתמיכה',
  AI_INVALID_RESPONSE: 'לא הצלחנו לייצר ברכה תקינה, נסו שוב',
  VALIDATION_ERROR: 'חלק מהפרטים חסרים או שגויים, בדקו ונסו שוב',
};

const DEFAULT_ERROR_MESSAGE = 'משהו השתבש ביצירת הברכה, נסו שוב בעוד רגע';

function progressStatus(progress: number): string {
  if (progress < 30) return 'קוראים את הפרטים שמילאתם...';
  if (progress < 65) return 'מנסחים ברכה אישית ומדויקת...';
  if (progress < 90) return 'מלטשים את הניסוח הסופי...';
  return 'עוד רגע קטן, משלימים את הברכה...';
}

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ progress }: { progress: number }) {
  const offset = RING_CIRCUMFERENCE * (1 - progress / 100);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle
          cx="70"
          cy="70"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth="9"
        />
        <circle
          cx="70"
          cy="70"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.25s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-extrabold tabular-nums leading-none"
          style={{ color: 'var(--primary)' }}
        >
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export default function Step3Generate({ state, updateState }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    // Ease quickly toward 90, then keep creeping slowly toward 99 so the
    // indicator never looks frozen while waiting on the AI response.
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p < 90) return p + (90 - p) * 0.1;
        return Math.min(99, p + 0.15);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!state.recipientName || !state.eventType || !state.theme) {
      setError('חסרים פרטים — חזרו לשלב הראשון והשלימו אותם');
      return;
    }

    if (!state.recipientGender) {
      setError('חסר מגדר הנמען — חזרו לשלב הראשון ובחרו זכר או נקבה, כדי שהברכה תנוסח בלשון נכונה');
      return;
    }

    setLoading(true);
    setError(null);
    setIsEditingText(false);

    try {
      const res = await fetch('/api/generate-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: state.recipientName,
          eventType: state.eventType,
          theme: state.theme,
          userNotes: state.userNotes,
          recipientGender: state.recipientGender,
          relationship: state.relationship,
        }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        throw new Error(ERROR_MESSAGES[data.errorCode] || DEFAULT_ERROR_MESSAGE);
      }

      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 400));
      updateState({ aiText: data.greeting });
    } catch (err: any) {
      setError(err.message || DEFAULT_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">נוסח הברכה</h2>
        <p className="section-subtitle">
          ננסח עבורכם ברכה אישית על סמך הפרטים שמילאתם
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          <Icon name="alert" size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center space-y-5 py-10">
          <ProgressRing progress={progress} />
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {progressStatus(progress)}
          </p>
        </div>
      ) : !state.aiText ? (
        <div className="text-center space-y-6 py-8">
          <p style={{ color: 'var(--ink-soft)' }}>
            לחיצה אחת — ואנחנו כותבים ברכה שמרגישה כאילו נכתבה במיוחד בשבילם
          </p>
          <button onClick={handleGenerate} className="btn-primary text-lg !px-10 !py-4">
            <Icon name="sparkle" size={20} />
            צרו את הברכה
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="p-6 rounded-xl border"
            style={{ borderColor: 'var(--accent)', background: 'rgba(217, 154, 78, 0.06)' }}
          >
            <div className="flex items-center justify-between mb-3 gap-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
                הנוסח שנוצר עבורכם
              </p>
              <button
                type="button"
                onClick={() => setIsEditingText((v) => !v)}
                className="btn-ghost !py-1 !px-2.5 text-xs shrink-0"
              >
                <Icon name={isEditingText ? 'check' : 'edit'} size={14} />
                {isEditingText ? 'סיימו עריכה' : 'ערכו את הטקסט'}
              </button>
            </div>

            {isEditingText ? (
              <textarea
                value={state.aiText.fullGreeting}
                onChange={(e) =>
                  updateState({
                    aiText: { ...state.aiText, fullGreeting: e.target.value },
                  })
                }
                rows={8}
                className="input-field w-full text-lg leading-relaxed"
              />
            ) : (
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {state.aiText.fullGreeting}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <p
                className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--ink-soft)' }}
              >
                <Icon name="chat" size={14} />
                הודעת WhatsApp מצורפת
              </p>
              <p className="text-sm">{state.aiText.shareData.whatsappMessage}</p>
            </div>

            <div
              className="p-4 rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <p
                className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--ink-soft)' }}
              >
                <Icon name="mail" size={14} />
                נושא המייל
              </p>
              <p className="text-sm">{state.aiText.shareData.gmailSubject}</p>
            </div>
          </div>

          <button onClick={handleGenerate} className="btn-ghost w-full">
            <Icon name="refresh" size={16} />
            לא מרוצים? נסחו מחדש
          </button>
        </div>
      )}
    </div>
  );
}
