'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/**
 * The wait is part of the experience — it's where the product earns its
 * "magic" feeling. The steps are paced so the last one never completes on
 * its own: it holds until the real request resolves.
 */

const STEPS = [
  { emoji: '🧠', label: 'כותב ברכה אישית' },
  { emoji: '🎨', label: 'מתאים עיצוב' },
  { emoji: '💫', label: 'מוסיף אנימציות' },
  { emoji: '🎵', label: 'מתאים מוזיקה' },
];

interface Props {
  /** Flips true the moment the greeting is ready; plays the finale. */
  done: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function Generating({ done, error, onRetry }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (error) return;
    // Advance through the first three quickly, then park on the last one.
    const timers = [
      window.setTimeout(() => setStep(1), 1100),
      window.setTimeout(() => setStep(2), 2300),
      window.setTimeout(() => setStep(3), 3400),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [error]);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.to('[data-orb]', {
        scale: 1.18,
        opacity: 0.85,
        duration: 1.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
      gsap.to('[data-spark]', {
        rotation: 360,
        duration: 9,
        ease: 'none',
        repeat: -1,
        transformOrigin: '50% 50%',
      });
    },
    { scope: rootRef }
  );

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-5">😕</div>
        <h2 className="font-extrabold text-2xl mb-3" style={{ color: 'var(--v2-ink)' }}>
          לא הצלחנו ליצור את ההפתעה
        </h2>
        <p className="mb-8" style={{ color: 'var(--v2-ink-soft)' }}>
          {error}
        </p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="v2-btn v2-btn-primary">
            נסו שוב
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="text-center py-12 sm:py-20">
      <div className="relative mx-auto mb-10" style={{ width: 150, height: 150 }}>
        <div
          data-orb
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, var(--v2-accent) 0%, transparent 70%)',
            opacity: 0.55,
            filter: 'blur(6px)',
          }}
        />
        <div
          data-spark
          className="absolute inset-0 flex items-center justify-center text-5xl"
          aria-hidden="true"
        >
          ✨
        </div>
      </div>

      <h2
        className="font-extrabold mb-8"
        style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--v2-ink)' }}
      >
        {done ? '🎉 ההפתעה מוכנה!' : '✨ בונה את ההפתעה…'}
      </h2>

      <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
        {STEPS.map((s, i) => {
          const state = done || i < step ? 'done' : i === step ? 'active' : 'idle';
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
              style={{
                background:
                  state === 'idle'
                    ? 'transparent'
                    : 'linear-gradient(176deg, var(--v2-surface) 0%, var(--v2-surface-2, var(--v2-surface)) 100%)',
                border: `1px solid ${
                  state === 'active' ? 'var(--v2-gold, var(--v2-accent))' : 'var(--v2-surface-border)'
                }`,
                boxShadow: state === 'idle' ? 'none' : '0 10px 26px -20px rgba(40,26,20,.5)',
                opacity: state === 'idle' ? 0.45 : 1,
              }}
            >
              <span className="text-xl">{s.emoji}</span>
              <span
                className="font-semibold text-sm flex-1 text-start"
                style={{ color: 'var(--v2-ink)' }}
              >
                {s.label}
              </span>
              {state === 'done' && (
                <span style={{ color: 'var(--v2-accent)' }} aria-hidden="true">
                  ✓
                </span>
              )}
              {state === 'active' && (
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{
                    border: '2px solid var(--v2-accent)',
                    borderTopColor: 'transparent',
                    animation: 'v2spin 0.7s linear infinite',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes v2spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
