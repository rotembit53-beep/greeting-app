'use client';

import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, Hud, haptic, reduceMotion, safeReveal, shuffle } from './shared';

gsap.registerPlugin(useGSAP);

/**
 * Pick the steps in the right order.
 *
 * `config.items` arrives already in the correct order — the array *is* the
 * answer — so this engine only has to shuffle it for display and compare
 * against the original index.
 */
export default function SequenceOrder({ config, template, onWin, onLose }: EngineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const settledRef = useRef(false);

  // Shuffled once per mount: re-shuffling on every render would move the
  // buttons under the player's finger.
  const shown = useMemo(
    () => shuffle(config.items.map((item, index) => ({ item, index }))),
    [config.items]
  );

  // These buttons ARE the game — reveal them in a way that survives a
  // suspended rAF, or there is nothing to tap.
  useGSAP(
    () =>
      safeReveal(
        '[data-step]',
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.05, ease: 'back.out(1.6)' },
        { y: 18, autoAlpha: 0, scale: 0.94 }
      ),
    { scope: rootRef }
  );

  const choose = (originalIndex: number, el: HTMLButtonElement) => {
    if (settledRef.current || picked.includes(originalIndex)) return;

    const expected = picked.length;

    if (originalIndex !== expected) {
      haptic(26);
      setWrong(originalIndex);
      window.setTimeout(() => setWrong(null), 420);

      if (!reduceMotion()) {
        gsap.fromTo(el, { x: -7 }, { x: 0, duration: 0.45, ease: 'elastic.out(1, 0.32)' });
      }

      // Start the order over rather than ending the game — the whole point is
      // that they get to work it out.
      setPicked([]);
      settledRef.current = true;
      onLose();
      return;
    }

    haptic(10);
    if (!reduceMotion()) {
      gsap.fromTo(el, { scale: 1 }, { scale: 1.06, duration: 0.16, yoyo: true, repeat: 1 });
    }

    const next = [...picked, originalIndex];
    setPicked(next);

    if (next.length >= config.items.length) {
      settledRef.current = true;
      onWin();
    }
  };

  const { accent, accentSoft, ink, inkSoft, surface, surfaceBorder } = template.palette;

  return (
    <div ref={rootRef} className="flex flex-col gap-4 w-full" dir="rtl">
      <Hud
        template={template}
        score={picked.length}
        target={config.items.length}
        goalLabel="שלב"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {shown.map(({ item, index }) => {
          const order = picked.indexOf(index);
          const done = order !== -1;
          const isWrong = wrong === index;

          return (
            <button
              key={index}
              data-step
              type="button"
              disabled={done}
              onClick={(e) => choose(index, e.currentTarget)}
              className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 px-2"
              style={{
                background: done ? accentSoft : surface,
                border: `1.5px solid ${isWrong ? accent : done ? accent : surfaceBorder}`,
                opacity: done ? 0.75 : 1,
                cursor: done ? 'default' : 'pointer',
              }}
            >
              {done && (
                <span
                  className="absolute top-1.5 start-2 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: accent, color: '#fff' }}
                >
                  {order + 1}
                </span>
              )}
              <span style={{ fontSize: 'clamp(1.7rem, 7vw, 2.2rem)', lineHeight: 1 }}>
                {item.emoji}
              </span>
              <span className="text-xs font-bold text-center" style={{ color: ink }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm" style={{ color: inkSoft }}>
        {picked.length ? `הבא בתור: שלב ${picked.length + 1}` : 'התחילו מהשלב הראשון'}
      </p>
    </div>
  );
}
