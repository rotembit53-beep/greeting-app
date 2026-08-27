'use client';

import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, Hud, haptic, reduceMotion, safeReveal, shuffle, useCountdown } from './shared';

gsap.registerPlugin(useGSAP);

/**
 * Find the pairs.
 *
 * The only engine that can be played with the recipient's own photos: when
 * `usePhotos` is set and enough images exist, each card face is a real
 * picture, which turns "a memory game" into "our memories".
 */

interface Card {
  key: number;
  pairId: number;
  emoji: string;
  label: string;
  photo?: string;
}

export default function MemoryMatch({ config, template, photos, onWin, onLose }: EngineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const lockRef = useRef(false);
  const settledRef = useRef(false);

  const usablePhotos = config.usePhotos
    ? photos.filter((m) => m.type === 'image').slice(0, config.targetCount)
    : [];

  const cards = useMemo<Card[]>(() => {
    const pairCount = usablePhotos.length >= 3 ? usablePhotos.length : config.targetCount;

    const faces = Array.from({ length: pairCount }).map((_, i) => ({
      pairId: i,
      emoji: config.items[i % Math.max(config.items.length, 1)]?.emoji ?? '💛',
      label: config.items[i % Math.max(config.items.length, 1)]?.label ?? '',
      photo: usablePhotos[i]?.url,
    }));

    let key = 0;
    return shuffle(faces.flatMap((f) => [{ ...f, key: key++ }, { ...f, key: key++ }]));
    // Built once per mount: reshuffling mid-game would move cards the player
    // has already memorised, which is the one thing this game cannot do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pairTotal = cards.length / 2;

  const secondsLeft = useCountdown(config.durationSec, () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onLose();
  });

  // The cards ARE the game — see safeReveal.
  useGSAP(
    () =>
      safeReveal(
        '[data-card]',
        { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.035, ease: 'back.out(1.7)' },
        { scale: 0.8, autoAlpha: 0 }
      ),
    { scope: rootRef }
  );

  const flip = (card: Card, el: HTMLButtonElement) => {
    if (
      settledRef.current ||
      lockRef.current ||
      flipped.includes(card.key) ||
      matched.includes(card.pairId)
    ) {
      return;
    }

    haptic(9);
    if (!reduceMotion()) {
      gsap.fromTo(el, { rotationY: -90 }, { rotationY: 0, duration: 0.3, ease: 'power2.out' });
    }

    const next = [...flipped, card.key];
    setFlipped(next);

    if (next.length < 2) return;

    const [aKey, bKey] = next;
    const a = cards.find((c) => c.key === aKey);
    const b = cards.find((c) => c.key === bKey);

    if (a && b && a.pairId === b.pairId) {
      haptic(16);
      const done = [...matched, a.pairId];
      setMatched(done);
      setFlipped([]);
      if (done.length >= pairTotal) {
        settledRef.current = true;
        onWin();
      }
      return;
    }

    // Hold the mismatch on screen long enough to actually be seen, then
    // turn both back. The lock stops a third tap landing mid-flip.
    lockRef.current = true;
    window.setTimeout(() => {
      setFlipped([]);
      lockRef.current = false;
    }, 780);
  };

  const { accent, accentSoft, ink, surface, surfaceBorder } = template.palette;
  const columns = pairTotal <= 3 ? 3 : 4;

  return (
    <div ref={rootRef} className="flex flex-col gap-4 w-full" dir="rtl">
      <Hud
        template={template}
        score={matched.length}
        target={pairTotal}
        secondsLeft={secondsLeft}
        goalLabel="זוגות"
      />

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const isUp = flipped.includes(card.key) || matched.includes(card.pairId);

          return (
            <button
              key={card.key}
              data-card
              type="button"
              onClick={(e) => flip(card, e.currentTarget)}
              aria-label={isUp ? card.label || 'קלף גלוי' : 'קלף הפוך'}
              className="relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: isUp ? accentSoft : surface,
                border: `1.5px solid ${isUp ? accent : surfaceBorder}`,
                opacity: matched.includes(card.pairId) ? 0.65 : 1,
              }}
            >
              {isUp ? (
                card.photo ? (
                  <img
                    src={card.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ fontSize: 'clamp(1.6rem, 7vw, 2.3rem)' }}>{card.emoji}</span>
                )
              ) : (
                <span style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', color: ink, opacity: 0.35 }}>
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
