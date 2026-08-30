'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import gsap from 'gsap';
import { reduceMotion } from '../engines/shared';

/**
 * Game feel — the layer that makes an interaction *land*.
 *
 * A tap that only changes a number reads as a form control. The same tap with
 * a burst of particles, a shove of the camera and a rising blip reads as a
 * game. None of this changes what the rules do; all of it changes whether the
 * player believes they did something. It is deliberately separated from the
 * engines so every mechanic gets the same vocabulary of feedback.
 *
 * Everything here degrades to nothing under `prefers-reduced-motion` — the
 * games stay fully playable, they just stop shouting.
 */

/* ------------------------------------------------------------------ *
 * Particles
 * ------------------------------------------------------------------ */

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  gravity: number;
  spin: number;
  rot: number;
  shape: 'circle' | 'rect' | 'spark';
}

export interface BurstOptions {
  /** Stage-relative coordinates, in px. */
  count?: number;
  colors?: string[];
  /** Base speed in px/sec. */
  power?: number;
  spread?: number;
  gravity?: number;
  size?: number;
  shape?: Particle['shape'];
  /** Bias the spray in one direction, in radians. Omit for a full circle. */
  angle?: number;
}

export interface ParticleHandle {
  /** A hit, a collect, a match — the workhorse. */
  burst(x: number, y: number, options?: BurstOptions): void;
  /** The victory shower, from the top of the stage. */
  rain(options?: { count?: number; colors?: string[] }): void;
  /** A soft puff, for near-misses and gentle feedback. */
  puff(x: number, y: number, color: string): void;
}

/**
 * One canvas per stage, driving every particle in that game.
 *
 * Canvas rather than DOM nodes because a good collect effect is 20+ pieces and
 * a combo can fire several at once — that is hundreds of elements a second,
 * which would thrash layout on exactly the mid-range phones this has to stay
 * smooth on. The rAF loop parks itself the moment the pool empties, so an idle
 * game costs nothing.
 */
