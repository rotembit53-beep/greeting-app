'use client';

import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, haptic, reduceMotion, safeReveal, shuffle } from './shared';
import GameIconArt from '../kit/Icon';
import { useGameArt } from '../kit/art';
import { sfx } from '../kit/feel';
import Scenery from '../kit/Scenery';
import { ParticleCanvas } from '../kit/feel';
import { GameHud, stageCaptionStyle, useFloatingText, useGameStage } from '../kit/GameShell';

gsap.registerPlugin(useGSAP);

/**
 * Get the order right — a recipe, a packing list, the steps of a ritual.
 *
 * `config.items` arrives already in the correct order, so the array *is* the
 * answer; this only shuffles it for display and compares against the original
 * index.
 *
 * The upgrade that matters here is the ribbon: chosen steps lift out of the
 * grid and into a numbered row along the top, so the player can see the
 * sequence they are building rather than holding it in their head. A wrong tap
 * now costs the run of correct answers, not the whole round — being sent back
 * to the start on step four of five was the least forgiving moment in any of
 * these games.
 */
export default function SequenceOrder({ config, onWin, onLose }: EngineProps) {
  const art = useGameArt(config);
  const stage = useGameStage();
  // Destructured up front — reaching into `stage` inside JSX reads to the
  // lint rule (rightly) as touching a ref mid-render.
  const { stageRef, flashRef, particlesRef } = stage;
  const floating = useFloatingText();

  const [picked, setPicked] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const settledRef = useRef(false);

  // Shuffled once per mount: re-shuffling on every render would move the
  // buttons under the player's finger.
  const shown = useMemo(
    () => shuffle(art.items.map((item) => item)),
    [art.items]
  );

  useGSAP(
    () =>
      safeReveal(
        '[data-step]',
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.05, ease: 'back.out(1.7)' },
        { y: 20, autoAlpha: 0, scale: 0.9 }
      ),
    { scope: stageRef }
  );

  const choose = (originalIndex: number, el: HTMLButtonElement) => {
    if (settledRef.current || picked.includes(originalIndex)) return;

    const expected = picked.length;
    const { x, y } = stage.centreOf(el);

    if (originalIndex !== expected) {
      haptic(26);
      sfx.miss();
      setWrong(originalIndex);
      window.setTimeout(() => setWrong(null), 460);

      stage.feel.shake(1.1);
      stage.feel.flash('#e0503c', 0.2);
      particlesRef.current?.puff(x, y, '#e0503c');
      floating.push(x, y, 'לא זה', '#ff9b8a');

      if (!reduceMotion()) {
        gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.46, ease: 'elastic.out(1, 0.3)' });
      }

      // Three misses end the round; before that the sequence simply restarts,
      // because working it out is the whole point of the game.
      const next = mistakes + 1;
      setMistakes(next);
      setPicked([]);

      if (next >= 3) {
        settledRef.current = true;
        window.setTimeout(onLose, 640);
      }
      return;
    }

    haptic(11);
    sfx.collect(picked.length);
    stage.burstAt(x, y, {
      count: 14,
      colors: [art.palette.accent, '#ffffff'],
      power: 190,
      shape: 'spark',
    });
    stage.feel.punch(1);
    floating.push(x, y, `${expected + 1}`, '#ffffff');

    if (!reduceMotion()) {
      gsap.fromTo(el, { scale: 1 }, { scale: 1.1, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' });
    }

    const next = [...picked, originalIndex];
    setPicked(next);

    if (next.length >= art.items.length) {
      settledRef.current = true;
      particlesRef.current?.rain({ count: 50 });
      window.setTimeout(onWin, 560);
    }
  };

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
          style={{ background: 'radial-gradient(120% 80% at 50% 40%, transparent 42%, rgba(0,0,0,0.44) 100%)' }}
          aria-hidden="true"
        />

        <GameHud
          palette={art.palette}
          score={picked.length}
          target={art.items.length}
          goalLabel={art.goalLabel || 'שלב'}
          lives={3 - mistakes}
        />

        {/* The ribbon: the sequence so far, built in front of the player. */}
        <div
          className="relative flex items-center justify-center gap-1.5 mb-3 flex-wrap min-h-[2.6rem]"
          dir="rtl"
        >
          {art.items.map((_, slot) => {
            const chosenIndex = picked[slot];
            const item = chosenIndex !== undefined ? art.items[chosenIndex] : null;
            const isNext = slot === picked.length;

            return (
              <span
                key={slot}
                className="flex items-center justify-center rounded-xl transition-all duration-300"
                style={{
                  width: '2.4rem',
                  height: '2.4rem',
                  background: item ? art.palette.accent : 'rgba(0,0,0,0.34)',
                  border: `1.5px solid ${isNext ? '#ffffff' : item ? '#ffffff88' : 'rgba(255,255,255,0.24)'}`,
                  boxShadow: isNext ? '0 0 16px -2px #ffffff' : item ? `0 0 14px -4px ${art.palette.accent}` : 'none',
                }}
              >
                {item ? (
                  <GameIconArt icon={item.icon ?? undefined} emoji={item.emoji} size={22} shadow={false} />
                ) : (
                  <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {slot + 1}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        <div className="relative grid grid-cols-3 gap-2.5" dir="rtl">
          {shown.map((item) => {
            const order = picked.indexOf(item.index);
            const done = order !== -1;
            const isWrong = wrong === item.index;

            return (
              <button
                key={item.index}
                data-step
                type="button"
                disabled={done}
                onClick={(e) => choose(item.index, e.currentTarget)}
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3.5 px-2"
                style={{
                  opacity: 0,
                  background: done ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.93)',
                  border: `1.5px solid ${isWrong ? '#e0503c' : done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'}`,
                  boxShadow: done ? 'none' : '0 8px 20px -12px rgba(0,0,0,0.85)',
                  cursor: done ? 'default' : 'pointer',
                }}
              >
                <GameIconArt
                  icon={item.icon ?? undefined}
                  emoji={item.emoji}
                  size={34}
                  shadow={false}
                  style={{ opacity: done ? 0.3 : 1 }}
                />
                {item.label && (
                  <span
                    className="text-[11px] font-bold text-center leading-tight"
                    style={{ color: done ? 'rgba(255,255,255,0.5)' : '#1f2937' }}
                  >
                    {item.label}
                  </span>
                )}
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
        {picked.length ? `הבא בתור: שלב ${picked.length + 1}` : 'התחילו מהשלב הראשון'}
      </p>
    </div>
  );
}
