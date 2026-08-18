'use client';

interface StepProps {
  state: any;
  updateState: (updates: any) => void;
}

const RELATIONSHIPS = ['אמא', 'אבא', 'אח', 'אחות', 'בן/בת זוג', 'חבר/ה', 'סבא', 'סבתא', 'בוס', 'קולגה'];

/** Each event gets its own accent so the picker reads as a colourful palette. */
const EVENT_TYPES: { label: string; color: string; soft: string }[] = [
  { label: 'יום הולדת', color: 'var(--c-amber)', soft: 'var(--c-amber-soft)' },
  { label: 'חתונה', color: 'var(--c-pink)', soft: 'var(--c-pink-soft)' },
  { label: 'סיום לימודים', color: 'var(--c-blue)', soft: 'var(--c-blue-soft)' },
  { label: 'גיוס לצה״ל', color: 'var(--c-green)', soft: 'var(--c-green-soft)' },
  { label: 'הצלחה', color: 'var(--c-teal)', soft: 'var(--c-teal-soft)' },
  { label: 'הולדת תינוק', color: 'var(--c-purple)', soft: 'var(--c-purple-soft)' },
  { label: 'מסיבה', color: 'var(--primary)', soft: 'var(--primary-soft)' },
];

export default function Step1Details({ state, updateState }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">פרטי הברכה</h2>
        <p className="section-subtitle">
          ספרו לנו למי הברכה ולכבוד מה — ומכאן נבנה משהו אישי באמת
        </p>
      </div>

      <div>
        <label htmlFor="recipient-name" className="field-label">
          שם הנמען
        </label>
        <input
          id="recipient-name"
          type="text"
          value={state.recipientName}
          onChange={(e) => updateState({ recipientName: e.target.value })}
          placeholder="לדוגמה: קובי"
          className="input-field"
        />
      </div>

      <div>
        <span className="field-label">מגדר הנמען</span>
        <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)' }}>
          כדי שהברכה תנוסח בלשון נכונה (זכר/נקבה)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'male', label: 'זכר' },
            { value: 'female', label: 'נקבה' },
          ].map((option) => {
            const isSelected = state.recipientGender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateState({ recipientGender: option.value })}
                className="chip !border-2"
                style={{
                  borderColor: 'var(--primary)',
                  background: isSelected ? 'var(--primary)' : 'var(--primary-soft)',
                  color: isSelected ? '#fff' : 'var(--primary)',
                  boxShadow: isSelected ? '0 0 0 3px var(--primary-soft)' : 'none',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="field-label">מה הקשר שלכם לנמען/ת</span>
        <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)' }}>
          כדי שהברכה תישמע כאילו נכתבה באמת מכם
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {RELATIONSHIPS.map((rel) => {
            const isSelected = state.relationship === rel;
            return (
              <button
                key={rel}
                type="button"
                onClick={() => updateState({ relationship: rel })}
                className="chip !border-2"
                style={{
                  borderColor: 'var(--primary)',
                  background: isSelected ? 'var(--primary)' : 'var(--primary-soft)',
                  color: isSelected ? '#fff' : 'var(--primary)',
                  boxShadow: isSelected ? '0 0 0 3px var(--primary-soft)' : 'none',
                }}
              >
                {rel}
              </button>
            );
          })}
        </div>
        <input
          id="relationship-other"
          type="text"
          value={state.relationship}
          onChange={(e) => updateState({ relationship: e.target.value })}
          placeholder="או הקלידו קשר אחר (לדוגמה: דודה, מנהל, שכן)"
          className="input-field"
        />
      </div>

      <div>
        <span className="field-label">סוג האירוע</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EVENT_TYPES.map((event) => {
            const isSelected = state.eventType === event.label;
            return (
              <button
                key={event.label}
                onClick={() => updateState({ eventType: event.label })}
                className="chip !border-2"
                style={{
                  borderColor: event.color,
                  background: isSelected ? event.color : event.soft,
                  color: isSelected ? '#fff' : event.color,
                  boxShadow: isSelected ? `0 0 0 3px ${event.soft}` : 'none',
                }}
              >
                {event.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="greeting-theme" className="field-label">
          נושא או תחביב
        </label>
        <input
          id="greeting-theme"
          type="text"
          value={state.theme}
          onChange={(e) => updateState({ theme: e.target.value })}
          placeholder="לדוגמה: טיולים, ספורט, טכנולוגיה"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="user-notes" className="field-label">
          הערות נוספות (לא חובה)
        </label>
        <textarea
          id="user-notes"
          value={state.userNotes}
          onChange={(e) => updateState({ userNotes: e.target.value })}
          placeholder="יש משהו מיוחד שחשוב שהברכה תכלול? ספרו לנו כאן"
          rows={4}
          className="input-field resize-none"
        />
      </div>
    </div>
  );
}
