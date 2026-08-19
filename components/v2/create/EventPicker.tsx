'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EVENTS, EventType } from '@/lib/v2/types';

gsap.registerPlugin(useGSAP);

interface Props {
  value: EventType | null;
  onSelect: (event: EventType) => void;
}

export default function EventPicker({ value, onSelect }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        '[data-event-card]',
        { y: 26, autoAlpha: 0, scale: 0.96 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.045,
          ease: 'back.out(1.4)',
        }
      );
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef}>
      <h1
        className="v2-display text-center mb-2"
        style={{ fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)', color: 'var(--v2-ink)' }}
      >
        לכבוד מה ההפתעה?
      </h1>
      <p className="text-center mb-8" style={{ color: 'var(--v2-ink-soft)' }}>
        בחרו אירוע — נתאים לו את העיצוב, הטקסט והמוזיקה
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {EVENTS.map((event) => {
          const selected = value === event.id;
          return (
            <button
              key={event.id}
              data-event-card
              type="button"
              onClick={() => onSelect(event.id)}
              aria-pressed={selected}
              data-selected={selected}
              className="style-card active:scale-[.98]"
            >
              <span className="style-check" aria-hidden="true">✓</span>
              <div
                className="h-20 flex items-center justify-center text-4xl art-window"
                style={{ background: event.gradient, aspectRatio: 'auto' }}
              >
                {event.emoji}
              </div>
              <div className="p-3.5">
                <p
                  className="v2-display text-sm mb-0.5"
                  style={{ color: 'var(--v2-ink)', fontWeight: 700 }}
                >
                  {event.label}
                </p>
                <p className="text-xs leading-snug" style={{ color: 'var(--v2-ink-soft)' }}>
                  {event.hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
