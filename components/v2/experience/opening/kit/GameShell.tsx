'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { GameTheme } from '@/lib/v2/opening/art';
import { reduceMotion } from '../engines/shared';
import Scenery, { SceneryPalette, themePalette } from './Scenery';
import { GameFeel, ParticleCanvas, ParticleHandle, useGameFeel } from './feel';

gsap.registerPlugin(useGSAP);

/**
 * The frame every mini-game is built in.
 *
 * Engines declare *gameplay*; this owns everything around it — the world, the
 * HUD, the particle canvas, the camera feel. That split is what keeps the
 * quality bar even: a new mechanic inherits parallax, combo feedback, a
 * progress ring and the victory choreography without reimplementing any of it,
 * and a fix to the feel lands in all six games at once.
 */

/* ------------------------------------------------------------------ *
 * Stage plumbing
 * ------------------------------------------------------------------ */

export interface GameStage {
  stageRef: React.RefObject<HTMLDivElement | null>;
  flashRef: React.RefObject<HTMLDivElement | null>;
  particlesRef: React.RefObject<ParticleHandle | null>;
  feel: GameFeel;
  /** Fires a burst at a point, in stage-relative px. */
  burstAt: (x: number, y: number, options?: Parameters<ParticleHandle['burst']>[2]) => void;
  /** Converts a client rect (from an element) into stage-relative centre px. */
  centreOf: (el: Element) => { x: number; y: number };
}

export function useGameStage(): GameStage {
  const stageRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<ParticleHandle>(null);
  const feel = useGameFeel(stageRef, flashRef);

  const centreOf = useCallback((el: Element) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }, []);

  const burstAt = useCallback(
    (x: number, y: number, options?: Parameters<ParticleHandle['burst']>[2]) => {
      particlesRef.current?.burst(x, y, options);
    },
    []
  );

  return { stageRef, flashRef, particlesRef, feel, burstAt, centreOf };
}

/* ------------------------------------------------------------------ *
 * Difficulty progression
 * ------------------------------------------------------------------ */

export type GamePhase = 'warmup' | 'rising' | 'peak' | 'finale';

export interface Difficulty {
  /** 0 → 1 across the whole round. */
  t: number;
  phase: GamePhase;
  /** Multiply spawn rates / speeds by this. Climbs ~0.8 → ~1.7. */
  ramp: number;
  /** True in the closing seconds, for a final push of intensity. */
  isFinale: boolean;
}

/**
 * Gives every game a beginning, a middle and an end.
 *
 * Without this a 30-second game is 30 seconds of the same thing, which is what
 * made the old ones feel like a loop rather than a designed round. The ramp is
 * intentionally gentle and the finale short — the goal is a round that *builds*
 * while still being winnable in one or two tries, because the prize behind it
 * is a greeting, not a high score.
 */
export function useDifficulty(durationSec: number, base = 1): Difficulty {
  const [t, setT] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      // Wall-clock driven, like the countdown — a throttled tab must not be
      // able to hold the game in its easy phase forever.
      const elapsed = (Date.now() - startRef.current) / 1000;
      setT(Math.min(1, elapsed / Math.max(1, durationSec)));
    }, 250);
    return () => window.clearInterval(id);
  }, [durationSec]);

  return useMemo(() => {
    const phase: GamePhase =
      t < 0.18 ? 'warmup' : t < 0.55 ? 'rising' : t < 0.85 ? 'peak' : 'finale';
    // Eased rather than linear so the step up is felt as moments, not drift.
    const ramp = base * (0.82 + Math.pow(t, 0.8) * 0.92);
    return { t, phase, ramp, isFinale: phase === 'finale' };
  }, [t, base]);
}

/* ------------------------------------------------------------------ *
 * Combo
 * ------------------------------------------------------------------ */

export interface Combo {
  count: number;
  /** 1× until 3 in a row, then 2×, then 3×. */
  multiplier: number;
  hit(): number;
  reset(): void;
}

/**
 * A streak counter with escalating reward.
 *
 * The multiplier is what turns "tap things" into "keep the run alive" — it
 * gives a 30-second game an arc the player is authoring themselves.
 */
export function useCombo(): Combo {
  const [count, setCount] = useState(0);
  const ref = useRef(0);

  const hit = useCallback(() => {
    ref.current += 1;
    setCount(ref.current);
    return ref.current;
  }, []);

  const reset = useCallback(() => {
    ref.current = 0;
    setCount(0);
  }, []);

  const multiplier = count >= 8 ? 3 : count >= 4 ? 2 : 1;
  return { count, multiplier, hit, reset };
}

/* ------------------------------------------------------------------ *
 * Floating feedback
 * ------------------------------------------------------------------ */

interface Pop {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  big?: boolean;
}

let popSeq = 0;

/**
 * The "+1" / "מושלם!" that lifts off the point of impact.
 *
 * Rendered in the stage's own coordinate space so it can be fired from a
 * collision anywhere on screen, and self-removing so engines never have to
 * clean it up.
 */
