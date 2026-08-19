'use client';

import { RELATIONSHIPS, TONES } from '@/lib/v2/types';

export interface DetailsValue {
  recipientName: string;
  relationship: string;
  recipientAge: string;
  aboutThem: string;
  sharedMemory: string;
  senderName: string;
  tone: string;
}

interface Props {
  value: DetailsValue;
  onChange: (patch: Partial<DetailsValue>) => void;
  error?: string | null;
}

/**
 * Deliberately short. Only the name is required — everything else makes the
 * result better but never blocks someone from finishing in under a minute.
 */
export default function DetailsForm({ value, onChange, error }: Props) {
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
            value={value.recipientName}
            onChange={(e) => onChange({ recipientName: e.target.value })}
            placeholder="לדוגמה: נועה"
            maxLength={60}
            autoComplete="off"
          />
        </div>

        <div>
          <span className="v2-label">מה הקשר שלך אליו/אליה?</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {RELATIONSHIPS.map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => onChange({ relationship: rel })}
                data-selected={value.relationship === rel}
                className="v2-choice !py-3 text-sm font-semibold"
              >
                {rel}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="v2-label" htmlFor="v2-age">
              גיל <span style={{ color: 'var(--v2-ink-soft)', fontWeight: 400 }}>(לא חובה)</span>
            </label>
            <input
              id="v2-age"
              className="v2-field"
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
              value={value.senderName}
              onChange={(e) => onChange({ senderName: e.target.value })}
              placeholder="מי שולח/ת?"
              maxLength={60}
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label className="v2-label" htmlFor="v2-about">
            ספר/י לנו עליו/עליה
          </label>
          <p className="v2-hint">מה שתכתבו כאן הוא מה שיהפוך את הברכה לאישית באמת</p>
          <textarea
            id="v2-about"
            className="v2-field resize-none"
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
