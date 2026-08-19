'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { track } from '@/lib/v2/analytics';

gsap.registerPlugin(useGSAP);

interface Props {
  slug: string;
  recipientName: string;
  greetingId?: string;
}

/** The WhatsApp message is the product's main distribution channel. */
function whatsappText(recipientName: string, url: string): string {
  return `🎁 ${recipientName}, הכנתי לך הפתעה מיוחדת…\n\nפתח/י כאן ❤️\n${url}`;
}

export default function SharePanel({ slug, recipientName, greetingId }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // The origin is a browser-only value. useSyncExternalStore is the
  // idiomatic way to read one: it gives the server an explicit snapshot
  // instead of setting state from an effect after hydration.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ''
  );
  const url = origin ? `${origin}/g/${slug}` : '';

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        '[data-share] > *',
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.3)' }
      );
    },
    { scope: rootRef }
  );

  const onShared = (channel: string) => {
    track('greeting_shared', { greetingId, slug, props: { channel } });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onShared('copy');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the input below is selectable as a fallback.
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `הפתעה ל${recipientName}`,
        text: whatsappText(recipientName, ''),
        url,
      });
      onShared('native');
    } catch {
      // User dismissed the sheet.
    }
  };

  return (
    <div ref={rootRef} className="text-center">
      <div data-share className="flex flex-col items-center">
        <div className="text-6xl mb-4">🎉</div>

        <h1
          className="font-extrabold mb-3"
          style={{ fontSize: 'clamp(1.8rem, 6.5vw, 2.6rem)', color: 'var(--v2-ink)' }}
        >
          ההפתעה מוכנה!
        </h1>

        <p className="mb-8" style={{ color: 'var(--v2-ink-soft)' }}>
          שלחו את הלינק ל{recipientName} — וזהו
        </p>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappText(recipientName, url))}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShared('whatsapp')}
          className="v2-btn w-full text-lg mb-3"
          style={{ background: '#25D366', color: '#fff' }}
        >
          שליחה בוואטסאפ
        </a>

        <button
          type="button"
          onClick={copy}
          className="v2-btn v2-btn-ghost w-full text-lg mb-3"
        >
          {copied ? '✓ הלינק הועתק' : '🔗 העתקת הלינק'}
        </button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={nativeShare}
            className="v2-btn v2-btn-ghost w-full text-lg mb-6"
          >
            📤 שיתוף
          </button>
        )}

        <div
          className="w-full rounded-2xl px-4 py-3 mb-6"
          style={{
            background: 'var(--v2-surface)',
            border: '1.5px solid var(--v2-surface-border)',
          }}
        >
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            dir="ltr"
            className="w-full bg-transparent text-sm text-center"
            style={{ color: 'var(--v2-ink)', outline: 'none' }}
            aria-label="הלינק לברכה"
          />
        </div>

        <a
          href={`/g/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold underline underline-offset-4"
          style={{ color: 'var(--v2-accent)' }}
        >
          👀 צפייה בהפתעה כפי שהיא נראית
        </a>
      </div>
    </div>
  );
}
