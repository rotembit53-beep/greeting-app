'use client';

import { useState } from 'react';
import {
  GENDER_OPTIONS,
  GenderValue,
  RELATIONSHIPS,
  TONES,
} from '@/lib/v2/types';

/** Every preset but the catch-all — that one gets its own free-text chip
 * below rather than sitting in the grid as a dead-end choice. */
const PRESET_RELATIONSHIPS = RELATIONSHIPS.filter((rel) => rel !== 'אחר');

export interface DetailsValue {
  recipientName: string;
  recipientGender: GenderValue;
  relationship: string;
  recipientAge: string;
  aboutThem: string;
  sharedMemory: string;
  senderName: string;
  senderGender: GenderValue;
  tone: string;
}

interface Props {
  value: DetailsValue;
  onChange: (patch: Partial<DetailsValue>) => void;
  error?: string | null;
}

/**
 * The one answer the AI cannot guess its way out of: Hebrew inflects for
 * gender in both directions, so the recipient's gender sets every "you" form
 * and the sender's sets every "I" form.
 *
 * Checkboxes rather than a required radio pair — picking the selected option
 * again clears it, because "prefer not to say" has to stay reachable and the
 * flow only ever hard-requires a name. The prompt handles the empty case.
 */
function GenderChoice({
  legend,
  hint,
  name,
  labelFor,
  value,
  onSelect,
}: {
  legend: string;
  hint: string;
  name: string;
  labelFor: (option: (typeof GENDER_OPTIONS)[number]) => string;
  value: GenderValue;
  onSelect: (next: GenderValue) => void;
}) {
  return (
    <fieldset>
      <legend className="v2-label">{legend}</legend>
      <p className="v2-hint">{hint}</p>
      <div className="flex gap-2.5">
        {GENDER_OPTIONS.map((option) => {
          const checked = value === option.id;
          return (
            <label
              key={option.id}
              data-selected={checked}
              className="v2-choice !flex-row !justify-start !py-3 !px-4 gap-2.5 flex-1 text-sm font-semibold"
            >
              <input
                type="checkbox"
                name={name}
                className="v2-checkbox"
                checked={checked}
                onChange={() => onSelect(checked ? '' : option.id)}
              />
              <span aria-hidden="true">{option.emoji}</span>
              <span>{labelFor(option)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Deliberately short. Only the name is required — everything else makes the
 * result better but never blocks someone from finishing in under a minute.
 */
export default function DetailsForm({ value, onChange, error }: Props) {
  /* Whether "אחר" is the active choice — derived once from the incoming
   * value rather than tracked independently, so a restored draft that
   * already holds a custom relationship opens straight into the free-text
   * chip instead of looking unanswered. Safe to compute only on mount:
   * CreateFlow only ever mounts this component once `value` already holds
   * its final, restored shape. */
  const [customMode, setCustomMode] = useState(
    () => value.relationship !== '' && !PRESET_RELATIONSHIPS.includes(value.relationship as never)
  );
  const [customText, setCustomText] = useState(() => (customMode ? value.relationship : ''));

  return (
    <div>
      <h1
        className="v2-display text-center mb-2"
        style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)', color: 'var(--v2-ink)' }}
      >
        ספרו לנו עליו/עליה
      </h1>
      <p className="text-center mb-8" style={{ color: 'var(--v2-ink-soft)' }}>
        ככל שתספרו יותר, ההפתעה תהיה אישית יותר — אבל מספיק גם שם
      </p>

      {error && (
        <div
          className="mb-5 rounded-2xl px-4 py-3 text-sm font-semibold text-center"
          style={{ background: 'rgba(214,58,46,0.1)', color: '#c62828' }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <label className="v2-label" htmlFor="v2-name">
            למי הברכה? <span style={{ color: 'var(--v2-accent)' }}>*</span>
          </label>
          <input
            id="v2-name"
            className="v2-field"
            dir="rtl"
            value={value.recipientName}
            onChange={(e) => onChange({ recipientName: e.target.value })}
            placeholder="לדוגמה: נועה"
            maxLength={60}
            autoComplete="off"
          />
        </div>

        <GenderChoice
          legend="הברכה מיועדת ל…"
          hint="כדי שכל פנייה בברכה תהיה בלשון הנכונה"
          name="recipient-gender"
          labelFor={(option) => option.recipientLabel}
          value={value.recipientGender}
          onSelect={(next) => onChange({ recipientGender: next })}
        />

        <div>
          <span className="v2-label">מה הקשר שלך אליו/אליה?</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_RELATIONSHIPS.map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  onChange({ relationship: rel });
                }}
                data-selected={!customMode && value.relationship === rel}
                className="v2-choice !py-3 text-sm font-semibold"
              >
                {rel}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomMode(true);
                onChange({ relationship: customText });
              }}
              data-selected={customMode}
              className="v2-choice !py-3 text-sm font-semibold"
            >
              אחר
            </button>
          </div>

          {/* Free text for anything the presets don't cover. The typed value
            * becomes the actual `relationship` sent along — the AI prompt
            * already takes it as plain text, so whatever is written here is
            * exactly what personalizes the greeting. No separate approval
            * step: the moment there's real text, it's in effect. */}
          {customMode && (
            <div className="mt-3">
              <input
                className="v2-field"
                dir="rtl"
                value={customText}
                onChange={(e) => {
                  const next = e.target.value;
                  setCustomText(next);
                  onChange({ relationship: next });
                }}
                placeholder="איך היית מתאר/ת את הקשר? לדוגמה: דודה, שכן/ה, מורה לשעבר"
                maxLength={40}
                autoComplete="off"
                autoFocus
              />
              {customText.trim().length > 1 ? (
                <p className="v2-rel-confirm">
                  ✓ נקלט — ה-AI יתייחס לכם כ<strong>{customText.trim()}</strong> בברכה
                </p>
              ) : (
                <p className="v2-hint">כתבו במילה או שתיים, וזה ישולב בברכה בדיוק כמו שכתוב</p>
              )}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="v2-label" htmlFor="v2-age">
              גיל <span style={{ color: 'var(--v2-ink-soft)', fontWeight: 400 }}>(לא חובה)</span>
            </label>
            <input
              id="v2-age"
              className="v2-field"
              dir="ltr"
              value={value.recipientAge}
              onChange={(e) => onChange({ recipientAge: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              placeholder="29"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="v2-label" htmlFor="v2-sender">
              השם שלך <span style={{ color: 'var(--v2-ink-soft)', fontWeight: 400 }}>(לא חובה)</span>
            </label>
            <input
              id="v2-sender"
              className="v2-field"
              dir="rtl"
              value={value.senderName}
              onChange={(e) => onChange({ senderName: e.target.value })}
              placeholder="מי שולח/ת?"
              maxLength={60}
              autoComplete="off"
            />
          </div>
        </div>

        <GenderChoice
          legend="ואת/ה?"
          hint="הברכה נכתבת בגוף ראשון בשמך — זה מה שקובע את הלשון שלה"
          name="sender-gender"
          labelFor={(option) => option.senderLabel}
          value={value.senderGender}
          onSelect={(next) => onChange({ senderGender: next })}
        />

        <div>
          <label className="v2-label" htmlFor="v2-about">
            ספר/י לנו עליו/עליה
          </label>
          <p className="v2-hint">מה שתכתבו כאן הוא מה שיהפוך את הברכה לאישית באמת</p>
          <textarea
            id="v2-about"
            className="v2-field resize-none"
            dir="rtl"
            rows={4}
            value={value.aboutThem}
            onChange={(e) => onChange({ aboutThem: e.target.value })}
            placeholder="היא מצחיקה, אוהבת לטייל, תמיד עוזרת לי ויש לנו זיכרון מצחיק מהטיול שלנו…"
            maxLength={2000}
          />
        </div>

        <div>
          <label className="v2-label" htmlFor="v2-memory">
            זיכרון משותף{' '}
            <span style={{ color: 'var(--v2-ink-soft)', fontWeight: 400 }}>(לא חובה)</span>
          </label>
          <textarea
            id="v2-memory"
            className="v2-field resize-none"
            dir="rtl"
            rows={3}
            value={value.sharedMemory}
            onChange={(e) => onChange({ sharedMemory: e.target.value })}
            placeholder="הטיול ההוא שבו הלכנו לאיבוד ביער וצחקנו שעתיים…"
            maxLength={2000}
          />
        </div>

        <div>
          <span className="v2-label">סגנון</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {TONES.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => onChange({ tone: tone.id })}
                data-selected={value.tone === tone.id}
                className="v2-choice"
              >
                <span className="text-2xl">{tone.emoji}</span>
                <span className="text-xs font-semibold">{tone.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