export const ParticleCanvas = forwardRef<ParticleHandle, { className?: string }>(
  function ParticleCanvas({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poolRef = useRef<Particle[]>([]);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

    /* Keep the backing store matched to the CSS box and the device pixel
     * ratio, or particles land half a pixel off and look soft. */
    useEffect(() => {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (!canvas || !parent) return;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const { width, height } = parent.getBoundingClientRect();
        sizeRef.current = { w: width, h: height, dpr };
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      };

      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      return () => observer.disconnect();
    }, []);

    /* The loop lives inside `start` as a self-referencing local rather than a
     * `useCallback` that calls itself — a hook value cannot reference itself
     * at declaration time, and hoisting it out would only add an indirection
     * for a function that has no reason to exist between frames. */
    const start = useCallback(() => {
      if (rafRef.current !== null) return;

      const step = (now: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) {
          rafRef.current = null;
          return;
        }

        // Clamp dt so a backgrounded tab doesn't teleport everything off-stage
        // the instant it resumes.
        const dt = Math.min((now - lastRef.current) / 1000, 0.05);
        lastRef.current = now;

        const { dpr } = sizeRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h);

        const pool = poolRef.current;
        for (let i = pool.length - 1; i >= 0; i--) {
          const p = pool[i];
          p.life -= dt;
          if (p.life <= 0) {
            pool.splice(i, 1);
            continue;
          }

          p.vy += p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;

          const t = p.life / p.maxLife;
          ctx.globalAlpha = Math.min(1, t * 1.6);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'spark') {
            // A stretched streak along the direction of travel — reads as speed.
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.fillRect(0, -p.size * 0.28, p.size * 2.4 * t, p.size * 0.56);
            ctx.restore();
          } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
            ctx.restore();
          }
        }
        ctx.globalAlpha = 1;

        rafRef.current = pool.length ? requestAnimationFrame(step) : null;
      };

      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(step);
    }, []);

    useEffect(
      () => () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      },
      []
    );

    useImperativeHandle(
      ref,
      (): ParticleHandle => ({
        burst(x, y, options = {}) {
          if (reduceMotion()) return;
          const {
            count = 16,
            colors = ['#f5c246', '#fdfdfd', '#f2a0b5'],
            power = 210,
            spread = Math.PI * 2,
            gravity = 420,
            size = 5,
            shape = 'circle',
            angle,
          } = options;

          const pool = poolRef.current;
          // Hard ceiling: a frantic player mashing a combo must never be able
          // to grow this without bound.
          if (pool.length > 320) pool.splice(0, pool.length - 260);

          for (let i = 0; i < count; i++) {
            const base = angle ?? 0;
            const a = angle === undefined
              ? Math.random() * Math.PI * 2
              : base + (Math.random() - 0.5) * spread;
            const speed = power * (0.45 + Math.random() * 0.75);
            pool.push({
              x, y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              life: 0.45 + Math.random() * 0.45,
              maxLife: 0.9,
              size: size * (0.6 + Math.random() * 0.8),
              color: colors[(Math.random() * colors.length) | 0],
              gravity,
              spin: (Math.random() - 0.5) * 14,
              rot: Math.random() * Math.PI,
              shape,
            });
          }
          start();
        },

        rain(options = {}) {
          if (reduceMotion()) return;
          const {
            count = 90,
            colors = ['#f5c246', '#e0503c', '#7fb2e5', '#b9f0a0', '#f2a0b5', '#fdfdfd'],
          } = options;
          const { w } = sizeRef.current;
          const pool = poolRef.current;

          for (let i = 0; i < count; i++) {
            pool.push({
              x: Math.random() * w,
              y: -20 - Math.random() * 120,
              vx: (Math.random() - 0.5) * 90,
              vy: 130 + Math.random() * 190,
              life: 1.7 + Math.random() * 1.4,
              maxLife: 3.1,
              size: 5 + Math.random() * 5,
              color: colors[(Math.random() * colors.length) | 0],
              gravity: 130,
              spin: (Math.random() - 0.5) * 12,
              rot: Math.random() * Math.PI,
              shape: 'rect',
            });
          }
          start();
        },

        puff(x, y, color) {
          if (reduceMotion()) return;
          const pool = poolRef.current;
          for (let i = 0; i < 7; i++) {
            const a = Math.random() * Math.PI * 2;
            pool.push({
              x, y,
              vx: Math.cos(a) * 55,
              vy: Math.sin(a) * 55 - 30,
              life: 0.35 + Math.random() * 0.2,
              maxLife: 0.55,
              size: 4 + Math.random() * 3,
              color,
              gravity: 60,
              spin: 0,
              rot: 0,
              shape: 'circle',
            });
          }
          start();
        },
      }),
      [start]
    );

    return (
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
        aria-hidden="true"
      />
    );
  }
);

/* ------------------------------------------------------------------ *
 * Camera feel
 * ------------------------------------------------------------------ */

export interface GameFeel {
  /** Shoves the stage — impact, mistake, big moment. */
  shake(strength?: number): void;
  /** Washes the stage in a colour for a beat. */
  flash(color: string, strength?: number): void;
  /** A quick punch of scale. Reads as weight on a big hit. */
  punch(strength?: number): void;
}

/**
 * Camera-level feedback for one stage.
 *
 * The flash is painted into a dedicated overlay element rather than by tinting
 * the stage itself, so it can never disturb the layout of live game objects
 * mid-frame.
 */
