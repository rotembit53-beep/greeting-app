'use client';

import { useCallback, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, Hud, Stage, haptic, reduceMotion, useCountdown } from './shared';

gsap.registerPlugin(useGSAP);

/**
 * A marker sweeps a bar; stop it inside the zone.
 *
 * The mechanic that carries "the perfect moment" — a penalty kick, a landing,
 * a toast at exactly the right second. Difficulty is the zone width, so the
 * config tunes feel without touching this file.
 */
export default function TimingBar({ config, template, onWin, onLose }: EngineProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const settledRef = useRef(false);

  // Zone is centred; a 26%/18% band is forgiving enough to feel good on a
  // phone and still require intent.
  const zonePct = config.difficulty === 'medium' ? 18 : 26;
  const zoneStart = 50 - zonePct / 2;

  const icon = config.items[0]?.emoji ?? '🎯';

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

  useGSAP(
    () => {
      const marker = markerRef.current;
      const track = trackRef.current;
      if (!marker || !track) return;

      if (reduceMotion()) {
        // Without motion the sweep would be invisible; a slow, honest pace
        // keeps the game playable rather than removing it.
        tweenRef.current = gsap.fromTo(
          marker,
          { xPercent: 0 },
          { xPercent: 100, duration: 2.4, ease: 'none', repeat: -1, yoyo: true }
        );
        return;
      }

      tweenRef.current = gsap.fromTo(
        marker,
        { xPercent: 0 },
        {
          xPercent: 100,
          duration: config.difficulty === 'medium' ? 0.85 : 1.15,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        }
      );
    },
    { scope: stageRef, dependencies: [config.difficulty] }
  );

  const strike = () => {
    if (settledRef.current || !markerRef.current) return;

    // Read the live transform rather than tracking position in state: the
    // tween is the source of truth and React would always be a frame behind.
    const pct = Number(gsap.getProperty(markerRef.current, 'xPercent'));
    const hit = pct >= zoneStart && pct <= zoneStart + zonePct;

    haptic(hit ? 14 : 26);
    setFlash(hit ? 'hit' : 'miss');
    window.setTimeout(() => setFlash(null), 260);

    if (!reduceMotion()) {
      gsap.fromTo(
        stageRef.current,
        { x: hit ? 0 : -6 },
        { x: 0, duration: 0.3, ease: hit ? 'power2.out' : 'elastic.out(1, 0.35)' }
      );
    }

    if (hit) {
      setScore((s) => {
        const next = s + 1;
        if (next >= config.targetCount) finish(true);
        return next;
      });
    } else {
      setScore((s) => Math.max(0, s - 1));
    }
  };

  const { accent, ink, inkSoft, surfaceBorder } = template.palette;

  return (
    <div className="flex flex-col gap-3 w-full">
      <Hud
        template={template}
        score={score}
        target={config.targetCount}
        secondsLeft={secondsLeft}
      />

      <Stage template={template} innerRef={stageRef} onPointerDown={strike}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
          <span
            style={{ fontSize: 'clamp(3rem, 16vw, 5rem)', lineHeight: 1 }}
            className="transition-transform"
          >
            {icon}
          </span>

          <div
            ref={trackRef}
            className="relative w-full rounded-full overflow-hidden"
            style={{ height: '2.6rem', background: `${ink}14`, border: `1px solid ${surfaceBorder}` }}
          >
            {/* The target zone */}
            <div
              className="absolute inset-y-0 rounded-full"
              style={{
                left: `${zoneStart}%`,
                width: `${zonePct}%`,
                background: flash === 'hit' ? accent : `${accent}44`,
                border: `2px solid ${accent}`,
                transition: 'background 180ms ease',
              }}
            />
            {/* The sweeping marker. Inset so xPercent 0-100 stays on-track. */}
            <div className="absolute inset-y-0 left-0 right-0" style={{ padding: '0 0.35rem' }}>
              <div ref={markerRef} className="h-full" style={{ width: 0 }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: '0.5rem', background: ink, marginInlineStart: '-0.25rem' }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm font-bold" style={{ color: flash === 'miss' ? accent : inkSoft }}>
            {flash === 'hit' ? 'מדויק!' : flash === 'miss' ? 'כמעט…' : 'לחצו כשהסמן בתוך האזור'}
          </p>
        </div>
      </Stage>
    </div>
  );
}
