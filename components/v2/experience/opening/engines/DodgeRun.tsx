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
  StageButton,
  stageCaptionStyle,
} from '../kit/GameShell';

gsap.registerPlugin(useGSAP);

/**
 * The journey — get there, collecting what matters and dodging what doesn't.
 *
 * A true side-scroller rather than the falling-objects grid this used to be:
 * the runner holds position while the world travels past them, which is what
 * makes it read as *going somewhere*. The parallax in `Scenery` is doing the
 * heavy lifting — three bands at different depths moving at different speeds
 * is the difference between "running" and "objects appearing".
 */

const TRACKS = 3;
/** Where the runner sits, as a fraction of stage width. */
const RUNNER_X = 0.2;
let seq = 0;

interface Obstacle {
  key: number;
  item: GameItem;
  track: number;
  /** Set once the collision at the runner's column has been resolved. */
  settled?: boolean;
}

export default function DodgeRun({ config, onWin, onLose }: EngineProps) {
  const art = useGameArt(config);
  const stage = useGameStage();
  // Destructured up front — reaching into `stage` inside render reads to the
  // lint rule (rightly) as touching a ref mid-render.
  const { stageRef, particlesRef } = stage;
  const combo = useCombo();
  const floating = useFloatingText();

  const runnerRef = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const trackRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const settledRef = useRef(false);

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

  // Outlasting the clock counts as arriving, provided they picked anything up.
  const secondsLeft = useCountdown(config.durationSec, () => finish(scoreRef.current > 0));

  /* ---------------- Controls ---------------- */

  const move = useCallback((delta: number) => {
    if (settledRef.current) return;
    const next = Math.max(0, Math.min(TRACKS - 1, trackRef.current + delta));
    if (next === trackRef.current) return;
    trackRef.current = next;
    setTrack(next);
    haptic(8);
    sfx.tap();

    // A tilt into the move — the runner leans the way they're going.
    if (runnerRef.current && !reduceMotion()) {
      gsap.fromTo(
        runnerRef.current,
        { rotation: delta * 16, scaleY: 0.88 },
        { rotation: 0, scaleY: 1, duration: 0.42, ease: 'back.out(2.4)' }
      );
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); move(-1); }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); move(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  /* Swipe and tap on the stage itself — the control people reach for first. */
  const touchRef = useRef<{ y: number; t: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    touchRef.current = { y: e.clientY, t: Date.now() };
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;

    const dy = e.clientY - start.y;
    if (Math.abs(dy) > 24) {
      move(dy > 0 ? 1 : -1);
      return;
    }
    // A tap (rather than a swipe) moves toward where they tapped.
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = (e.clientY - rect.top) / rect.height;
    const targetTrack = Math.min(TRACKS - 1, Math.max(0, Math.floor(rel * TRACKS)));
    move(Math.sign(targetTrack - trackRef.current));
  };

  /* ---------------- Spawning ---------------- */

  useEffect(() => {
    if (!art.items.length) return;
    let cancelled = false;
    let timer = 0;

    const spawn = () => {
      if (cancelled || settledRef.current) return;
      const ramp = rampRef.current;

      setObstacles((current) => {
        const trimmed = current.length > 10 ? current.slice(-7) : current;
        const useBad = art.bads.length > 0 && Math.random() < Math.min(0.5, 0.3 * ramp);
        const pool = useBad ? art.bads : art.goods;
        if (!pool.length) return trimmed;

        return [
          ...trimmed,
          {
            key: seq++,
            item: pool[(Math.random() * pool.length) | 0],
            track: (Math.random() * TRACKS) | 0,
          },
        ];
      });

      const base = config.difficulty === 'medium' ? 720 : 900;
      timer = window.setTimeout(spawn, Math.max(330, base / ramp));
    };

    spawn();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [art.items, art.goods, art.bads, config.difficulty]);

  /* ---------------- Motion + collision ---------------- */

  const attach = (el: HTMLDivElement | null, obstacle: Obstacle) => {
    if (!el || el.dataset.animated) return;
    el.dataset.animated = '1';

    const width = stageRef.current?.clientWidth ?? 340;
    const remove = () => setObstacles((o) => o.filter((x) => x.key !== obstacle.key));

    // The world's travel time across the stage — this is what "speed" means
    // to the player, and it tightens as the round builds.
    const duration = (config.difficulty === 'medium' ? 2.4 : 2.9) / rampRef.current;

    const resolve = () => {
      if (settledRef.current || obstacle.settled) return;
      obstacle.settled = true;
      if (obstacle.track !== trackRef.current) return;

      const { x, y } = stage.centreOf(el);

      if (obstacle.item.good) {
        const streak = combo.hit();
        const multiplier = streak >= 8 ? 3 : streak >= 4 ? 2 : 1;
        haptic(12);
        if (streak >= 4) sfx.combo(streak - 4);
        else sfx.collect(streak);

        stage.burstAt(x, y, {
          count: 12 + multiplier * 5,
          colors: [art.palette.accent, '#ffffff', '#f5c246'],
          power: 200,
          shape: multiplier > 1 ? 'spark' : 'circle',
        });
        stage.feel.punch(multiplier);
        floating.push(x, y, multiplier > 1 ? `×${multiplier}` : '+1', '#ffffff', multiplier > 1);

        scoreRef.current = Math.min(config.targetCount, scoreRef.current + multiplier);
        setScore(scoreRef.current);
        gsap.killTweensOf(el);
        remove();

        if (scoreRef.current >= config.targetCount) window.setTimeout(() => finish(true), 220);
        return;
      }

      // A hit: costs a life and the streak, and is felt hard — but three of
      // them are allowed, so one mistake never ends the run.
      haptic(30);
      sfx.miss();
      combo.reset();
      stage.feel.shake(1.5);
      stage.feel.flash('#e0503c', 0.3);
      particlesRef.current?.puff(x, y, '#e0503c');
      floating.push(x, y, '!', '#ff9b8a', true);

      livesRef.current -= 1;
      setLives(livesRef.current);

      if (runnerRef.current && !reduceMotion()) {
        // A stagger, and a blink so the hit is unmistakable.
        gsap.fromTo(runnerRef.current, { x: -14 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' });
        gsap.fromTo(runnerRef.current, { opacity: 0.25 }, { opacity: 1, duration: 0.14, repeat: 3 });
      }

      gsap.killTweensOf(el);
      remove();
      if (livesRef.current <= 0) window.setTimeout(() => finish(false), 260);
    };

    if (reduceMotion()) {
      gsap.set(el, { x: -width * (1 - RUNNER_X) });
      window.setTimeout(() => { resolve(); remove(); }, duration * 1000);
      return;
    }

    // Objects bob gently as they travel, so a lane of them isn't a straight line.
    gsap.to(el, {
      y: gsap.utils.random(-7, 7),
      duration: 0.9,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.fromTo(
      el,
      { x: 0 },
      {
        // Travels the full stage width plus its own size, so it clears cleanly.
        x: -(width + 90),
        duration,
        ease: 'none',
        onUpdate() {
          // Resolve exactly as the object passes the runner's column, read from
          // the live transform — the tween is the source of truth and state
          // would always be a frame behind.
          if (obstacle.settled) return;
          const travelled = -(gsap.getProperty(el, 'x') as number);
          if (travelled >= width * (1 - RUNNER_X) - 26) resolve();
        },
        onComplete: remove,
      }
    );
  };

  /* ---------------- Runner ---------------- */

  // A continuous run cycle: a small vertical bounce with a squash at the bottom.
  useGSAP(
    () => {
      const el = runnerRef.current;
      if (!el || reduceMotion()) return;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(el, { y: -11, duration: 0.28, ease: 'power2.out' })
        .to(el, { y: 0, duration: 0.24, ease: 'power2.in' })
        .to(el, { scaleY: 0.9, scaleX: 1.08, duration: 0.07, ease: 'power2.out' })
        .to(el, { scaleY: 1, scaleX: 1, duration: 0.12, ease: 'back.out(3)' });
      return () => tl.kill();
    },
    { scope: stageRef }
  );

  const trackTop = (index: number) => `${((index + 0.5) * 100) / TRACKS}%`;

  return (
    <div className="flex flex-col gap-3 w-full">
      <GameShell
        stage={stage}
        theme={art.theme}
        // The world's speed IS the difficulty — the player sees the round
        // accelerate rather than being told it did.
        speed={0.3 * difficulty.ramp}
        tall
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
            lives={lives}
          />
        }
      >
        <div
          className="absolute inset-0"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {/* Track guides — just enough to read the three rows, no more. */}
          {Array.from({ length: TRACKS - 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-x-0"
              style={{
                top: `${((i + 1) * 100) / TRACKS}%`,
                height: 1,
                background: 'rgba(255,255,255,0.14)',
              }}
            />
          ))}

          {obstacles.map((obstacle) => (
            <div
              key={obstacle.key}
              className="absolute"
              style={{
                right: '-3rem',
                top: trackTop(obstacle.track),
                transform: 'translateY(-50%)',
                willChange: 'transform',
              }}
            >
              <div
                ref={(el) => attach(el, obstacle)}
                style={{
                  filter: obstacle.item.good
                    ? `drop-shadow(0 0 12px ${art.palette.accent}66)`
                    : 'drop-shadow(0 0 12px rgba(224,80,60,0.85))',
                }}
              >
                <GameIconArt
                  icon={obstacle.item.icon ?? undefined}
                  emoji={obstacle.item.emoji}
                  good={obstacle.item.good}
                  size={42}
                />
              </div>
            </div>
          ))}

          {/* The runner */}
          <div
            className="absolute transition-[top] duration-200 ease-out"
            style={{
              left: `${RUNNER_X * 100}%`,
              top: trackTop(track),
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
            }}
          >
            <div ref={runnerRef} className="relative">
              {/* Contact shadow — grounds the character in the world. */}
              <span
                className="absolute rounded-full"
                style={{
                  width: '2.6rem', height: '0.5rem',
                  left: '50%', bottom: '-0.7rem',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.4)',
                  filter: 'blur(3px)',
                }}
                aria-hidden="true"
              />
              <Runner art={art} />
            </div>
          </div>

          {floating.layer}
        </div>
      </GameShell>

      {/* Explicit controls. The stage takes swipes and taps, but these are the
        * only route for anyone using a keyboard or a switch device. */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: '▲', delta: -1, name: 'למעלה' },
          { label: '▼', delta: 1, name: 'למטה' },
        ].map((btn) => (
          <StageButton key={btn.name} label={btn.name} onPress={() => move(btn.delta)}>
            {btn.label}
          </StageButton>
        ))}
      </div>

      <p className="text-center text-xs" style={stageCaptionStyle}>
        החליקו למעלה ולמטה כדי לזוז
      </p>
    </div>
  );
}

/**
 * The character.
 *
 * When the config named an avatar (or we can borrow the thing being collected)
 * that art *is* the runner, which is what makes it "Dani running to the match"
 * rather than a generic sprite. Otherwise we draw a simple figure — still a
 * character, never a placeholder box.
 */
function Runner({ art }: { art: ReturnType<typeof useGameArt> }) {
  if (art.avatar.icon || art.avatar.emoji) {
    return (
      <span style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
        <GameIconArt
          icon={art.avatar.icon ?? undefined}
          emoji={art.avatar.emoji}
          size={52}
          shadow={false}
        />
      </span>
    );
  }

  return (
    <svg width="48" height="52" viewBox="0 0 48 52" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
      <circle cx="24" cy="11" r="8" fill="#f0d0b8" />
      <path d="M20 6a6 6 0 0110 3c-3 1-8 1-10-3z" fill="#3b2412" />
      <path d="M18 19h12l3 15H15z" fill="#e0503c" />
      <path d="M15 34l-3 12h6l3-9 3 9h6l-3-12z" fill="#2c3e60" />
      <path d="M18 21l-7 8 3 3 6-6z" fill="#f0d0b8" />
      <path d="M30 21l7 6-3 4-6-5z" fill="#f0d0b8" />
    </svg>
  );
}