export function useGameFeel(
  stageRef: React.RefObject<HTMLElement | null>,
  flashRef: React.RefObject<HTMLElement | null>
): GameFeel {
  const shake = useCallback(
    (strength = 1) => {
      const el = stageRef.current;
      if (!el || reduceMotion()) return;
      gsap.killTweensOf(el, 'x,y');
      gsap.fromTo(
        el,
        { x: -6 * strength, y: 2 * strength },
        { x: 0, y: 0, duration: 0.42 * Math.min(strength, 1.6), ease: 'elastic.out(1, 0.32)' }
      );
    },
    [stageRef]
  );

  const flash = useCallback(
    (color: string, strength = 0.32) => {
      const el = flashRef.current;
      if (!el || reduceMotion()) return;
      gsap.killTweensOf(el);
      gsap.set(el, { background: color });
      gsap.fromTo(
        el,
        { opacity: strength },
        { opacity: 0, duration: 0.42, ease: 'power2.out' }
      );
    },
    [flashRef]
  );

  const punch = useCallback(
    (strength = 1) => {
      const el = stageRef.current;
      if (!el || reduceMotion()) return;
      gsap.killTweensOf(el, 'scale');
      gsap.fromTo(
        el,
        { scale: 1 + 0.018 * strength },
        { scale: 1, duration: 0.34, ease: 'elastic.out(1, 0.4)' }
      );
    },
    [stageRef]
  );

  return { shake, flash, punch };
}

/* ------------------------------------------------------------------ *
 * Sound
 * ------------------------------------------------------------------ */

/**
 * Synthesised sound effects — no audio files.
 *
 * Every sound here is a few oscillators and an envelope, which means the whole
 * effect set costs zero bytes of download and zero loading time. That matters
 * more than fidelity for a doorway that has to open instantly on a phone on
 * mobile data; it also means sound can never be the reason a game is slow to
 * start.
 *
 * The context is created lazily on first play, which is always inside the tap
 * that starts the game — browsers block audio created any earlier.
 */
let audioCtx: AudioContext | null = null;
let muted = false;

function ctx(): AudioContext | null {
  if (muted) return null;
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    // Safari suspends the context when the tab loses focus; nudge it back.
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

/** One shaped tone. The building block for every effect below. */
function tone(
  freq: number,
  duration: number,
  options: {
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    /** Slides to this frequency across the note — the "blip" in a collect. */
    sweepTo?: number;
  } = {}
) {
  const ac = ctx();
  if (!ac) return;

  const { type = 'sine', gain = 0.14, delay = 0, sweepTo } = options;
  const t0 = ac.currentTime + delay;

  const osc = ac.createOscillator();
  const amp = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
  }

  // A short attack and an exponential tail — anything sharper clicks, anything
  // longer smears into the next hit during a combo.
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A pentatonic ladder, so stacked combo notes always sound consonant. */
const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

export const sfx = {
  tap() {
    tone(440, 0.07, { type: 'triangle', gain: 0.08, sweepTo: 560 });
  },
  /** Rises with the combo, so a streak literally sounds like it's climbing. */
  collect(step = 0) {
    const note = LADDER[Math.min(step, LADDER.length - 1)];
    tone(note, 0.13, { type: 'triangle', gain: 0.12, sweepTo: note * 1.5 });
  },
  combo(step = 0) {
    const note = LADDER[Math.min(step, LADDER.length - 1)];
    tone(note, 0.16, { type: 'triangle', gain: 0.13, sweepTo: note * 1.6 });
    tone(note * 2, 0.13, { type: 'sine', gain: 0.06, delay: 0.03 });
  },
  miss() {
    tone(190, 0.19, { type: 'sawtooth', gain: 0.07, sweepTo: 96 });
  },
  /** The doorway opening. Deliberately the biggest sound in the set. */
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, 0.42, { type: 'triangle', gain: 0.12, delay: i * 0.085 })
    );
    tone(1318.51, 0.6, { type: 'sine', gain: 0.07, delay: 0.34 });
  },
  unlock() {
    tone(196, 0.75, { type: 'sine', gain: 0.1, sweepTo: 784 });
    [784, 987.77, 1174.66].forEach((f, i) =>
      tone(f, 0.55, { type: 'triangle', gain: 0.09, delay: 0.16 + i * 0.06 })
    );
  },
  flip() {
    tone(320, 0.06, { type: 'sine', gain: 0.07, sweepTo: 420 });
  },
};
