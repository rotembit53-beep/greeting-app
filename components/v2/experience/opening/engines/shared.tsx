'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TemplateDef } from '@/lib/v2/templates';
import { MediaItem } from '@/lib/v2/types';
import { OpeningConfig } from '@/lib/v2/opening/types';

/**
 * The contract every engine implements.
 *
 * An engine renders one mechanic and reports the outcome. It owns no copy of
 * its own — every player-facing word comes from `config`, which is what makes
 * two greetings using the same mechanic feel like different games.
 */
export interface EngineProps {
  config: OpeningConfig;
  template: TemplateDef;
  /** Available when `config.usePhotos` is set; otherwise empty. */
  photos: MediaItem[];
  onWin: () => void;
  onLose: () => void;
}

export const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A short, quiet tap — enough to feel physical on a phone, never a buzz. */
export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Unsupported or blocked by permissions policy — purely decorative.
  }
}

/**
 * Deterministic-enough shuffle. Not cryptographic — it only decides where the
 * cards sit.
 */
export function shuffle<T>(input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A countdown for the lifetime of the component.
 *
 * Drives the clock off wall time rather than counting interval ticks: a
 * backgrounded tab throttles timers, and a tick-counting clock would silently
 * hand the player extra seconds (or freeze) instead of expiring.
 *
 * There is deliberately no "restart" input — a retry remounts the engine (the
 * orchestrator keys it on the attempt), so the clock resets by construction
 * rather than through a reset path that could drift out of step with it.
 */
export function useCountdown(seconds: number, onExpire: () => void) {
  const [left, setLeft] = useState(seconds);
  const onExpireRef = useRef(onExpire);

  // Kept current without writing to the ref during render, so the interval
  // below always calls the latest callback without re-arming the timer.
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const endAt = Date.now() + seconds * 1000;
    let expired = false;

    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0 && !expired) {
        expired = true;
        window.clearInterval(id);
        onExpireRef.current();
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [seconds]);

  return left;
}

/**
 * An entrance reveal that cannot leave content invisible.
 *
 * GSAP is driven by requestAnimationFrame, which a browser suspends entirely
 * when the tab isn't painting (backgrounded, a low-power webview, an inactive
 * window). A `fromTo` starting at `autoAlpha: 0` then freezes on frame 0 —
 * and since these reveals carry the *start button*, that would leave the
 * recipient staring at an empty screen with no way into their greeting.
 *
 * So the tween is backed by a plain timer that forces it to its end state.
 * Timers are throttled in background tabs but still fire, which is the same
 * reasoning behind the failsafe on the classic gate. When rAF is running the
 * tween has already finished and `progress(1)` is a no-op.
 *
 * Returns a cleanup that useGSAP callbacks can hand back.
 */
export function safeReveal(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
  fromVars: gsap.TweenVars = { y: 22, autoAlpha: 0 }
): () => void {
  if (reduceMotion()) {
    gsap.set(targets, { ...vars, delay: 0, stagger: 0, duration: 0 });
    return () => {};
  }

  const tween = gsap.fromTo(targets, fromVars, vars);

  const duration = (vars.duration as number) ?? 0.5;
  const delay = (vars.delay as number) ?? 0;
  const stagger = (vars.stagger as number) ?? 0;
  const count = gsap.utils.toArray(targets).length;
  const totalMs = (delay + duration + stagger * Math.max(0, count - 1)) * 1000 + 600;

  const id = window.setTimeout(() => tween.progress(1), totalMs);
  return () => window.clearTimeout(id);
}

/** Score + clock, in the template's own palette. */
export function Hud({
  template,
  score,
  target,
  secondsLeft,
  goalLabel,
}: {
  template: TemplateDef;
  score: number;
  target: number;
  secondsLeft?: number;
  goalLabel?: string;
}) {
  const { accent, ink, surface, surfaceBorder } = template.palette;

  return (
    <div className="flex items-center justify-between gap-3 w-full" dir="rtl">
      <span
        className="text-sm font-bold px-3.5 py-1.5 rounded-full tabular-nums"
        style={{ background: surface, border: `1px solid ${surfaceBorder}`, color: ink }}
      >
        {goalLabel ? `${goalLabel} ` : ''}
        {score}/{target}
      </span>

      {secondsLeft !== undefined && (
        <span
          className="text-sm font-bold px-3.5 py-1.5 rounded-full tabular-nums"
          style={{
            background: secondsLeft <= 5 ? accent : surface,
            border: `1px solid ${secondsLeft <= 5 ? accent : surfaceBorder}`,
            color: secondsLeft <= 5 ? '#fff' : ink,
          }}
        >
          {secondsLeft}s
        </span>
      )}
    </div>
  );
}

/** The play area. Fixed aspect so a phone and a desktop play the same game. */
export function Stage({
  children,
  template,
  innerRef,
  onPointerDown,
}: {
  children: React.ReactNode;
  template: TemplateDef;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      ref={innerRef}
      onPointerDown={onPointerDown}
      className="relative w-full overflow-hidden rounded-3xl touch-none select-none"
      style={{
        height: 'min(58vh, 26rem)',
        background: template.palette.surface,
        border: `1px solid ${template.palette.surfaceBorder}`,
        boxShadow: `0 24px 60px -34px ${template.palette.glow}`,
      }}
    >
      {children}
    </div>
  );
}