export function useFloatingText() {
  const [pops, setPops] = useState<Pop[]>([]);

  const push = useCallback((x: number, y: number, text: string, color: string, big = false) => {
    const id = popSeq++;
    setPops((p) => [...p.slice(-8), { id, x, y, text, color, big }]);
    window.setTimeout(() => setPops((p) => p.filter((item) => item.id !== id)), 900);
  }, []);

  const layer = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {pops.map((pop) => (
        <FloatingPop key={pop.id} pop={pop} />
      ))}
    </div>
  );

  return { push, layer };
}

function FloatingPop({ pop }: { pop: Pop }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (reduceMotion()) {
        gsap.set(el, { opacity: 1, y: -18 });
        return;
      }
      gsap
        .timeline()
        .fromTo(
          el,
          { y: 0, opacity: 0, scale: 0.5 },
          { y: -14, opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(3)' }
        )
        .to(el, { y: -52, opacity: 0, duration: 0.55, ease: 'power2.in' }, '+=0.12');
    },
    { scope: ref }
  );

  return (
    <span
      ref={ref}
      className="absolute font-black whitespace-nowrap"
      style={{
        left: pop.x,
        top: pop.y,
        transform: 'translate(-50%, -50%)',
        color: pop.color,
        fontSize: pop.big ? 'clamp(1.3rem, 6vw, 1.9rem)' : 'clamp(0.95rem, 4vw, 1.2rem)',
        textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.3)',
        opacity: 0,
      }}
    >
      {pop.text}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * HUD
 * ------------------------------------------------------------------ */

interface HudProps {
  palette: SceneryPalette;
  score: number;
  target: number;
  goalLabel?: string;
  secondsLeft?: number;
  totalSeconds?: number;
  comboCount?: number;
  comboMultiplier?: number;
  lives?: number;
  maxLives?: number;
}

/**
 * The status bar, floated over the world rather than stacked above it.
 *
 * Progress reads as filled pips instead of "3/5" text: at a glance, mid-game,
 * on a phone, a row of lit dots is legible in a way a fraction is not — and it
 * makes the last pip lighting up feel like an event.
 */
