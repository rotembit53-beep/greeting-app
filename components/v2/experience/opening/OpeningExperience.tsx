'use client';

import { Component, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';
import { MediaItem } from '@/lib/v2/types';
import { OpeningConfig, OpeningMechanic } from '@/lib/v2/opening/types';
import { resolveIcon, resolveTheme } from '@/lib/v2/opening/art';
import Gate from '../Gate';
import { haptic, reduceMotion, safeReveal } from './engines/shared';
import GameIconArt from './kit/Icon';
import Scenery, { themePalette } from './kit/Scenery';
import { ParticleCanvas, ParticleHandle, setMuted, sfx } from './kit/feel';

gsap.registerPlugin(useGSAP);

/**
 * The unlock experience.
 *
 * Everything here is arranged around one rule: the recipient must always be
 * able to reach their greeting. A missing config, a model that produced
 * nonsense, an engine chunk that fails to load, a crash inside a game — every
 * one of those paths ends at the classic `Gate`, and there is a visible skip
 * on the game itself for anyone who simply doesn't want to play.
 *
 * The phases around the game matter as much as the game. A round that starts
 * the instant you tap, with no beat to read the goal, feels like a test; and a
 * win that resolves to "Congratulations" with a link feels like a form
 * submitting. So the round is framed — brief, themed, with a countdown — and
 * the win is a sequence that visibly opens the thing being unlocked.
 */

/* Engines are code-split: a greeting loads the one mechanic it uses, not all
 * six. `ssr: false` because they read layout and drive rAF loops — there is
 * nothing meaningful to render on the server.
 *
 * The loaders are named separately so the intro can start fetching the chunk
 * the moment the recipient lands. Without that the download only began when
 * the countdown ended, so "3, 2, 1…" was followed by a blank pause while the
 * chunk arrived — the game appeared to hang at exactly the moment it was
 * supposed to start. The import cache means the `dynamic` below then resolves
 * instantly. */
const ENGINE_LOADERS: Record<OpeningMechanic, () => Promise<unknown>> = {
  'tap-targets': () => import('./engines/TapTargets'),
  'timing-bar': () => import('./engines/TimingBar'),
  'sequence-order': () => import('./engines/SequenceOrder'),
  'memory-match': () => import('./engines/MemoryMatch'),
  'dodge-run': () => import('./engines/DodgeRun'),
  'quiz-unlock': () => import('./engines/QuizUnlock'),
};

const ENGINES: Record<OpeningMechanic, React.ComponentType<EngineComponentProps>> = {
  'tap-targets': dynamic(() => import('./engines/TapTargets'), { ssr: false }),
  'timing-bar': dynamic(() => import('./engines/TimingBar'), { ssr: false }),
  'sequence-order': dynamic(() => import('./engines/SequenceOrder'), { ssr: false }),
  'memory-match': dynamic(() => import('./engines/MemoryMatch'), { ssr: false }),
  'dodge-run': dynamic(() => import('./engines/DodgeRun'), { ssr: false }),
  'quiz-unlock': dynamic(() => import('./engines/QuizUnlock'), { ssr: false }),
};

interface EngineComponentProps {
  config: OpeningConfig;
  template: TemplateDef;
  photos: MediaItem[];
  onWin: () => void;
  onLose: () => void;
}

/**
 * Turns a crash inside an engine into the classic gate.
 *
 * A class component because that is still the only way to catch a render
 * error in a subtree — and a game doing arithmetic on model-authored numbers
 * is exactly the subtree worth guarding.
 */
class EngineBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[v2] opening engine crashed, falling back to the gate:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Props {
  config: OpeningConfig | null;
  template: TemplateDef;
  recipientName: string;
  senderName?: string;
  hasGift: boolean;
  media: MediaItem[];
  onOpen: () => void;
}

type Phase = 'intro' | 'countdown' | 'playing' | 'lost' | 'won';

export default function OpeningExperience({
  config,
  template,
  recipientName,
  senderName,
  hasGift,
  media,
  onOpen,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<ParticleHandle>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [attempt, setAttempt] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [muted, setMutedState] = useState(false);

  const win = useCallback(() => {
    haptic(30);
    setPhase('won');
  }, []);

  const lose = useCallback(() => {
    haptic(18);
    setPhase('lost');
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.tap();
  };

  /* Fetch the engine chunk while the recipient is still reading the brief, so
   * the countdown lands straight into gameplay rather than into a pause. */
  const mechanic = config?.mechanic;
  useEffect(() => {
    if (!mechanic) return;
    void ENGINE_LOADERS[mechanic]?.().catch(() => {
      // A failed preload is not a failure: the `dynamic` import below will try
      // again, and the boundary around it still falls back to the classic gate.
    });
  }, [mechanic]);

  /* ---------------- Theme resolution ----------------
   *
   * Done here as well as inside the engines so the framing screens live in the
   * same world as the game they wrap — walking from a warm stadium intro into
   * a stadium and back out to a grey victory card would undo most of the
   * atmosphere the game just built. */
  const icons = (config?.items ?? [])
    .filter((item) => item.good)
    .map((item) => resolveIcon(item.icon, item.emoji, true));
  const theme = resolveTheme(config?.theme, icons);
  const palette = themePalette(theme);

  /* ---------------- Victory choreography ----------------
   *
   * The one moment the whole game exists to earn. It runs as a single timeline
   * so the beats can't drift apart: the seal cracks, light floods out, the
   * confetti falls, and only then does the way in appear. The greeting opens
   * from that button rather than from a timer — the payoff line is the point,
   * and yanking it away mid-read would waste it. */
  useGSAP(
    () => {
      if (phase !== 'won') return;

      sfx.win();
      particlesRef.current?.rain({ count: 110 });
      window.setTimeout(() => sfx.unlock(), 520);

      const cleanup = safeReveal(
        '[data-victory] > *',
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.55, stagger: 0.11, ease: 'back.out(1.5)' },
        { y: 28, autoAlpha: 0, scale: 0.92 }
      );

      if (reduceMotion()) return cleanup;

      const tl = gsap.timeline();

      // The seal breaks apart.
      tl.to('[data-seal-half="top"]', { y: -46, rotation: -16, autoAlpha: 0, duration: 0.65, ease: 'back.in(1.4)' }, 0.15)
        .to('[data-seal-half="bottom"]', { y: 46, rotation: 14, autoAlpha: 0, duration: 0.65, ease: 'back.in(1.4)' }, 0.15)
        // Light floods out of the break.
        .fromTo('[data-seal-glow]', { scale: 0.2, autoAlpha: 0.95 }, { scale: 4.2, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, 0.3)
        .fromTo('[data-seal-ring]', { scale: 0.3, autoAlpha: 0.8 }, { scale: 2.8, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 0.42);

      // Rays sweep out from behind the card.
      tl.fromTo(
        '[data-ray]',
        { scaleY: 0, autoAlpha: 0 },
        { scaleY: 1, autoAlpha: 0.5, duration: 0.8, stagger: 0.04, ease: 'power3.out' },
        0.35
      ).to('[data-ray]', { autoAlpha: 0.16, duration: 1.4, ease: 'sine.inOut' }, 1.2);

      return () => {
        cleanup();
        tl.kill();
      };
    },
    { scope: rootRef, dependencies: [phase] }
  );

  useGSAP(
    () => {
      if (phase !== 'intro') return;
      // Carries the "start" button — same guarantee applies.
      return safeReveal('[data-intro] > *', {
        y: 0,
        autoAlpha: 1,
        duration: 0.55,
        stagger: 0.09,
        ease: 'power2.out',
      });
    },
    { scope: rootRef, dependencies: [phase] }
  );

  const classicGate = (
    <Gate
      template={template}
      recipientName={recipientName}
      senderName={senderName}
      hasGift={hasGift}
      onOpen={onOpen}
    />
  );

  // No game for this greeting — or the engine gave up. Either way, the
  // original opening still works exactly as it always did.
  if (!config || crashed) return classicGate;

  const Engine = ENGINES[config.mechanic];
  if (!Engine) return classicGate;

  const photos = config.usePhotos ? media.filter((m) => m.type === 'image') : [];
  const previewItems = config.items.filter((i) => i.good).slice(0, 4);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: palette.sky,
        // Keeps controls clear of the notch and the home indicator.
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* The world, behind the framing screens — so the intro, the countdown
        * and the payoff all happen in the same place the game does.
        *
        * Deliberately NOT drawn during play: the stage renders this same world
        * itself, and two copies of a skyline (one inside the frame, one behind
        * it) read as a rendering fault rather than as depth. Playing on a flat
        * wash of the theme's own sky also gives the stage a hard edge, which is
        * what makes it read as a screen you're playing *into*. */}
      <div className="fixed inset-0 pointer-events-none">
        {phase !== 'playing' && (
          <Scenery
            theme={theme}
            speed={phase === 'intro' ? 0.02 : 0}
            // Each theme is composed for a stage about a phone's shape. Left to
            // fill a desktop viewport the bands pull apart and the scene reads
            // as half-drawn, so the world is capped and sits on the floor with
            // the sky gradient above it.
            worldHeight="min(100%, 42rem)"
          />
        )}
        {/* The scrim that keeps white copy legible on ANY theme.
          *
          * A vertical wash rather than a radial one, because a radial is by
          * definition lightest at the centre — which is exactly where the
          * title sits. On the pale themes (garden, beach, travel) that left
          * white text on a near-white sky. This floors the contrast
          * everywhere while still letting the world read through. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              phase === 'playing'
                ? 'rgba(0,0,0,0.55)'
                : 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.72) 100%)',
          }}
        />
      </div>

      {/* Sound toggle. Present from the first frame, because a game that makes
        * noise on a phone in a quiet room needs an obvious way to stop. */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'הפעילו צלילים' : 'השתיקו צלילים'}
        className="fixed z-30 flex items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-90"
        style={{
          top: 'calc(env(safe-area-inset-top) + 0.85rem)',
          insetInlineEnd: '0.85rem',
          width: '2.4rem',
          height: '2.4rem',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.24)',
          color: '#fff',
        }}
      >
        {muted ? <MuteIcon /> : <SoundIcon />}
      </button>

      <div className="relative min-h-full flex flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="w-full" style={{ maxWidth: '30rem' }}>
          {/* ---------------- Intro ---------------- */}
          {phase === 'intro' && (
            <div data-intro className="flex flex-col items-center gap-4 text-center">
              <span
                className="text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.24)',
                  color: '#fff',
                }}
              >
                {recipientName}, יש כאן משהו לפתוח
              </span>

              <h1
                className={`font-extrabold leading-tight ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
                style={{
                  fontSize: 'clamp(1.8rem, 7.5vw, 2.6rem)',
                  color: '#fff',
                  textShadow: '0 3px 24px rgba(0,0,0,0.75)',
                }}
              >
                {config.title}
              </h1>

              <p
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  maxWidth: '26rem',
                  textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                }}
              >
                {config.instruction}
              </p>

              {/* What they'll be chasing, in their own objects — the goal is
                * shown, not just described. */}
              {previewItems.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-1" dir="rtl">
                  {previewItems.map((item, i) => (
                    <span
                      key={i}
                      className="flex items-center justify-center rounded-2xl backdrop-blur-md"
                      style={{
                        width: '3.1rem',
                        height: '3.1rem',
                        background: 'rgba(255,255,255,0.14)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      <GameIconArt icon={item.icon} emoji={item.emoji} size={30} shadow={false} />
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => { sfx.tap(); setPhase('countdown'); }}
                className="v2-btn v2-btn-primary text-lg mt-2"
              >
                יאללה, מתחילים
              </button>
            </div>
          )}

          {/* ---------------- Countdown ---------------- */}
          {phase === 'countdown' && (
            <Countdown
              accent={palette.accent}
              instruction={config.instruction}
              onDone={() => setPhase('playing')}
            />
          )}

          {/* ---------------- Playing ---------------- */}
          {phase === 'playing' && (
            <EngineBoundary
              fallback={
                <p className="text-center" style={{ color: 'rgba(255,255,255,0.8)' }}>רגע…</p>
              }
            >
              <Engine
                // Remounts the engine on retry, which resets every bit of its
                // internal state without it needing a reset path of its own.
                key={attempt}
                config={config}
                template={template}
                photos={photos}
                onWin={win}
                onLose={lose}
              />
            </EngineBoundary>
          )}

          {/* ---------------- Missed ---------------- */}
          {phase === 'lost' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <span style={{ fontSize: '3rem' }}>😏</span>
              <h2
                className="font-extrabold"
                style={{
                  fontSize: 'clamp(1.5rem, 6.5vw, 2rem)',
                  color: '#fff',
                  textShadow: '0 2px 18px rgba(0,0,0,0.75)',
                }}
              >
                כמעט!
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  maxWidth: '24rem',
                  textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                }}
              >
                {config.failLine || 'עוד ניסיון אחד וזה שלך'}
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setAttempt((a) => a + 1);
                  // Straight back into the round — an extra confirmation screen
                  // between a miss and a retry is pure friction.
                  setPhase('countdown');
                }}
                className="v2-btn v2-btn-primary text-lg"
              >
                ניסיון נוסף
              </button>
            </div>
          )}

          {/* ---------------- Victory ---------------- */}
          {phase === 'won' && (
            <div className="relative flex flex-col items-center gap-4 text-center py-4">
              {/* Rays behind everything */}
              <div
                className="absolute pointer-events-none"
                style={{ top: '2rem', left: '50%', transform: 'translateX(-50%)' }}
                aria-hidden="true"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    data-ray
                    className="absolute"
                    style={{
                      width: '2.2rem',
                      height: '15rem',
                      left: '-1.1rem',
                      top: 0,
                      opacity: 0,
                      transformOrigin: '50% 0%',
                      transform: `rotate(${i * 30}deg)`,
                      background: `linear-gradient(180deg, ${palette.accent}, transparent 72%)`,
                    }}
                  />
                ))}
              </div>

              {/* The seal that breaks open */}
              <div className="relative flex items-center justify-center" style={{ height: '7rem' }}>
                <span
                  data-seal-glow
                  aria-hidden="true"
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: '9rem', height: '9rem', opacity: 0,
                    background: `radial-gradient(circle, #fff 0%, ${palette.accent} 40%, transparent 72%)`,
                  }}
                />
                <span
                  data-seal-ring
                  aria-hidden="true"
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: '7rem', height: '7rem', opacity: 0,
                    border: `3px solid ${palette.accent}`,
                  }}
                />
                <Seal accent={palette.accent} />
              </div>

              <div data-victory className="relative flex flex-col items-center gap-3">
                <span
                  className="text-xs font-black px-4 py-1.5 rounded-full tracking-wide"
                  style={{
                    background: palette.accent,
                    color: '#0b0b0b',
                    boxShadow: `0 0 26px -6px ${palette.accent}`,
                    opacity: 0,
                  }}
                >
                  ✦ פתחתם את ההפתעה
                </span>

                <h2
                  className={`font-extrabold ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
                  style={{
                    fontSize: 'clamp(1.7rem, 7.5vw, 2.4rem)',
                    color: '#fff',
                    textShadow: '0 3px 24px rgba(0,0,0,0.8)',
                    opacity: 0,
                  }}
                >
                  {config.victoryTitle}
                </h2>

                {config.victoryLine && (
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.9)',
                      maxWidth: '26rem',
                      textShadow: '0 2px 14px rgba(0,0,0,0.75)',
                      opacity: 0,
                    }}
                  >
                    {config.victoryLine}
                  </p>
                )}

                <button
                  type="button"
                  onClick={onOpen}
                  className="v2-btn v2-btn-primary text-lg mt-1"
                  style={{ opacity: 0 }}
                >
                  {hasGift ? '🎁 קדימה, לראות מה מחכה' : 'קדימה, לראות מה מחכה'}
                </button>
              </div>
            </div>
          )}

          {/* The escape hatch. Present in every phase except the victory screen,
            * where the primary button already does this. */}
          {phase !== 'won' && (
            <div className="flex justify-center mt-7">
              {/* A quiet chip rather than bare underlined text: this sits over
                * whatever part of the world the layout happens to land on, and
                * on the lighter themes pale text on a lit wall was barely
                * there. The backing makes it legible everywhere without
                * promoting it into competition with the real CTA. */}
              <button
                type="button"
                onClick={onOpen}
                className="text-xs font-semibold rounded-full backdrop-blur-md transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  background: 'rgba(0,0,0,0.34)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '0.4rem 0.9rem',
                }}
              >
                דלגו ופתחו ישר
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The victory shower, over the whole screen rather than inside a stage. */}
      <div className="fixed inset-0 pointer-events-none z-20">
        <ParticleCanvas ref={particlesRef} />
      </div>

      {/* Belt and braces: if the engine chunk itself never arrives, this lets
        * the recipient drop back to the original gate rather than staring at
        * an empty stage. */}
      {phase === 'playing' && (
        <button type="button" onClick={() => setCrashed(true)} className="sr-only">
          חזרה לפתיחה הרגילה
        </button>
      )}
    </div>
  );
}

/**
 * "3… 2… 1…" before the round starts.
 *
 * Its own component so the count lives and dies with the phase: mounting is
 * the reset, which is both simpler than clearing it on the way in and the
 * reason there is no stale "1" flashing at the start of a retry.
 */
function Countdown({
  accent,
  instruction,
  onDone,
}: {
  accent: string;
  instruction: string;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(3);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        doneRef.current();
        return;
      }
      setCount(n);
      sfx.tap();
      haptic(8);
    }, 620);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (reduceMotion()) return;
      gsap.fromTo(
        '[data-count]',
        { scale: 2.2, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.34, ease: 'back.out(2.6)' }
      );
    },
    { scope: ref, dependencies: [count] }
  );

  return (
    <div ref={ref} className="flex flex-col items-center justify-center gap-3 text-center py-16">
      <span
        data-count
        key={count}
        className="font-black leading-none"
        style={{
          fontSize: 'clamp(5rem, 26vw, 9rem)',
          color: '#fff',
          textShadow: `0 0 60px ${accent}, 0 4px 30px rgba(0,0,0,0.8)`,
        }}
      >
        {count}
      </span>
      <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {instruction}
      </span>
    </div>
  );
}

/** The wax seal that breaks apart on victory — drawn in two halves so it can. */
function Seal({ accent }: { accent: string }) {
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="v2-seal-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <g data-seal-half="top">
        {/* Top half of a scalloped wax disc */}
        <path
          d="M46 6a40 40 0 0140 40H6A40 40 0 0146 6z"
          fill="url(#v2-seal-grad)"
        />
        <path d="M46 14a32 32 0 0132 32H14a32 32 0 0132-32z" fill="#fff" fillOpacity="0.16" />
        <circle cx="34" cy="30" r="5" fill="#fff" fillOpacity="0.28" />
      </g>

      <g data-seal-half="bottom">
        <path
          d="M6 46h80a40 40 0 01-80 0z"
          fill="url(#v2-seal-grad)"
        />
        <path d="M14 46h64a32 32 0 01-64 0z" fill="#000" fillOpacity="0.14" />
      </g>
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 010 7M18.5 6a9 9 0 010 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="M16 10l5 5M21 10l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
