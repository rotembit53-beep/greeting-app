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
              className="event-tile active:scale-[.98]"
            >
              {/* The event's colour is the tile itself now — it used to be a
               * small swatch window inside a bordered card, which is exactly
               * the boxed-thumbnail pattern this pass removes. */}
              <span
                className="event-tile-wash"
                aria-hidden="true"
                style={{ background: event.gradient }}
              />
              <span className="event-tile-emoji" aria-hidden="true">
                {event.emoji}
              </span>
              <span
                className="v2-display event-tile-label"
                style={{ color: 'var(--v2-ink)' }}
              >
                {event.label}
              </span>
              <span className="event-tile-hint" style={{ color: 'var(--v2-ink-soft)' }}>
                {event.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
