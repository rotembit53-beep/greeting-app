'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, haptic, reduceMotion, useCountdown } from './shared';
import GameIconArt from '../kit/Icon';
import { useGameArt, GameItem } from '../kit/art';
import { sfx } from '../kit/feel';
import {
  GameHud,
  GameShell,
  useCombo,
  useDifficulty,
  useFloatingText,
  useGameStage,
  stageCaptionStyle,
} from '../kit/GameShell';

gsap.registerPlugin(useGSAP);

/**
 * Catch what they love.
 *
 * Objects rise through the world and the player grabs the right ones. The
 * mechanic is old; what makes it a game rather than a list of buttons is
 * everything layered on it — a streak that escalates, objects that arrive in
 * designed waves rather than at random, and a round that visibly speeds up as
 * it goes.
 */

interface Floater {
  key: number;
  item: GameItem;
  leftPct: number;
  size: number;
  /** Slower, larger objects read as nearer; this drives both. */
  depth: number;
}

let seq = 0;

export default function TapTargets({ config, onWin, onLose }: EngineProps) {
  const art = useGameArt(config);
  const stage = useGameStage();
  // Destructured up front — reaching into `stage` inside render reads to the
  // lint rule (rightly) as touching a ref mid-render.
  const { stageRef, particlesRef } = stage;
  const combo = useCombo();
  const floating = useFloatingText();

  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [score, setScore] = useState(0);
  const settledRef = useRef(false);
  const scoreRef = useRef(0);

  const difficulty = useDifficulty(config.durationSec);
  /* Mirrored into a ref so the spawn loop and the per-object tweens can read
   * the current ramp without being rebuilt every time it ticks — re-arming
   * the spawn interval on each change would reset its phase and stutter.
   */
  const rampRef = useRef(1);
  useEffect(() => {
    rampRef.current = difficulty.ramp;
  }, [difficulty.ramp]);

  const finish = useCallback(
    (won: boolean) => {
      if (settledRef.current) return;
      settledRef.current = true;
      (won ? onWin : onLose)();
    },
    [onWin, onLose]
  );

  const secondsLeft = useCountdown(config.durationSec, () => finish(false));

    /* ---------------- Spawning ----------------
   *
   * Rate and hazard density are read from a ref rather than closed over, so the
   * single interval below keeps up with the difficulty ramp without being torn
   * down and rebuilt every time the ramp ticks (which would reset its phase and
   * make spawns stutter).
   */
  useEffect(() => {
    if (!art.goods.length) return;

    let cancelled = false;
    let timer = 0;

    const spawn = () => {
      if (cancelled || settledRef.current) return;

      const ramp = rampRef.current;
      const hazardChance = art.bads.length
        ? Math.min(0.42, (config.difficulty === 'medium' ? 0.22 : 0.14) * ramp)
        : 0;

      // Late in the round objects arrive in pairs — the same mechanic, but the
      // player suddenly has to choose, which is what makes the finale feel
      // like a finale rather than just "faster".
      const burst = rampRef.current > 1.45 && Math.random() < 0.4 ? 2 : 1;

      setFloaters((current) => {
        // A throttled tab can queue spawns; never let the stage flood.
        const trimmed = current.length > 12 ? current.slice(-8) : current;
        const added: Floater[] = [];

        for (let i = 0; i < burst; i++) {
          const useBad = Math.random() < hazardChance;
          const pool = useBad ? art.bads : art.goods;
          if (!pool.length) continue;
          const depth = 0.72 + Math.random() * 0.5;
          added.push({
            key: seq++,
            item: pool[(Math.random() * pool.length) | 0],
            leftPct: burst === 2 ? (i === 0 ? 14 + Math.random() * 26 : 56 + Math.random() * 26) : 10 + Math.random() * 72,
            size: 40 * depth,
            depth,
          });
        }
        return [...trimmed, ...added];
      });

      const base = config.difficulty === 'medium' ? 700 : 880;
      timer = window.setTimeout(spawn, Math.max(300, base / rampRef.current));
    };

    spawn();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [art.goods, art.bads, config.difficulty]);

  /* Each object rises once, then removes itself. */
  const attach = (el: HTMLButtonElement | null, floater: Floater) => {
    if (!el || el.dataset.animated) return;
    el.dataset.animated = '1';

    const remove = () => setFloaters((f) => f.filter((x) => x.key !== floater.key));
    const height = stageRef.current?.clientHeight ?? 380;
    // Nearer objects travel faster, which sells the depth.
    const travel = (config.difficulty === 'medium' ? 3 : 3.8) / (rampRef.current * floater.depth);

    if (reduceMotion()) {
      gsap.set(el, { y: -height * 0.45, autoAlpha: 1 });
      window.setTimeout(remove, 2800);
      return;
    }

    gsap.fromTo(
      el,
      { autoAlpha: 0, scale: 0.4 },
      { autoAlpha: 1, scale: 1, duration: 0.26, ease: 'back.out(2.4)' }
    );
    // A slow bob on top of the climb — objects feel buoyant, not on rails.
    gsap.to(el, {
      rotation: gsap.utils.random(-14, 14),
      duration: travel * 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to(el, {
      y: -(height + 110),
      x: gsap.utils.random(-30, 30),
      duration: travel,
      ease: 'none',
      onComplete: remove,
    });
  };

  const grab = (floater: Floater, el: HTMLButtonElement) => {
    if (settledRef.current) return;

    const { x, y } = stage.centreOf(el);
    gsap.killTweensOf(el);
    setFloaters((f) => f.filter((item) => item.key !== floater.key));

    if (floater.item.good) {
      const streak = combo.hit();
      const multiplier = streak >= 8 ? 3 : streak >= 4 ? 2 : 1;

      haptic(streak >= 4 ? 16 : 10);
      if (streak >= 4) sfx.combo(streak - 4);
      else sfx.collect(streak);

      stage.burstAt(x, y, {
        count: 12 + multiplier * 6,
        colors: [art.palette.accent, '#ffffff', '#f5c246'],
        power: 190 + multiplier * 40,
        size: 4.5,
        shape: multiplier > 1 ? 'spark' : 'circle',
      });
      stage.feel.punch(multiplier);
      if (multiplier > 1) stage.feel.flash(art.palette.accent, 0.16);

      floating.push(
        x, y,
        multiplier > 1 ? `+${multiplier}  ×${multiplier}` : '+1',
        multiplier > 1 ? art.palette.accent : '#ffffff',
        multiplier > 1
      );

      scoreRef.current = Math.min(config.targetCount, scoreRef.current + multiplier);
      setScore(scoreRef.current);
      if (scoreRef.current >= config.targetCount) {
        window.setTimeout(() => finish(true), 240);
      }
      return;
    }

    // A wrong grab breaks the streak and costs a point — never the round.
    // Losing outright to one mistap would make a doorway feel punishing.
    haptic(28);
    sfx.miss();
    combo.reset();
    stage.feel.shake(1.1);
    stage.feel.flash('#e0503c', 0.24);
    particlesRef.current?.puff(x, y, '#e0503c');
    floating.push(x, y, config.failLine ? 'אופס' : '−1', '#ff9b8a');

    scoreRef.current = Math.max(0, scoreRef.current - 1);
    setScore(scoreRef.current);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <GameShell
        stage={stage}
        theme={art.theme}
        speed={0.045 * difficulty.ramp}
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
        {floaters.map((floater) => (
          <button
            key={floater.key}
            ref={(el) => attach(el, floater)}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              grab(floater, e.currentTarget);
            }}
            aria-label={floater.item.label || (floater.item.good ? 'פריט' : 'מכשול')}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${floater.leftPct}%`,
              bottom: '-4rem',
              // A generous touch box around small art — the visible object can
              // be 34px and still be comfortable to hit with a thumb.
              padding: '0.6rem',
              margin: '-0.6rem',
              willChange: 'transform',
              zIndex: Math.round(floater.depth * 10),
            }}
          >
            <span
              className="relative flex items-center justify-center"
              style={{
                filter: floater.item.hazard
                  ? 'drop-shadow(0 0 10px rgba(224,80,60,0.85))'
                  : `drop-shadow(0 0 12px ${art.palette.accent}55)`,
              }}
            >
              <GameIconArt
                icon={floater.item.icon ?? undefined}
                emoji={floater.item.emoji}
                good={floater.item.good}
                size={floater.size}
              />
            </span>
            {floater.item.label && floater.depth > 1 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,0.42)', color: '#fff' }}
              >
                {floater.item.label}
              </span>
            )}
          </button>
        ))}

        {floating.layer}
      </GameShell>

      <Legend art={art} />
    </div>
  );
}

/**
 * What to chase and what to dodge, in the person's own objects.
 *
 * Sits under the stage rather than inside it: mid-game the player is looking
 * at the world, and a legend competing for that space costs more than it
 * teaches.
 */
function Legend({ art }: { art: ReturnType<typeof useGameArt> }) {
  const good = art.goods[0];
  const bad = art.bads[0];
  if (!good) return null;

  return (
    <div
      className="flex items-center justify-center gap-4 flex-wrap text-xs font-bold"
      style={stageCaptionStyle}
      dir="rtl"
    >
      <span className="flex items-center gap-1.5">
        <GameIconArt icon={good.icon ?? undefined} emoji={good.emoji} size={22} shadow={false} />
        <span style={{ color: '#fff' }}>{good.label || 'אספו'}</span>
      </span>
      {bad && (
        <span className="flex items-center gap-1.5" style={{ opacity: 0.85 }}>
          <GameIconArt icon={bad.icon ?? undefined} emoji={bad.emoji} good={false} size={22} shadow={false} />
          <span>היזהרו מ{bad.label || 'מכשולים'}</span>
        </span>
      )}
    </div>
  );
}
