'use client';

import { useCallback, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, Hud, Stage, haptic, reduceMotion, useCountdown } from './shared';

gsap.registerPlugin(useGSAP);

/**
 * Things drift up the screen and the player taps the right ones.
 *
 * The objects come from the config, so "catch the footballs, dodge the red
 * cards" and "collect the passport stamps" are the same engine with entirely
 * different meaning.
 */

interface Floater {
  key: number;
  emoji: string;
  label: string;
  good: boolean;
  leftPct: number;
}

let seq = 0;

export default function TapTargets({
  config,
  template,
  onWin,
  onLose,
}: EngineProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [score, setScore] = useState(0);
  const settledRef = useRef(false);

  const goods = config.items.filter((i) => i.good);
  const bads = config.items.filter((i) => !i.good);

  const finish = useCallback(
    (won: boolean) => {
      if (settledRef.current) return;
      settledRef.current = true;
      (won ? onWin : onLose)();
    },
    [onWin, onLose]
  );

  const secondsLeft = useCountdown(config.durationSec, () => finish(false));

  /* Spawner. Interval rather than a GSAP timeline because each floater is a
   * React node with its own lifetime — the tween animates it, but React owns
   * whether it exists. */
  useGSAP(
    (context, contextSafe) => {
      const spawnRate = config.difficulty === 'medium' ? 620 : 820;
      // A bad apple only appears once there is something to lose.
      const badChance = bads.length ? (config.difficulty === 'medium' ? 0.32 : 0.2) : 0;

      const spawn = contextSafe?.(() => {
        const useBad = Math.random() < badChance;
        const pool = useBad ? bads : goods;
        if (!pool.length) return;
        const item = pool[Math.floor(Math.random() * pool.length)];

        const floater: Floater = {
          key: seq++,
          emoji: item.emoji,
          label: item.label,
          good: item.good,
          leftPct: 8 + Math.random() * 76,
        };

        setFloaters((f) => [...f, floater]);
        // Self-cleaning: the tween's onComplete removes it, but a hard cap
        // protects against a throttled tab piling up nodes.
        window.setTimeout(() => {
          setFloaters((f) => (f.length > 14 ? f.slice(-10) : f));
        }, 100);
      });

      if (!spawn) return;
      spawn();
      const id = window.setInterval(spawn, spawnRate);
      return () => window.clearInterval(id);
    },
    { scope: stageRef, dependencies: [config.difficulty] }
  );

  /* Each floater rises once, then removes itself. */
  const attach = (el: HTMLButtonElement | null, key: number) => {
    if (!el || el.dataset.animated) return;
    el.dataset.animated = '1';

    const drift = gsap.utils.random(-26, 26);
    const travel = config.difficulty === 'medium' ? 2.6 : 3.4;

    if (reduceMotion()) {
      // Still playable without motion: it sits still, then expires.
      gsap.set(el, { y: '-50%', autoAlpha: 1 });
      window.setTimeout(() => setFloaters((f) => f.filter((x) => x.key !== key)), 2600);
      return;
    }

    gsap.fromTo(
      el,
      { y: 0, autoAlpha: 0, scale: 0.6 },
      { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(2)' }
    );
    gsap.to(el, {
      y: -(stageRef.current?.clientHeight ?? 380) - 90,
      x: drift,
      rotation: drift * 0.5,
      duration: travel,
      ease: 'none',
      onComplete: () => setFloaters((f) => f.filter((x) => x.key !== key)),
    });
  };

  const pop = (floater: Floater, el: HTMLButtonElement) => {
    if (settledRef.current) return;

    gsap.killTweensOf(el);
    haptic(floater.good ? 10 : 22);

    if (!reduceMotion()) {
      gsap
        .timeline({ onComplete: () => setFloaters((f) => f.filter((x) => x.key !== floater.key)) })
        .to(el, { scale: 1.4, duration: 0.1, ease: 'power2.out' })
        .to(el, { scale: 0, autoAlpha: 0, duration: 0.2, ease: 'back.in(2)' });
    } else {
      setFloaters((f) => f.filter((x) => x.key !== floater.key));
    }

    if (floater.good) {
      setScore((s) => {
        const next = s + 1;
        if (next >= config.targetCount) finish(true);
        return next;
      });
    } else {
      // A wrong tap costs progress, never the game — losing instantly to a
      // mistap would make the doorway feel punishing.
      setScore((s) => Math.max(0, s - 1));
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Hud
        template={template}
        score={score}
        target={config.targetCount}
        secondsLeft={secondsLeft}
      />

      <Stage template={template} innerRef={stageRef}>
        {floaters.map((f) => (
          <button
            key={f.key}
            ref={(el) => attach(el, f.key)}
            type="button"
            onPointerDown={(e) => pop(f, e.currentTarget)}
            aria-label={f.label || (f.good ? 'פריט' : 'מכשול')}
            className="absolute flex flex-col items-center gap-0.5 cursor-pointer"
            style={{ left: `${f.leftPct}%`, bottom: '-3rem', willChange: 'transform' }}
          >
            <span style={{ fontSize: 'clamp(2.1rem, 9vw, 3rem)', lineHeight: 1 }}>
              {f.emoji}
            </span>
            {f.label && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: template.palette.accentSoft,
                  color: template.palette.accent,
                }}
              >
                {f.label}
              </span>
            )}
          </button>
        ))}
      </Stage>
    </div>
  );
}
