'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import {
  VISUAL_STYLE_LIST,
  VisualConcept,
  resolveVisualStyle,
} from '@/lib/visualStyles';
import { isVideoFile } from '@/components/greeting/HeroCarousel';

interface StepProps {
  state: any;
  updateState: (updates: any) => void;
}

const DESIGN_ERRORS: Record<string, string> = {
  AI_UNAVAILABLE: 'השרת עמוס כרגע, אנא נסו שוב בעוד מספר שניות',
  AI_NOT_CONFIGURED: 'שירות העיצוב אינו זמין כרגע, אנא פנו לתמיכה',
  AI_INVALID_RESPONSE: 'לא הצלחנו להבין את הבקשה, נסו לנסח אותה מחדש',
  VALIDATION_ERROR: 'כתבו תיאור קצר של העיצוב הרצוי (לפחות כמה מילים)',
};

export default function Step4Visual({ state, updateState }: StepProps) {
  const style = resolveVisualStyle(
    state.visualConcept as VisualConcept,
    state.designOverrides
  );

  const [designing, setDesigning] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);

  const handleDesign = async () => {
    const description = (state.designPrompt || '').trim();
    if (description.length < 3) {
      setDesignError(DESIGN_ERRORS.VALIDATION_ERROR);
      return;
    }

    setDesigning(true);
    setDesignError(null);

    try {
      const res = await fetch('/api/design-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          recipientName: state.recipientName,
          eventType: state.eventType,
          theme: state.theme,
        }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        throw new Error(DESIGN_ERRORS[data.errorCode] || 'משהו השתבש, נסו שוב');
      }

      updateState({
        designOverrides: data.overrides,
        visualConcept: data.overrides.baseStyle,
      });
    } catch (err: any) {
      setDesignError(err.message || 'משהו השתבש, נסו שוב');
    } finally {
      setDesigning(false);
    }
  };

  const clearDesign = () => {
    updateState({ designOverrides: null });
    setDesignError(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">סגנון העיצוב</h2>
        <p className="section-subtitle">
          בחרו את האווירה החזותית — התצוגה למטה מציגה בדיוק איך הברכה שלכם תיראה בפועל
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {VISUAL_STYLE_LIST.map((concept) => {
          const isSelected = style.id === concept.id;
          return (
            <button
              key={concept.id}
              onClick={() =>
                updateState({ visualConcept: concept.id, designOverrides: null })
              }
              className="p-6 rounded-xl border text-right transition-all"
              style={{
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                background: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
                boxShadow: isSelected ? '0 0 0 3px var(--primary-soft)' : 'none',
              }}
            >
              <div className="flex gap-1.5 mb-4">
                {concept.swatches.map((color, idx) => (
                  <span
                    key={idx}
                    className="w-7 h-7 rounded-full border"
                    style={{ background: color, borderColor: 'rgba(43, 35, 32, 0.1)' }}
                  />
                ))}
              </div>
              <h3 className="font-bold mb-1" style={{ color: 'var(--ink)' }}>
                {concept.label}
              </h3>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                {concept.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Free-text design brief — the AI turns it into a real design */}
      <div
        className="p-6 rounded-xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
      >
        <div className="flex items-start gap-2 mb-1">
          <span style={{ color: 'var(--primary)' }}>
            <Icon name="sparkle" size={18} />
          </span>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--ink)' }}>
              מעצב אישי — תארו איך תרצו שהברכה תיראה
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
              כתבו בחופשיות מה בא לכם, ואנחנו נעצב את הברכה בהתאם. לדוגמה: «רקע כחול
              עמוק עם זהב, אלגנטי ורגוע» או «צבעוני ושמח עם בלונים לילדים»
            </p>
          </div>
        </div>

        <textarea
          value={state.designPrompt || ''}
          onChange={(e) => updateState({ designPrompt: e.target.value })}
          placeholder="לדוגמה: רקע כהה בגוון יער עם נגיעות זהב, אווירה יוקרתית ושקטה, וכוכבים שמרחפים ברקע"
          rows={3}
          className="input-field resize-none mt-4"
          maxLength={600}
        />

        {designError && (
          <div
            className="mt-3 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <Icon name="alert" size={16} />
            <span className="font-medium">{designError}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={handleDesign} disabled={designing} className="btn-primary">
            <Icon name="sparkle" size={16} />
            {designing ? 'מעצבים את הברכה...' : 'עצבו לי את הברכה'}
          </button>

          {state.designOverrides && (
            <button onClick={clearDesign} className="btn-ghost">
              <Icon name="refresh" size={16} />
              ביטול העיצוב האישי
            </button>
          )}
        </div>

        {state.designOverrides?.explanation && (
          <div className="note-box mt-4 flex items-start gap-2">
            <Icon name="check-circle" size={16} />
            <span>{state.designOverrides.explanation}</span>
          </div>
        )}
      </div>

      {/* Live preview — uses the exact same style tokens as the real greeting page */}
      <div>
        <p className="field-label">תצוגה חיה — כך תיראה הברכה שלכם</p>
        <div
          className="p-6 sm:p-10 rounded-xl transition-all"
          style={{ background: style.pageBackground }}
        >
          <div className="max-w-md mx-auto transition-all relative">
            {style.pattern && (
              <div
                className="absolute inset-x-0 top-0 h-3 rounded-full"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(191,85,57,0.35) 1.5px, transparent 1.5px)',
                  backgroundSize: '10px 10px',
                }}
              />
            )}

            <div className="relative aspect-video overflow-hidden rounded-2xl">
              {state.mediaFiles?.length > 0 ? (
                isVideoFile(state.mediaFiles[0]) ? (
                  <video
                    src={state.mediaFiles[0]}
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      e.currentTarget.currentTime = Math.min(0.1, e.currentTarget.duration || 0.1);
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={state.mediaFiles[0]}
                    alt="תצוגה מקדימה"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: style.cardBorder + '40' }}
                >
                  <span style={{ color: style.eventColor }}>
                    <Icon name="image" size={32} />
                  </span>
                </div>
              )}
              {style.heroOverlay && (
                <div className="absolute inset-0" style={{ background: style.heroOverlay }} />
              )}

              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(20, 17, 14, 0.75)', color: '#fff' }}
              >
                <Icon name="lock" size={12} />
                נעולה עד לאישור
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <h3
                className="text-2xl font-extrabold"
                style={{ color: style.pageNameColor ?? style.nameColor }}
              >
                {state.recipientName || 'שם הנמען'}
              </h3>
              <p className="font-medium" style={{ color: style.pageEventColor ?? style.eventColor }}>
                {state.eventType || 'סוג האירוע'}
              </p>
              <p
                className="text-sm leading-relaxed line-clamp-3"
                style={{ color: style.pageBodyColor ?? style.bodyColor }}
              >
                {state.aiText?.fullGreeting ||
                  'נוסח הברכה המלא יופיע כאן לאחר שתייצרו אותו בשלב הקודם'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