export function GameHud({
  palette,
  score,
  target,
  goalLabel,
  secondsLeft,
  totalSeconds,
  comboCount = 0,
  comboMultiplier = 1,
  lives,
  maxLives = 3,
}: HudProps) {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  // The score punches on change — the number itself acknowledges the hit.
  useGSAP(
    () => {
      const el = scoreRef.current;
      if (!el || !score || reduceMotion()) return;
      gsap.fromTo(el, { scale: 1.5 }, { scale: 1, duration: 0.34, ease: 'back.out(3)' });
    },
    { dependencies: [score] }
  );

  useGSAP(
    () => {
      const el = comboRef.current;
      if (!el || comboCount < 2 || reduceMotion()) return;
      gsap.fromTo(
        el,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.6)' }
      );
    },
    { dependencies: [comboCount] }
  );

  const urgent = secondsLeft !== undefined && secondsLeft <= 5;
  const chip = 'flex items-center gap-1.5 rounded-full font-bold tabular-nums backdrop-blur-md';
  const chipStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.34)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: '#fff',
    padding: '0.4rem 0.8rem',
    fontSize: '0.82rem',
    boxShadow: '0 6px 18px -10px rgba(0,0,0,0.9)',
  };

  return (
    <div
      className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 pointer-events-none"
      dir="rtl"
    >
      {/* Progress */}
      <div className="flex flex-col items-start gap-1.5">
        <div className={chip} style={chipStyle}>
          {goalLabel && <span style={{ opacity: 0.85, fontWeight: 700 }}>{goalLabel}</span>}
          <span ref={scoreRef} style={{ display: 'inline-block', fontWeight: 900 }}>
            {score}
          </span>
          <span style={{ opacity: 0.6 }}>/ {target}</span>
        </div>

        {/* Pips. Capped so a 10-target game doesn't overflow a phone. */}
        {target <= 10 && (
          <div className="flex gap-1 px-1">
            {Array.from({ length: target }).map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i < score ? '1.15rem' : '0.42rem',
                  height: '0.42rem',
                  background: i < score ? palette.accent : 'rgba(255,255,255,0.4)',
                  boxShadow: i < score ? `0 0 10px ${palette.accent}` : 'none',
                }}
              />
            ))}
          </div>
        )}

        {comboCount >= 2 && (
          <div
            ref={comboRef}
            className="rounded-full font-black backdrop-blur-md"
            style={{
              padding: '0.25rem 0.7rem',
              fontSize: '0.75rem',
              background: comboMultiplier > 1 ? palette.accent : 'rgba(0,0,0,0.34)',
              color: comboMultiplier > 1 ? '#0b0b0b' : '#fff',
              border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: comboMultiplier > 1 ? `0 0 20px -4px ${palette.accent}` : 'none',
            }}
          >
            רצף {comboCount}
            {comboMultiplier > 1 ? ` · ×${comboMultiplier}` : ''}
          </div>
        )}
      </div>

      {/* Clock + lives */}
      <div className="flex flex-col items-end gap-1.5">
        {secondsLeft !== undefined && (
          <div
            className={chip}
            style={{
              ...chipStyle,
              background: urgent ? '#e0503c' : chipStyle.background,
              borderColor: urgent ? '#ff9b8a' : 'rgba(255,255,255,0.22)',
            }}
          >
            <TimerRing
              value={totalSeconds ? secondsLeft / totalSeconds : 1}
              urgent={urgent}
            />
            <span style={{ fontWeight: 900 }}>{secondsLeft}</span>
          </div>
        )}

        {lives !== undefined && (
          <div className="flex gap-1" aria-label={`${lives} חיים`}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <Life key={i} filled={i < lives} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimerRing({ value, urgent }: { value: number; urgent: boolean }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r={r} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.4" />
      <circle
        cx="9" cy="9" r={r}
        fill="none"
        stroke={urgent ? '#fff' : '#fff'}
        strokeOpacity={urgent ? 1 : 0.85}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
        transform="rotate(-90 9 9)"
        style={{ transition: 'stroke-dashoffset 240ms linear' }}
      />
    </svg>
  );
}

function Life({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21S3 14.5 3 8.8C3 5.6 5.5 3.3 8.3 3.3c1.8 0 3.1 1 3.7 1.9.6-.9 1.9-1.9 3.7-1.9C18.5 3.3 21 5.6 21 8.8 21 14.5 12 21 12 21z"
        fill={filled ? '#e0503c' : 'rgba(255,255,255,0.22)'}
        stroke={filled ? '#ff9b8a' : 'rgba(255,255,255,0.35)'}
        strokeWidth="1.2"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */

interface ShellProps {
  stage: GameStage;
  theme: GameTheme;
  /** World scroll speed; 0 holds the scene still. */
  speed?: number;
  hud?: React.ReactNode;
  children: React.ReactNode;
  /** Extra height for engines that need more room (the lane runner). */
  tall?: boolean;
}

/**
 * The play surface: world at the back, gameplay in the middle, effects on top.
 *
 * Sized in `svh` (with a `vh` fallback) and capped, because a stage measured in
 * plain `vh` sits under the mobile browser's own toolbar — which on a phone is
 * exactly where the bottom row of a game ends up being unreachable.
 */
export function GameShell({ stage, theme, speed = 0, hud, children, tall = false }: ShellProps) {
  const palette = themePalette(theme);
  // Destructured up front: `stage` is a plain object that happens to hold
  // refs, and reaching into it inside JSX reads to the lint rule (rightly) as
  // touching a ref mid-render.
  const { stageRef, flashRef, particlesRef } = stage;

  return (
    <div
      ref={stageRef}
      className="relative w-full overflow-hidden rounded-[1.75rem] touch-none select-none"
      style={{
        height: tall ? 'min(64svh, 34rem)' : 'min(58svh, 30rem)',
        minHeight: '18rem',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 30px 70px -38px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)',
        background: palette.sky,
      }}
    >
      <Scenery theme={theme} speed={speed} />

      {/* Gameplay */}
      <div className="absolute inset-0">{children}</div>

      {/* Effects sit above gameplay but below the HUD. */}
      <ParticleCanvas ref={particlesRef} className="z-10" />

      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none z-10 mix-blend-screen"
        style={{ opacity: 0 }}
        aria-hidden="true"
      />

      {/* A soft vignette so the HUD always has something to sit against, on
        * every theme, without needing a per-theme rule. */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.32) 100%)',
        }}
        aria-hidden="true"
      />

      {hud}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Below-stage chrome
 * ------------------------------------------------------------------ */

/**
 * Captions and controls sit on the play backdrop, not on the page.
 *
 * During a round the page is a dark wash of the theme's sky, whatever the
 * greeting's template happens to be — so anything below the stage has to be
 * styled for *that*, not for the template palette. Reading these off
 * `template.palette` (as the engines first did) meant a light template put
 * pale grey text on a near-black backdrop and the hint became invisible.
 */
export const stageCaptionStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.74)',
  textShadow: '0 1px 10px rgba(0,0,0,0.8)',
};

/** A control below the stage — matched to the HUD's glass, for one language. */
export function StageButton({
  children,
  label,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label={label}
      className="rounded-2xl py-3.5 text-xl font-black active:scale-95 transition-transform backdrop-blur-md"
      style={{
        background: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.28)',
        color: '#fff',
        boxShadow: '0 8px 22px -14px rgba(0,0,0,0.9)',
      }}
    >
      {children}
    </button>
  );
}

export { themePalette };
export type { SceneryPalette };
