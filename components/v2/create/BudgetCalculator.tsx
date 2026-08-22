'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

type Key = { label: string; action?: 'clear' | 'back' };

const KEYS: Key[] = [
  { label: '1' },
  { label: '2' },
  { label: '3' },
  { label: '4' },
  { label: '5' },
  { label: '6' },
  { label: '7' },
  { label: '8' },
  { label: '9' },
  { label: 'C', action: 'clear' },
  { label: '0' },
  { label: '⌫', action: 'back' },
];

/**
 * Must not exceed the `budget` ceiling the suggestions API validates against
 * (`app/api/v2/gift-suggestions/route.ts`). Letting the keypad run past it
 * turns a typo into a Zod rejection that reaches the sender as a generic
 * "couldn't load ideas", with nothing pointing at the real cause.
 */
const MAX_BUDGET = 100000;

interface Props {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

/**
 * Budget entry as a physical calculator.
 *
 * A number field would do the job, but the budget is the one figure the
 * sender actually deliberates over — giving it an object to press makes it
 * a decision rather than a form row. The shell carries the wordmark the way
 * real hardware carries a brand plate.
 *
 * The motion is doing two jobs: the readout counts up so a change registers
 * even when one digit moves the total a long way, and each key physically
 * travels so a press is felt as well as read.
 */
export default function BudgetCalculator({ value, onChange }: Props) {
  const [raw, setRaw] = useState(value ? String(value) : '');
  const rootRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  // Kept out of state: the tween needs a stable number to interpolate from,
  // and re-parsing the string mid-flight would make it jump.
  const shown = useRef(value ?? 0);

  const press = (key: Key) => {
    let next = raw;
    if (key.action === 'clear') next = '';
    else if (key.action === 'back') next = raw.slice(0, -1);
    else {
      const candidate = (raw + key.label).replace(/^0+/, '');
      // Silently ignore a digit that would push it past the ceiling, the way
      // a real calculator refuses input past its display width.
      if (Number(candidate) > MAX_BUDGET) return;
      next = candidate;
    }

    if (next === raw) return;
    setRaw(next);
    onChange(next ? Number(next) : undefined);
  };

  /* A hardware calculator takes the number keys too. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!rootRef.current?.contains(document.activeElement)) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        press({ label: e.key });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        press({ label: '⌫', action: 'back' });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        press({ label: 'C', action: 'clear' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  /* Count the readout up to whatever the keypad just produced. Tweening a
   * plain object is the standard way to animate a number that isn't a DOM
   * property; `overwrite` keeps fast typing from stacking tweens. */
  useGSAP(
    () => {
      const el = displayRef.current;
      if (!el) return;

      const target = raw ? Number(raw) : 0;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        shown.current = target;
        el.textContent = target.toLocaleString('he-IL');
        return;
      }

      const counter = { n: shown.current };
      gsap.to(counter, {
        n: target,
        duration: 0.42,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => {
          el.textContent = Math.round(counter.n).toLocaleString('he-IL');
        },
        onComplete: () => {
          shown.current = target;
        },
      });
    },
    { dependencies: [raw], scope: rootRef }
  );

  /* Key travel. Driven here rather than left to :active alone so a keyboard
   * press animates identically to a tap, and so it can be skipped entirely
   * for reduced motion. */
  const bump = (el: HTMLButtonElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      el,
      { y: 2 },
      { y: 0, duration: 0.28, ease: 'back.out(3)', overwrite: 'auto' }
    );
  };

  return (
    <div ref={rootRef} className="v2-calc">
      {/* Brand plate — the wordmark where hardware would carry its badge. */}
      <div className="v2-calc-brand">
        <span className="v2-calc-mark v2-display">
          Intera<span className="v2-home-foil">gift</span>
        </span>
        {/* Solar strip: the detail that reads "calculator" at a glance. */}
        <span className="v2-calc-solar" aria-hidden="true">
          <span className="v2-calc-cell" />
          <span className="v2-calc-cell" />
          <span className="v2-calc-cell" />
          <span className="v2-calc-cell" />
        </span>
      </div>

      <div className="v2-calc-screen">
        <span className="v2-calc-screen-label">התקציב שלכם</span>
        <div className="v2-calc-readout" aria-live="polite">
          <span className="v2-calc-currency">₪</span>
          <span ref={displayRef} className="v2-calc-value">
            0
          </span>
        </div>
      </div>

      <div className="v2-calc-keys" role="group" aria-label="מקלדת תקציב">
        {KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            data-action={key.action}
            onClick={(e) => {
              press(key);
              bump(e.currentTarget);
            }}
            aria-label={
              key.action === 'back'
                ? 'מחיקת ספרה'
                : key.action === 'clear'
                  ? 'ניקוי'
                  : key.label
            }
            className="v2-calc-key"
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
}
