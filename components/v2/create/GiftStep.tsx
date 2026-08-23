'use client';

import { useState } from 'react';
import {
  Gift,
  GIFT_KIND_META,
  GiftSuggestion,
  INTERESTS,
  InterestId,
  interestLabel,
} from '@/lib/v2/gifts';
import { compressImage } from '@/lib/v2/imageCompress';
import BackButton from '@/components/v2/BackButton';
import BudgetCalculator from './BudgetCalculator';

/**
 * The gift step.
 *
 * Category suggestions are explicitly *not* purchasable here — the sender
 * brings the actual voucher/code/link. That's an honest reflection of having
 * no payment or supplier integration yet, rather than a fake checkout.
 *
 * Real named businesses only ever appear in the `places` half of the results,
 * and only because they come back from Google Places with real coordinates
 * (see `lib/v2/places.ts`). Their distances are measured, not estimated.
 */

/** A place Google returned, as the client sees it. */
interface PlaceResult {
  id: string;
  name: string;
  address: string;
  priceLevel?: number;
  priceLabel?: string;
  /** `unknown` means Google publishes no price band — never assume it fits. */
  priceMatch: 'fits' | 'unknown';
  rating?: number;
  ratingCount?: number;
  distanceKm: number;
  outsideChosenArea: boolean;
  mapsUrl: string;
}

/** `choose` is the four-way fork; the rest belong to the AI-helper branch. */
type Phase = 'choose' | 'ask' | 'budget' | 'choosing' | 'details';

const PLACES_ERRORS: Record<string, string> = {
  PLACES_NOT_CONFIGURED:
    'חיפוש עסקים לפי מיקום עדיין לא מחובר — בינתיים הנה רעיונות לפי הנושא והתקציב.',
  PLACES_DENIED:
    'חיפוש עסקים לפי מיקום עדיין לא פעיל — בינתיים הנה רעיונות לפי הנושא והתקציב.',
  PLACES_NO_LOCATION: 'לא מצאנו את המקום הזה — נסו עיר או שכונה אחרת.',
  PLACES_UNAVAILABLE: 'חיפוש העסקים לא זמין כרגע — הנה רעיונות לפי הנושא והתקציב.',
};

interface Props {
  draftId: string;
  recipientName: string;
  aboutThem: string;
  sharedMemory: string;
  gift: Gift | null;
  onChange: (gift: Gift | null) => void;
  onDone: () => void;
  onSkip: () => void;
}

