'use client';

import { useCallback, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, haptic, reduceMotion, useCountdown } from './shared';
import GameIconArt from '../kit/Icon';
import { useGameArt } from '../kit/art';
import { sfx } from '../kit/feel';
import {
  GameHud,
  GameShell,
  useCombo,
  useFloatingText,
  useGameStage,
  stageCaptionStyle,
} from '../kit/GameShell';

gsap.registerPlugin(useGSAP);

/**
 * The perfect moment — a penalty kick, a landing, a toast at exactly the
 * right second.
 *
 * Two scoring bands rather than one: clipping the edge of the zone is a hit,
 * but nailing the centre is a PERFECT worth double. That single change is what
 * gives a one-button game a skill ceiling — and it means the round has
 * something to escalate, because every success narrows the zone and speeds the
 * sweep up.
 */

type Verdict = 'perfect' | 'good' | 'miss';

export default function TimingBar({ config, onWin, onLose }: EngineProps) {
  const art = useGameArt(config);
  const stage = useGameStage();
  // Destructured up front — reaching into `stage` inside render reads to the
  // lint rule (rightly) as touching a ref mid-render.
  const { stageRef } = stage;
  const combo = useCombo();
  const floating = useFloatingText();

  const markerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [score, setScore] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [round, setRound] = useState(0);
  const scoreRef = useRef(0);
  const settledRef = useRef(false);

  /* The zone tightens and the sweep quickens with every success. Clamped so
   * the last point of a long target is still genuinely reachable — this is a
   * doorway, and an unwinnable one would be a trap. */
  const tighten = Math.min(round, 5);
  const goodWidth = Math.max(14, (config.difficulty === 'medium' ? 24 : 32) - tighten * 2.6);
  const perfectWidth = goodWidth * 0.34;
  const goodStart = 50 - goodWidth / 2;
  const perfectStart = 50 - perfectWidth / 2;

  const icon = art.goods[0] ?? art.items[0];

  const finish = useCallback(
    (won: boolean) => {
      if (settledRef.current) return;
      settledRef.current = true;
      tweenRef.current?.kill();
      (won ? onWin : onLose)();
    },
    [onWin, onLose]
  );

  const secondsLeft = useCountdown(config.durationSec, () => finish(false));

  /* The sweep. Re-armed on every round so the new speed takes effect. */
  useGSAP(
    () => {
      const marker = markerRef.current;
      if (!marker) return;

      const duration = reduceMotion()
        ? 2.4
        : Math.max(0.5, (config.difficulty === 'medium' ? 0.92 : 1.2) - tighten * 0.08);

      tweenRef.current = gsap.fromTo(
        marker,
        { xPercent: 0 },
        { xPercent: 100, duration, ease: 'none', repeat: -1, yoyo: true }
      );

      return () => {
        tweenRef.current?.kill();
      };
    },
    { scope: stageRef, dependencies: [round, config.difficulty] }
  );

  const strike = () => {
    if (settledRef.current || !markerRef.current) return;

    // Read the live transform: the tween is the source of truth and React
    // state would always be a frame behind.
    const pct = Number(gsap.getProperty(markerRef.current, 'xPercent'));

    const result: Verdict =
      pct >= perfectStart && pct <= perfectStart + perfectWidth
        ? 'perfect'
        : pct >= goodStart && pct <= goodStart + goodWidth
          ? 'good'
          : 'miss';

    setVerdict(result);
    window.setTimeout(() => setVerdict(null), 520);

    const object = objectRef.current;
    const point = object ? stage.centreOf(object) : { x: 0, y: 0 };

    if (result === 'miss') {
      haptic(26);
      sfx.miss();
      combo.reset();
      stage.feel.shake(1.2);
      stage.feel.flash('#e0503c', 0.22);
      floating.push(point.x, point.y, 'כמעט…', '#ff9b8a');

      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      return;
    }

    const streak = combo.hit();
    const gained = result === 'perfect' ? 2 : 1;

    haptic(result === 'perfect' ? 20 : 12);
    if (result === 'perfect') sfx.combo(Math.min(streak, 5));
    else sfx.collect(streak);

    stage.burstAt(point.x, point.y, {
      count: result === 'perfect' ? 30 : 14,
      colors: result === 'perfect'
        ? ['#f5c246', '#ffffff', art.palette.accent]
        : [art.palette.accent, '#ffffff'],
      power: result === 'perfect' ? 300 : 190,
      size: result === 'perfect' ? 6 : 4.5,
      shape: result === 'perfect' ? 'spark' : 'circle',
    });
    stage.feel.punch(result === 'perfect' ? 2 : 1);
    if (result === 'perfect') stage.feel.flash('#f5c246', 0.24);

    floating.push(
      point.x, point.y,
      result === 'perfect' ? `מושלם! +${gained}` : '+1',
      result === 'perfect' ? '#f5c246' : '#ffffff',
      result === 'perfect'
    );

    // The object launches — the hit does something in the world, not just to
    // a counter.
    if (object && !reduceMotion()) {
      gsap
        .timeline()
        .to(object, {
          y: result === 'perfect' ? -70 : -40,
          scale: result === 'perfect' ? 1.3 : 1.15,
          rotation: result === 'perfect' ? 380 : 180,
          duration: 0.42,
          ease: 'power2.out',
        })
        .to(object, { y: 0, scale: 1, rotation: 0, duration: 0.5, ease: 'bounce.out' });
    }

    scoreRef.current = Math.min(config.targetCount, scoreRef.current + gained);
    setScore(scoreRef.current);

    if (scoreRef.current >= config.targetCount) {
      window.setTimeout(() => finish(true), 340);
      return;
    }
    setRound((r) => r + 1);
  };

  const message =
    verdict === 'perfect' ? 'מושלם!'
      : verdict === 'good' ? 'יפה!'
        : verdict === 'miss' ? 'כמעט…'
          : 'לחצו כשהסמן במרכז';

  return (
    <div className="flex flex-col gap-3 w-full">
      <GameShell
        stage={stage}
        theme={art.theme}
        speed={0.03}
        hud={
          <GameHud
            palette={art.palette}
            score={score}
            target={config.targetCount}
            goalLabel={art.goalLabel}
            secondsLeft={secondsLeft}
            totalSeconds={config.durationSec}
            comboCount={combo.count}
            comboMultiplier={combo.multiplier}
          />
        }
      >
        {/* The whole stage is the button — a big target beats a small one on
          * a phone, and it keeps the eye on the meter rather than on a control. */}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); strike(); }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 pt-14 pb-6"
          aria-label="עצרו את הסמן"
        >
          <div ref={objectRef} className="relative">
            <span
              className="absolute rounded-full"
              style={{
                width: '3.4rem', height: '0.6rem',
                left: '50%', bottom: '-1rem',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.42)',
                filter: 'blur(4px)',
              }}
              aria-hidden="true"
            />
            <GameIconArt
              icon={icon?.icon ?? undefined}
              emoji={icon?.emoji ?? '🎯'}
              size={78}
            />
          </div>

          {/* The meter */}
          <div
            ref={trackRef}
            className="relative w-full rounded-full overflow-hidden"
            style={{
              height: '3rem',
              maxWidth: '22rem',
              background: 'rgba(0,0,0,0.42)',
              border: '1px solid rgba(255,255,255,0.24)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Good band */}
            <div
              className="absolute inset-y-0 transition-all duration-300"
              style={{
                left: `${goodStart}%`,
                width: `${goodWidth}%`,
                background: `linear-gradient(180deg, ${art.palette.accent}55, ${art.palette.accent}22)`,
                borderInline: `2px solid ${art.palette.accent}`,
              }}
            />
            {/* Perfect band */}
            <div
              className="absolute inset-y-0 transition-all duration-300"
              style={{
                left: `${perfectStart}%`,
                width: `${perfectWidth}%`,
                background: verdict === 'perfect'
                  ? '#f5c246'
                  : 'linear-gradient(180deg, #f5c24699, #f5c24644)',
                borderInline: '2px solid #f5c246',
                boxShadow: '0 0 18px -2px #f5c246',
              }}
            />

            {/* The sweeping marker. Inset so xPercent 0–100 stays on-track. */}
            <div className="absolute inset-y-0 left-0 right-0" style={{ padding: '0 0.4rem' }}>
              <div ref={markerRef} className="h-full" style={{ width: 0 }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '0.42rem',
                    marginInlineStart: '-0.21rem',
                    background: '#fff',
                    boxShadow: '0 0 14px rgba(255,255,255,0.95)',
                  }}
                />
              </div>
            </div>
          </div>

          <p
            className="font-black tracking-wide"
            style={{
              fontSize: 'clamp(0.95rem, 4.4vw, 1.25rem)',
              color: verdict === 'perfect' ? '#f5c246' : verdict === 'miss' ? '#ff9b8a' : '#ffffff',
              textShadow: '0 2px 12px rgba(0,0,0,0.75)',
            }}
          >
            {message}
          </p>
        </button>

        {floating.layer}
      </GameShell>

      <p className="text-center text-xs" style={stageCaptionStyle}>
        פגיעה במרכז הזהוב שווה כפול
      </p>
    </div>
  );
}
