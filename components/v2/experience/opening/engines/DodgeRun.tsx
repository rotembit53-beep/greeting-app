'use client';

import { useCallback, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, Hud, Stage, haptic, reduceMotion, useCountdown } from './shared';

gsap.registerPlugin(useGSAP);

/**
 * Three lanes, falling objects: collect the good, dodge the bad.
 *
 * The "journey" mechanic — getting somewhere, arriving on time, making it
 * through. Lanes rather than free movement because a doorway has to be
 * playable one-thumbed on a phone, without a tutorial.
 */

interface Faller {
  key: number;
  lane: number;
  emoji: string;
  good: boolean;
}

const LANES = 3;
let seq = 0;

export default function DodgeRun({ config, template, onWin, onLose }: EngineProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [lane, setLane] = useState(1);
  const [fallers, setFallers] = useState<Faller[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const laneRef = useRef(1);
  const settledRef = useRef(false);

  const goods = config.items.filter((i) => i.good);
  const bads = config.items.filter((i) => !i.good);
  const avatar = goods[0]?.emoji ?? '🏃';

  const finish = useCallback(
    (won: boolean) => {
      if (settledRef.current) return;
      settledRef.current = true;
      (won ? onWin : onLose)();
    },
    [onWin, onLose]
  );

  const secondsLeft = useCountdown(config.durationSec, () =>
    // Surviving the clock counts as arriving, as long as they collected
    // something — expiring with nothing is the only real loss.
    finish(score > 0)
  );

  const move = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(LANES - 1, next));
    laneRef.current = clamped;
    setLane(clamped);
    haptic(8);
  }, []);

  /* Keyboard is a first-class control here, not an afterthought: this is the
   * one engine where a pointer-only implementation would exclude desktop
   * players entirely. */
  useGSAP(
    (context, contextSafe) => {
      const onKey = contextSafe?.((e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') move(laneRef.current + 1); // RTL: left = forward
        if (e.key === 'ArrowRight') move(laneRef.current - 1);
      });
      if (!onKey) return;
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    },
    { scope: stageRef, dependencies: [move] }
  );

  /* Spawner */
  useGSAP(
    (context, contextSafe) => {
      const rate = config.difficulty === 'medium' ? 700 : 900;

      const spawn = contextSafe?.(() => {
        const useBad = bads.length > 0 && Math.random() < 0.42;
        const pool = useBad ? bads : goods;
        if (!pool.length) return;
        const item = pool[Math.floor(Math.random() * pool.length)];

        setFallers((f) => [
          ...f.slice(-10),
          {
            key: seq++,
            lane: Math.floor(Math.random() * LANES),
            emoji: item.emoji,
            good: item.good,
          },
        ]);
      });

      if (!spawn) return;
      spawn();
      const id = window.setInterval(spawn, rate);
      return () => window.clearInterval(id);
    },
    { scope: stageRef, dependencies: [config.difficulty] }
  );

  const attach = (el: HTMLDivElement | null, faller: Faller) => {
    if (!el || el.dataset.animated) return;
    el.dataset.animated = '1';

    const height = stageRef.current?.clientHeight ?? 380;
    const duration = config.difficulty === 'medium' ? 1.9 : 2.4;

    const settle = () => {
      // Collision is resolved once, at the player's row, against the lane the
      // player is in *at that moment* — reading the ref, not stale state.
      if (!settledRef.current && faller.lane === laneRef.current) {
        if (faller.good) {
          haptic(12);
          setScore((s) => {
            const next = s + 1;
            if (next >= config.targetCount) finish(true);
            return next;
          });
        } else {
          haptic(30);
          setLives((l) => {
            const next = l - 1;
            if (next <= 0) finish(false);
            return next;
          });
          if (!reduceMotion() && stageRef.current) {
            gsap.fromTo(
              stageRef.current,
              { x: -8 },
              { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
            );
          }
        }
      }
      setFallers((f) => f.filter((x) => x.key !== faller.key));
    };

    if (reduceMotion()) {
      window.setTimeout(settle, duration * 1000);
      return;
    }

    gsap.fromTo(
      el,
      { y: -60, autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2 }
    );
    gsap.to(el, {
      y: height - 74,
      duration,
      ease: 'none',
      onComplete: settle,
    });
  };

  const { accent, accentSoft, ink, inkSoft, surfaceBorder } = template.palette;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between gap-2">
        <Hud
          template={template}
          score={score}
          target={config.targetCount}
          secondsLeft={secondsLeft}
        />
        <span className="text-sm tracking-widest" aria-label={`${lives} חיים`}>
          {'❤️'.repeat(Math.max(0, lives))}
        </span>
      </div>

      <Stage template={template} innerRef={stageRef}>
        {/* Lane guides */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: LANES }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ borderInlineEnd: i < LANES - 1 ? `1px dashed ${surfaceBorder}` : 'none' }}
            />
          ))}
        </div>

        {fallers.map((f) => (
          <div
            key={f.key}
            ref={(el) => attach(el, f)}
            className="absolute top-0 flex justify-center"
            style={{
              width: `${100 / LANES}%`,
              insetInlineStart: `${(f.lane * 100) / LANES}%`,
              willChange: 'transform',
            }}
          >
            <span style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', lineHeight: 1 }}>
              {f.emoji}
            </span>
          </div>
        ))}

        {/* The runner */}
        <div
          ref={playerRef}
          className="absolute bottom-3 flex justify-center transition-transform duration-200"
          style={{
            width: `${100 / LANES}%`,
            insetInlineStart: `${(lane * 100) / LANES}%`,
          }}
        >
          <span style={{ fontSize: 'clamp(2.1rem, 9vw, 2.9rem)', lineHeight: 1 }}>{avatar}</span>
        </div>
      </Stage>

      {/* Explicit controls: reliable on touch, and the only way this is
        * operable for anyone not using a pointer or arrow keys. */}
      <div className="grid grid-cols-2 gap-2.5" dir="rtl">
        {[
          { label: '→', delta: -1, name: 'ימינה' },
          { label: '←', delta: 1, name: 'שמאלה' },
        ].map((btn) => (
          <button
            key={btn.name}
            type="button"
            onPointerDown={() => move(laneRef.current + btn.delta)}
            aria-label={btn.name}
            className="rounded-2xl py-3.5 text-2xl font-black active:scale-95 transition-transform"
            style={{ background: accentSoft, color: accent, border: `1.5px solid ${surfaceBorder}` }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <p className="text-center text-xs" style={{ color: inkSoft }}>
        <span style={{ color: ink }}>{goods[0]?.label || 'אספו את הטוב'}</span>
        {bads[0]?.label ? ` · היזהרו מ${bads[0].label}` : ''}
      </p>
    </div>
  );
}