export default function GiftStep({
  draftId,
  recipientName,
  aboutThem,
  sharedMemory,
  gift,
  onChange,
  onDone,
  onSkip,
}: Props) {
  const [phase, setPhase] = useState<Phase>(gift ? 'details' : 'choose');
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [origin, setOrigin] = useState<string | null>(null);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardUploading, setCardUploading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const toggleInterest = (id: InterestId) =>
    setInterests((cur) =>
      cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]
    );

  /** Straight to the redemption form with the kind already decided. */
  const startWithKind = (kind: Gift['kind']) => {
    const meta = GIFT_KIND_META[kind];
    onChange({
      kind,
      title: meta.label,
      description: meta.hint,
      emoji: meta.emoji,
      amount: undefined,
      currency: 'ILS',
      note: '',
      code: '',
      url: '',
      imageUrl: '',
      provider: kind === 'buyme' ? 'BUYME' : '',
    });
    setPhase('details');
  };

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/gift-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests,
          budget,
          location,
          recipientName,
          useAI: true,
          aboutThem,
          sharedMemory,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        suggestions?: GiftSuggestion[];
        places?: PlaceResult[];
        origin?: string | null;
        placesError?: string | null;
        reason?: string;
      } | null;

      if (!res.ok || !data?.suggestions) throw new Error();
      setSuggestions(data.suggestions);
      setPlaces(data.places ?? []);
      setOrigin(data.origin ?? null);
      setPlacesError(data.placesError ?? null);
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

  /** A gift card is often just a photo of the card, so accept one directly
   * here instead of forcing the sender to transcribe the numbers. */
  const uploadCardImage = async (file: File) => {
    setCardUploading(true);
    setCardError(null);
    try {
      let payload: File = file;
      try {
        payload = await compressImage(file);
      } catch {
        // Best-effort — the original still uploads.
      }
      const form = new FormData();
      form.append('file', payload);
      form.append('greetingId', draftId);
      const res = await fetch('/api/upload-media', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as { path?: string };
      if (!res.ok || !data.path) throw new Error();
      patch({ imageUrl: data.path });
    } catch {
      setCardError('ההעלאה נכשלה — נסו שוב');
    } finally {
      setCardUploading(false);
    }
  };

  /* ---------------- Choose (the four-way fork) ---------------- */

  if (phase === 'choose') {
    const OPTIONS: {
      id: string;
      emoji: string;
      title: string;
      body: string;
      badge?: string;
      onPick: () => void;
    }[] = [
      {
        id: 'buyme',
        emoji: '🎁',
        title: 'שובר BUYME',
        body: 'הם בוחרים בעצמם מתוך אלפי עסקים — מסעדות, ספא, חנויות ועוד.',
        onPick: () => startWithKind('buyme'),
      },
      {
        id: 'giftcard',
        emoji: '🎫',
        title: 'כרטיס מתנה',
        body: 'כרטיס דיגיטלי או סכום — מעלים תמונה, מדביקים קוד או קישור.',
        onPick: () => startWithKind('giftcard'),
      },
      {
        id: 'ai',
        emoji: '✨',
        title: 'עזרו לי למצוא מתנה',
        body: 'בוחרים נושא, תקציב ומיקום — ואנחנו מוצאים עסקים אמיתיים לידכם.',
        badge: 'מותאם אישית',
        onPick: () => setPhase('ask'),
      },
      {
        id: 'none',
        emoji: '💌',
        title: 'בלי מתנה',
        body: 'הברכה עומדת מצוין בפני עצמה — אפשר לשלוח אותה בלי מתנה.',
        onPick: onSkip,
      },
    ];

    return (
      <div>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎁</div>
          <h1
            className="v2-display mb-2"
            style={{ fontSize: 'clamp(1.7rem, 6.5vw, 2.4rem)', color: 'var(--v2-ink)' }}
          >
            רוצים להוסיף גם מתנה?
          </h1>
          <p style={{ color: 'var(--v2-ink-soft)' }}>
            היא תתגלה רק בסוף — אחרי שהם קראו הכול
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={o.onPick}
              className="flex items-start gap-4 rounded-2xl p-5 text-start transition-transform hover:-translate-y-0.5"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
              }}
            >
              <span className="text-3xl flex-shrink-0">{o.emoji}</span>
              <span className="flex-1">
                <span className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-extrabold" style={{ color: 'var(--v2-ink)' }}>
                    {o.title}
                  </span>
                  {o.badge && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--v2-accent)', color: 'var(--v2-on-accent, #fff)' }}
                    >
                      {o.badge}
                    </span>
                  )}
                </span>
                <span
                  className="block text-sm leading-relaxed"
                  style={{ color: 'var(--v2-ink-soft)' }}
                >
                  {o.body}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- Ask (AI helper branch) ---------------- */

  if (phase === 'ask') {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✨</div>
          <h1
            className="v2-display mb-2"
            style={{ fontSize: 'clamp(1.7rem, 6.5vw, 2.4rem)', color: 'var(--v2-ink)' }}
          >
            במה {recipientName || 'הוא/היא'} מתעניין/ת?
          </h1>
          <p style={{ color: 'var(--v2-ink-soft)' }}>
            בחרו נושא אחד או כמה — לפי זה נחפש
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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

        <div className="flex items-center gap-3 mt-8">
          <BackButton onClick={() => setPhase('choose')} />
          <button
            type="button"
            onClick={() => setPhase('budget')}
            disabled={interests.length === 0}
            className="v2-btn v2-btn-primary flex-1 text-lg"
          >
            הבא — תקציב ומיקום →
          </button>
        </div>

        {interests.length === 0 && (
          <p className="text-sm text-center mt-3" style={{ color: 'var(--v2-ink-soft)' }}>
            בחרו לפחות נושא אחד כדי שנדע לאן לכוון
          </p>
        )}
      </div>
    );
  }

  /* ---------------- Budget + location ---------------- */

  if (phase === 'budget') {
    return (
      <div>
        <div className="text-center mb-7">
          <h1
            className="v2-display mb-2"
            style={{ fontSize: 'clamp(1.7rem, 6.5vw, 2.4rem)', color: 'var(--v2-ink)' }}
          >
            כמה, ואיפה?
          </h1>
          <p style={{ color: 'var(--v2-ink-soft)' }}>
            {interests.map(interestLabel).join(' · ')}
          </p>
        </div>

        <BudgetCalculator value={budget} onChange={setBudget} />

        <div className="mt-7">
          <label className="v2-label" htmlFor="gift-location">
            איפה לחפש?
          </label>
          <p className="v2-hint">עיר או שכונה — נחפש שם ובסביבה הקרובה</p>
          <input
            id="gift-location"
            className="v2-field"
            dir="rtl"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="תל אביב"
            maxLength={120}
          />
        </div>

        {error && (
          <p className="text-sm text-center font-semibold mt-4" style={{ color: '#c62828' }}>
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 mt-8">
          <BackButton onClick={() => setPhase('ask')} />
          <button
            type="button"
            onClick={() => void loadSuggestions()}
            disabled={loading || !budget}
            className="v2-btn v2-btn-primary flex-1 text-lg"
          >
            {loading ? 'מחפשים…' : '✨ מצאו לי מתנה'}
          </button>
        </div>

        {!budget && (
          <p className="text-sm text-center mt-3" style={{ color: 'var(--v2-ink-soft)' }}>
            הזינו תקציב כדי להמשיך
          </p>
        )}
      </div>
    );
  }

  /* ---------------- Choosing ---------------- */

  if (phase === 'choosing') {
    return (
      <div>
        <h1
          className="v2-display text-center mb-2"
          style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--v2-ink)' }}
        >
          מצאנו כמה רעיונות ❤️
        </h1>
        {/* Lead with what they actually ticked, so it's obvious the results
          * follow their choice rather than the model's reading of the notes. */}
        <p className="text-center mb-2 font-semibold" style={{ color: 'var(--v2-ink)' }}>
          לפי מה שבחרתם:{' '}
          {INTERESTS.filter((i) => interests.includes(i.id))
            .map((i) => `${i.emoji} ${i.label}`)
            .join(' · ')}
        </p>
        <p className="text-center mb-1" style={{ color: 'var(--v2-ink-soft)' }}>
          {budget ? `עד ₪${budget}` : ''}
          {budget && origin ? ' · ' : ''}
          {origin || ''}
        </p>
        {reason && (
          <p className="text-center mb-6 text-sm" style={{ color: 'var(--v2-ink-soft)' }}>
            {reason}
          </p>
        )}
        {!reason && <div className="mb-6" />}

        {placesError && (
          <div
            className="rounded-2xl px-4 py-3 mb-5 text-sm text-center"
            style={{ background: 'var(--v2-accent-soft)', color: 'var(--v2-ink)' }}
          >
            {PLACES_ERRORS[placesError] ?? PLACES_ERRORS.PLACES_UNAVAILABLE}
          </div>
        )}

        {/* A location was searched successfully and simply nothing came back
          * within the budget — say so, rather than leaving a silent gap that
          * reads as "the search is broken". */}
        {!placesError && origin && places.length === 0 && (
          <div
            className="rounded-2xl px-4 py-3 mb-5 text-sm text-center"
            style={{ background: 'var(--v2-accent-soft)', color: 'var(--v2-ink)' }}
          >
            לא מצאנו עסקים ב{origin} שמתאימים לתקציב של ₪{budget}. אפשר להעלות את
            התקציב, לבחור נושא נוסף — או לבחור אחד מסוגי המתנה שלמטה.
          </div>
        )}

        {/* ---- Real businesses, with measured distances ---- */}
        {places.length > 0 && (
          <div className="mb-8">
            <span className="v2-label">עסקים אמיתיים לידכם</span>
            <div className="flex flex-col gap-3">
              {places.map((p) => (
                <a
                  key={p.id}
                  href={p.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: 'var(--v2-surface)',
                    border: '1.5px solid var(--v2-surface-border)',
                  }}
                >
                  <span className="flex-1">
                    <span
                      className="block font-extrabold mb-0.5"
                      style={{ color: 'var(--v2-ink)' }}
                    >
                      {p.name}
                    </span>
                    <span className="block text-sm" style={{ color: 'var(--v2-ink-soft)' }}>
                      {p.address}
                    </span>
                    <span
                      className="flex items-center gap-2 flex-wrap mt-1.5 text-xs"
                      style={{ color: 'var(--v2-ink-soft)' }}
                    >
                      {/* The distance is measured from the coordinates Google
                        * returned, so it is safe to state as a fact. */}
                      <span
                        className="font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: p.outsideChosenArea
                            ? 'var(--v2-accent-soft)'
                            : 'transparent',
                          color: p.outsideChosenArea
                            ? 'var(--v2-accent)'
                            : 'var(--v2-ink-soft)',
                        }}
                      >
                        📍 {p.distanceKm.toFixed(1)} ק״מ
                        {p.outsideChosenArea ? ' — מחוץ לעיר שבחרתם' : ''}
                      </span>
                      {p.rating != null && (
                        <span>
                          ⭐ {p.rating}
                          {p.ratingCount ? ` (${p.ratingCount})` : ''}
                        </span>
                      )}
                      {/* Budget fit is stated only where Google actually
                        * publishes a price band. Everywhere else it says so,
                        * rather than implying the budget covers it. */}
                      {p.priceMatch === 'fits' ? (
                        <span
                          className="font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'var(--v2-accent-soft)',
                            color: 'var(--v2-accent)',
                          }}
                        >
                          ✓ מתאים לתקציב
                          {p.priceLabel ? ` · ${p.priceLabel}` : ''}
                        </span>
                      ) : (
                        <span>מחיר לא מפורסם — כדאי לבדוק מול העסק</span>
                      )}
                    </span>
                  </span>
                </a>
              ))}
            </div>
            <p className="v2-hint mt-3">
              נתוני העסקים והמרחקים מגיעים מ-Google Maps. בודקים זמינות ומחיר מול
              העסק, רוכשים את השובר, ומדביקים כאן את הקוד.
            </p>
          </div>
        )}

        {suggestions.length > 0 && (
          <span className="v2-label">סוגי מתנה שמתאימים</span>
        )}
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

        <div className="flex items-center gap-3">
          <BackButton onClick={() => setPhase('budget')} />
          <button
            type="button"
            onClick={() => setPhase('choose')}
            className="v2-btn v2-btn-ghost flex-1"
          >
            סוג מתנה אחר
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
        className="v2-display text-center mb-2"
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
            dir="rtl"
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
          <span className="v2-label">
            תמונת הכרטיס{' '}
            <span style={{ fontWeight: 400, color: 'var(--v2-ink-soft)' }}>(לא חובה)</span>
          </span>
          <p className="v2-hint">צילום של הכרטיס או השובר — במקום להקליד את המספרים</p>

          {gift.imageUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={gift.imageUrl}
                alt="הכרטיס שהעליתם"
                className="w-24 h-16 object-cover rounded-xl"
                style={{ border: '1.5px solid var(--v2-surface-border)' }}
              />
              <button
                type="button"
                onClick={() => patch({ imageUrl: '' })}
                className="v2-btn v2-btn-ghost"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                הסירו
              </button>
            </div>
          ) : (
            <label
              className="v2-btn v2-btn-ghost inline-flex"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem', cursor: 'pointer' }}
            >
              {cardUploading ? 'מעלים…' : '📷 העלו תמונה'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={cardUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadCardImage(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {cardError && (
            <p className="text-sm font-semibold mt-2" style={{ color: '#c62828' }}>
              {cardError}
            </p>
          )}
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
            dir="rtl"
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
            setPhase('choose');
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
