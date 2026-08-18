'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface StepProps {
  state: any;
  updateState: (updates: any) => void;
}

export default function Step5Activation({ state, updateState }: StepProps) {
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!state.aiText) {
      setError('חסר נוסח לברכה — חזרו לשלב 3 וצרו את הטקסט לפני שליחה לאישור');
      return;
    }

    setLoading(true);

    try {
      const saveRes = await fetch('/api/save-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: state.id,
          recipientName: state.recipientName,
          eventType: state.eventType,
          theme: state.theme,
          userNotes: state.userNotes,
          recipientGender: state.recipientGender,
          relationship: state.relationship,
          mediaFiles: state.mediaFiles,
          mediaAudioSettings: state.mediaAudioSettings,
          buyMeLink: state.buyMeLink,
          audioTrack: state.audioTrack,
          aiText: state.aiText,
          giftCard: state.giftCard,
          visualConcept: state.visualConcept,
          designPrompt: state.designPrompt,
          designOverrides: state.designOverrides,
        }),
      });

      if (!saveRes.ok) {
        throw new Error('שמירת הברכה נכשלה, נסו שוב בעוד רגע');
      }

      const res = await fetch('/api/request-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          greetingId: state.id,
          contactName,
          phone,
          email,
        }),
      });

      if (!res.ok) {
        throw new Error('שליחת הבקשה נכשלה, נסו שוב בעוד רגע');
      }

      const data: any = await res.json();
      setEmailSent(data.emailSent !== false);
      setSubmitted(true);
      updateState({ status: 'pending' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center py-6">
        <div>
          <span
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <Icon name="check-circle" size={36} />
          </span>
          <h2 className="section-title">הבקשה נשלחה בהצלחה</h2>
          <p className="section-subtitle max-w-md mx-auto">
            {emailSent
              ? 'שלחנו מייל אישור למנהל המערכת. ברגע שהברכה תאושר, תוכלו לשתף אותה עם מי שרק תרצו.'
              : 'הבקשה נשמרה, אך לא הצלחנו לשלוח מייל אישור למנהל המערכת. ברגע שהברכה תאושר ידנית, תוכלו לשתף אותה עם מי שרק תרצו.'}
          </p>
        </div>

        {!emailSent && (
          <div
            className="p-4 rounded-xl flex items-center gap-3 max-w-md mx-auto"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <Icon name="alert" size={20} />
            <p className="font-medium">שליחת מייל האישור נכשלה — יש לאשר את הברכה ידנית</p>
          </div>
        )}

        <div className="note-box max-w-md mx-auto">
          אנחנו בודקים אוטומטית כל כמה שניות אם הברכה אושרה — אין צורך לרענן את הדף
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">בקשת אישור</h2>
        <p className="section-subtitle">
          השאירו פרטי יצירת קשר כדי שנוכל לעדכן אתכם כשהברכה מאושרת
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="contact-name" className="field-label">
            שם מלא
          </label>
          <input
            id="contact-name"
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            placeholder="לדוגמה: קובי בן דוד"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="field-label">
            טלפון
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="050-1234567"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="field-label">
            דוא״ל
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="kobi@example.com"
            className="input-field"
            dir="ltr"
            style={{ textAlign: 'left' }}
          />
        </div>

        <div className="note-box">
          מנהל המערכת יקבל מייל עם קישור לאישור הברכה בלחיצה אחת
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <Icon name="send" size={18} />
          {loading ? 'שולחים את הבקשה...' : 'שליחת בקשת אישור'}
        </button>
      </form>
    </div>
  );
}
