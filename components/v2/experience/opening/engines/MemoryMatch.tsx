'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, haptic, reduceMotion, safeReveal, shuffle, useCountdown } from './shared';
import GameIconArt from '../kit/Icon';
import { useGameArt } from '../kit/art';
import { GameIcon } from '@/lib/v2/opening/art';
import { sfx } from '../kit/feel';
import Scenery from '../kit/Scenery';
import {
  GameHud,
  useCombo,
  useFloatingText,
  useGameStage,
  stageCaptionStyle,
} from '../kit/GameShell';
import { ParticleCanvas } from '../kit/feel';

gsap.registerPlugin(useGSAP);

/**
 * Find the pairs — "how well do you remember us".
 *
 * The board is staged inside the same themed world as the action games rather
 * than floating on a flat page, and every card is a real two-sided object that
 * rotates in 3D. Those two things together are what stop this reading as a
 * grid of toggle buttons, which is exactly what the previous version was.
 */

interface Card {
  key: number;
  pairId: number;
  icon: GameIcon | null;
  emoji: string;
  label: string;
  photo?: string;
}

export default function MemoryMatch({ config, photos, onWin, onLose }: EngineProps) {
  const art = useGameArt(config);
  const stage = useGameStage();
  // Destructured up front — reaching into `stage` inside JSX reads to the
  // lint rule (rightly) as touching a ref mid-render.
  const { stageRef, flashRef, particlesRef } = stage;
  const combo = useCombo();
  const floating = useFloatingText();

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const lockRef = useRef(false);
  const settledRef = useRef(false);

  const usablePhotos = config.usePhotos
    ? photos.filter((m) => m.type === 'image').slice(0, config.targetCount)
    : [];

  const cards = useMemo<Card[]>(() => {
    const pairCount = usablePhotos.length >= 3 ? usablePhotos.length : config.targetCount;

    const faces = Array.from({ length: pairCount }).map((_, i) => {
      const item = art.items[i % Math.max(art.items.length, 1)];
      return {
        pairId: i,
        icon: item?.icon ?? null,
        emoji: item?.emoji ?? '💛',
        label: item?.label ?? '',
        photo: usablePhotos[i]?.url,
      };
    });

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
        { scale: 1, autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.035, ease: 'back.out(1.8)' },
        { scale: 0.72, autoAlpha: 0, y: 16 }
      ),
    { scope: stageRef }
  );

  const celebrate = useCallback(
    (pairId: number) => {
      // Both halves of the pair light up together — the match is the event,
      // not the second tap.
      const nodes = stageRef.current?.querySelectorAll<HTMLElement>(
        `[data-pair="${pairId}"]`
      );
      if (!nodes?.length) return;

      nodes.forEach((node) => {
        const { x, y } = stage.centreOf(node);
        stage.burstAt(x, y, {
          count: 16,
          colors: [art.palette.accent, '#ffffff', '#f5c246'],
          power: 210,
          size: 5,
          shape: 'spark',
        });
        if (!reduceMotion()) {
          gsap
            .timeline()
            .to(node, { scale: 1.16, duration: 0.16, ease: 'back.out(3)' })
            .to(node, { scale: 1, duration: 0.34, ease: 'elastic.out(1, 0.45)' });
        }
      });

      const first = nodes[0];
      const { x, y } = stage.centreOf(first);
      const streak = combo.count + 1;
      floating.push(x, y - 10, streak >= 3 ? `רצף ${streak}!` : 'יש!', '#ffffff', streak >= 3);
    },
    [art.palette.accent, combo.count, floating, stage, stageRef]
  );

  const flip = (card: Card) => {
    if (
      settledRef.current ||
      lockRef.current ||
      flipped.includes(card.key) ||
      matched.includes(card.pairId)
    ) {
      return;
    }

    haptic(9);
    sfx.flip();

    const next = [...flipped, card.key];
    setFlipped(next);

    if (next.length < 2) return;

    const [aKey, bKey] = next;
    const a = cards.find((c) => c.key === aKey);
    const b = cards.find((c) => c.key === bKey);

    if (a && b && a.pairId === b.pairId) {
      haptic(18);
      const streak = combo.hit();
      if (streak >= 3) sfx.combo(streak - 3);
      else sfx.collect(streak);

      const done = [...matched, a.pairId];
      setMatched(done);
      setFlipped([]);

      // Fire after commit so both cards are rendered face-up when they pop.
      window.setTimeout(() => celebrate(a.pairId), 30);
      stage.feel.punch(1.2);
      if (streak >= 3) stage.feel.flash(art.palette.accent, 0.14);

      if (done.length >= pairTotal) {
        settledRef.current = true;
        window.setTimeout(onWin, 620);
      }
      return;
    }

    // A miss: shake both, break the streak, turn them back. The lock stops a
    // third tap landing mid-flip.
    combo.reset();
    sfx.miss();
    haptic(22);
    lockRef.current = true;

    window.setTimeout(() => {
      const nodes = stageRef.current?.querySelectorAll<HTMLElement>('[data-flipped="1"]');
      if (nodes && !reduceMotion()) {
        nodes.forEach((node) =>
          gsap.fromTo(node, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.32)' })
        );
      }
    }, 40);

    window.setTimeout(() => {
      setFlipped([]);
      lockRef.current = false;
    }, 820);
  };

  const columns = pairTotal <= 3 ? 3 : 4;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden rounded-[1.75rem] select-none"
        style={{
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 30px 70px -38px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)',
          background: art.palette.sky,
          padding: '3.6rem 0.9rem 1.1rem',
        }}
      >
        <Scenery theme={art.theme} speed={0} quiet />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.42) 100%)' }}
          aria-hidden="true"
        />

        <GameHud
          palette={art.palette}
          score={matched.length}
          target={pairTotal}
          goalLabel={art.goalLabel || 'זוגות'}
          secondsLeft={secondsLeft}
          totalSeconds={config.durationSec}
          comboCount={combo.count}
          comboMultiplier={combo.multiplier}
        />

        <div
          className="relative grid gap-2.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          dir="rtl"
        >
          {cards.map((card) => {
            const isMatched = matched.includes(card.pairId);
            const isUp = flipped.includes(card.key) || isMatched;

            return (
              <button
                key={card.key}
                data-card
                data-pair={isMatched ? card.pairId : undefined}
                data-flipped={flipped.includes(card.key) ? '1' : undefined}
                type="button"
                onClick={() => flip(card)}
                aria-label={isUp ? card.label || 'קלף גלוי' : 'קלף הפוך'}
                className="relative aspect-square"
                style={{ perspective: '900px', opacity: 0 }}
              >
                {/* The card itself rotates; the two faces are siblings, each
                  * backface-hidden, which is what makes this a real object
                  * turning over rather than a colour swap. */}
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${isUp ? 180 : 0}deg)`,
                    transition: reduceMotion() ? 'none' : 'transform 460ms cubic-bezier(0.34, 1.4, 0.5, 1)',
                  }}
                >
                  {/* Back */}
                  <span
                    className="absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      background: `linear-gradient(145deg, ${art.palette.accent}, rgba(0,0,0,0.55))`,
                      border: '1.5px solid rgba(255,255,255,0.28)',
                      boxShadow: '0 8px 20px -10px rgba(0,0,0,0.9)',
                    }}
                  >
                    <CardBackPattern />
                  </span>

                  {/* Face */}
                  <span
                    className="absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: isMatched
                        ? `linear-gradient(160deg, ${art.palette.accent}dd, ${art.palette.accent}77)`
                        : 'rgba(255,255,255,0.94)',
                      border: `1.5px solid ${isMatched ? '#ffffff' : 'rgba(255,255,255,0.7)'}`,
                      boxShadow: isMatched
                        ? `0 0 26px -4px ${art.palette.accent}, inset 0 1px 0 rgba(255,255,255,0.6)`
                        : '0 8px 20px -10px rgba(0,0,0,0.8)',
                    }}
                  >
                    {card.photo ? (
                      <img src={card.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <GameIconArt
                        icon={card.icon ?? undefined}
                        emoji={card.emoji}
                        size={38}
                        shadow={false}
                      />
                    )}
                    {isMatched && (
                      <span
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'rgba(255,255,255,0.16)' }}
                      />
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <ParticleCanvas ref={particlesRef} className="z-20" />
        <div
          ref={flashRef}
          className="absolute inset-0 pointer-events-none z-20 mix-blend-screen"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
        {floating.layer}
      </div>

      <p className="text-center text-xs" style={stageCaptionStyle}>
        מצאו את כל הזוגות
      </p>
    </div>
  );
}

/** The back of every card — a repeating motif, so the board reads as a deck. */
function CardBackPattern() {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
      <defs>
        <pattern id="v2-card-back" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M6 2l1.6 3.2L11 6l-3.4.8L6 10l-1.6-3.2L1 6l3.4-.8z" fill="#fff" opacity="0.28" />
        </pattern>
      </defs>
      <rect width="48" height="48" fill="url(#v2-card-back)" />
      <circle cx="24" cy="24" r="9" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="3.4" fill="#fff" fillOpacity="0.5" />
    </svg>
  );
}
