'use client';

import { useState } from 'react';
import {
  BUDGETS,
  Gift,
  GIFT_KIND_META,
  GiftSuggestion,
  INTERESTS,
  InterestId,
} from '@/lib/v2/gifts';

/**
 * The gift step.
 *
 * Suggestions are category-level and explicitly *not* purchasable here — the
 * sender brings the actual voucher/code/link. That's an honest reflection of
 * having no payment or supplier integration yet, rather than a fake checkout.
 */

type Phase = 'ask' | 'choosing' | 'details';

interface Props {
  recipientName: string;
  aboutThem: string;
  sharedMemory: string;
  gift: Gift | null;
  onChange: (gift: Gift | null) => void;
  onDone: () => void;
  onSkip: () => void;
}

export default function GiftStep({
  recipientName,
  aboutThem,
  sharedMemory,
  gift,
  onChange,
  onDone,
  onSkip,
}: Props) {
  const [phase, setPhase] = useState<Phase>(gift ? 'details' : 'ask');
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [customBudget, setCustomBudget] = useState('');
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (id: InterestId) =>
    setInterests((cur) =>
      cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]
    );

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/gift-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests,
          budget: budget ?? (customBudget ? Number(customBudget) : undefined),
          recipientName,
          useAI: true,
          aboutThem,
          sharedMemory,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        suggestions?: GiftSuggestion[];
        reason?: string;
      } | null;

      if (!res.ok || !data?.suggestions) throw new Error();
      setSuggestions(data.suggestions);
      setReason(data.reason ?? '');
      setPhase('choosing');
    } catch {
      setError('לא הצלחנו לטעון רעיונות — נסו שוב');
    } finally {
      setLoading(false);
    }
  };

  const pick = (s: GiftSuggestion) => {
    onChange({
      kind: s.kind,
      title: s.title,
      description: s.description,
      emoji: s.emoji,
      amount: s.amount,
      currency: 'ILS',
      note: '',
      code: '',
      url: s.checkoutUrl ?? '',
      imageUrl: '',
      provider: s.provider ?? '',
    });
    setPhase('details');
  };

  const patch = (p: Partial<Gift>) => gift && onChange({ ...gift, ...p });

  /* ---------------- Ask ---------------- */

  if (phase === 'ask') {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎁</div>
          <h1
            className="font-extrabold mb-2"
            style={{ fontSize: 'clamp(1.7rem, 6.5vw, 2.4rem)', color: 'var(--v2-ink)' }}
          >
            רוצים להוסיף גם מתנה?
          </h1>
          <p style={{ color: 'var(--v2-ink-soft)' }}>
            היא תתגלה רק בסוף — אחרי שהם קראו הכול
          </p>
        </div>

        <div>
          <span className="v2-label">מה {recipientName || 'הוא/היא'} אוהב/ת?</span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-7">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => toggleInterest(i.id)}
                data-selected={interests.includes(i.id)}
                className="v2-choice"
              >
                <span className="text-2xl">{i.emoji}</span>
                <span className="text-[11px] font-semibold leading-tight">{i.label}</span>
              </button>
            ))}
          </div>

          <span className="v2-label">תקציב</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-3">
            {BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBudget(b);
                  setCustomBudget('');
                }}
                data-selected={budget === b}
                className="v2-choice !py-3"
              >
                <span className="text-sm font-bold">₪{b}</span>
              </button>
            ))}
            <input
              className="v2-field !py-2 text-center text-sm"
              value={customBudget}
              onChange={(e) => {
                setCustomBudget(e.target.value.replace(/\D/g, '').slice(0, 6));
                setBudget(undefined);
              }}
              placeholder="אחר"
              inputMode="numeric"
              aria-label="תקציב אחר"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-center font-semibold mb-4" style={{ color: '#c62828' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onSkip} className="v2-btn v2-btn-ghost">
            בלי מתנה
          </button>
          <button
            type="button"
            onClick={() => void loadSuggestions()}
            disabled={loading}
            className="v2-btn v2-btn-primary flex-1 text-lg"
          >
            {loading ? 'מחפשים רעיונות…' : '✨ מצאו לי רעיונות'}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Choosing ---------------- */

  if (phase === 'choosing') {
    return (
      <div>
        <h1
          className="font-extrabold text-center mb-2"
          style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--v2-ink)' }}
        >
          מצאנו כמה רעיונות ❤️
        </h1>
        <p className="text-center mb-6" style={{ color: 'var(--v2-ink-soft)' }}>
          {reason || `רעיונות שמתאימים ל${recipientName || 'מי שתבחרו'}`}
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
              className="flex items-center gap-4 rounded-2xl p-4 text-start transition-transform hover:-translate-y-0.5"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
              }}
            >
              <span className="text-3xl flex-shrink-0">{s.emoji}</span>
              <span className="flex-1">
                <span className="block font-extrabold" style={{ color: 'var(--v2-ink)' }}>
                  {s.title}
                </span>
                <span className="block text-sm" style={{ color: 'var(--v2-ink-soft)' }}>
                  {s.description}
                  {s.amount ? ` · ₪${s.amount}` : ''}
                </span>
              </span>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                style={{
                  background: s.fulfillable ? 'var(--v2-accent)' : 'var(--v2-accent-soft)',
                  color: s.fulfillable ? '#fff' : 'var(--v2-accent)',
                }}
              >
                {s.fulfillable ? 'לרכישה' : 'רעיון'}
              </span>
            </button>
          ))}
        </div>

        <div
          className="rounded-2xl px-4 py-3 mb-6 text-sm text-center"
          style={{ background: 'var(--v2-accent-soft)', color: 'var(--v2-ink)' }}
        >
          עדיין אין לנו חיבור ישיר לספקים — בוחרים רעיון, רוכשים את השובר איפה
          שנוח לכם, ומדביקים כאן את הקוד או הקישור.
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setPhase('ask')} className="v2-btn v2-btn-ghost">
            חזרה
          </button>
          <button type="button" onClick={onSkip} className="v2-btn v2-btn-ghost flex-1">
            דלגו
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Details ---------------- */

  if (!gift) return null;

  const meta = GIFT_KIND_META[gift.kind];

  return (
    <div>
      <h1
        className="font-extrabold text-center mb-2"
        style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--v2-ink)' }}
      >
        {gift.emoji || meta.emoji} {gift.title}
      </h1>
      <p className="text-center mb-7" style={{ color: 'var(--v2-ink-soft)' }}>
        הוסיפו את פרטי המימוש — הם יתגלו רק בתוך קופסת המתנה
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="v2-label" htmlFor="gift-title">
            שם המתנה
          </label>
          <input
            id="gift-title"
            className="v2-field"
            value={gift.title}
            onChange={(e) => patch({ title: e.target.value })}
            maxLength={120}
          />
        </div>

        <div>
          <label className="v2-label" htmlFor="gift-amount">
            סכום <span style={{ fontWeight: 400, color: 'var(--v2-ink-soft)' }}>(לא חובה)</span>
          </label>
          <input
            id="gift-amount"
            className="v2-field"
            value={gift.amount ?? ''}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              patch({ amount: v ? Number(v) : undefined });
            }}
            placeholder="150"
            inputMode="numeric"
            dir="ltr"
          />
        </div>

        <div>
          <label className="v2-label" htmlFor="gift-code">
            קוד מימוש <span style={{ fontWeight: 400, color: 'var(--v2-ink-soft)' }}>(לא חובה)</span>
          </label>
          <input
            id="gift-code"
            className="v2-field"
            value={gift.code ?? ''}
            onChange={(e) => patch({ code: e.target.value })}
            placeholder="ABC-123-XYZ"
            dir="ltr"
            maxLength={120}
          />
        </div>

        <div>
          <label className="v2-label" htmlFor="gift-url">
            קישור למימוש <span style={{ fontWeight: 400, color: 'var(--v2-ink-soft)' }}>(לא חובה)</span>
          </label>
          <input
            id="gift-url"
            className="v2-field"
            value={gift.url ?? ''}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://…"
            dir="ltr"
            maxLength={600}
          />
        </div>

        <div>
          <label className="v2-label" htmlFor="gift-note">
            משפט אישי שילווה את המתנה
          </label>
          <textarea
            id="gift-note"
            className="v2-field resize-none"
            rows={3}
            value={gift.note ?? ''}
            onChange={(e) => patch({ note: e.target.value })}
            placeholder="כי מגיע לך ערב בלי לחשוב על כלום"
            maxLength={300}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setPhase('ask');
          }}
          className="v2-btn v2-btn-ghost"
        >
          החליפו מתנה
        </button>
        <button type="button" onClick={onDone} className="v2-btn v2-btn-primary flex-1 text-lg">
          הוסיפו את המתנה
        </button>
      </div>
    </div>
  );
}
