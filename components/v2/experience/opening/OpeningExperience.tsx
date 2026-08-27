'use client';

import { Component, ReactNode, useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';
import { MediaItem } from '@/lib/v2/types';
import { OpeningConfig, OpeningMechanic } from '@/lib/v2/opening/types';
import Gate from '../Gate';
import { haptic, reduceMotion, safeReveal } from './engines/shared';

gsap.registerPlugin(useGSAP);

/**
 * The unlock experience.
 *
 * Everything here is arranged around one rule: the recipient must always be
 * able to reach their greeting. A missing config, a model that produced
 * nonsense, an engine chunk that fails to load, a crash inside a game — every
 * one of those paths ends at the classic `Gate`, and there is a visible skip
 * on the game itself for anyone who simply doesn't want to play.
 */

/* Engines are code-split: a greeting loads the one mechanic it uses, not all
 * six. `ssr: false` because they read layout and drive rAF loops — there is
 * nothing meaningful to render on the server. */
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

type Phase = 'intro' | 'playing' | 'lost' | 'won';

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
  const [phase, setPhase] = useState<Phase>('intro');
  const [attempt, setAttempt] = useState(0);
  const [crashed, setCrashed] = useState(false);

  const classicGate = (
    <Gate
      template={template}
      recipientName={recipientName}
      senderName={senderName}
      hasGift={hasGift}
      onOpen={onOpen}
    />
  );

  const win = useCallback(() => {
    haptic(30);
    setPhase('won');
  }, []);

  const lose = useCallback(() => setPhase('lost'), []);

  /* Victory choreography. The greeting opens from the button, not from a
   * timer — the payoff line is the point, and yanking it away mid-read would
   * waste the one moment the whole game exists to earn. */
  useGSAP(
    () => {
      if (phase !== 'won') return;

      // The victory screen holds the button into the greeting — it reveals
      // through safeReveal so a suspended rAF can never strand it.
      const cleanup = safeReveal(
        '[data-victory] > *',
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)' },
        { y: 26, autoAlpha: 0, scale: 0.94 }
      );

      // Purely decorative, so it stays a plain tween.
      if (!reduceMotion()) {
        gsap.fromTo(
          '[data-burst]',
          { scale: 0, autoAlpha: 1 },
          { scale: 2.6, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }
        );
      }

      return cleanup;
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

  // No game for this greeting — or the engine gave up. Either way, the
  // original opening still works exactly as it always did.
  if (!config || crashed) return classicGate;

  const Engine = ENGINES[config.mechanic];
  if (!Engine) return classicGate;

  const { accent, ink, inkSoft, pageBg } = template.palette;
  const photos = config.usePhotos ? media.filter((m) => m.type === 'image') : [];

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-5 py-8 overflow-y-auto"
      style={{ background: pageBg }}
    >
      <div className="w-full" style={{ maxWidth: '30rem' }}>
        {/* ---------------- Intro ---------------- */}
        {phase === 'intro' && (
          <div data-intro className="flex flex-col items-center gap-4 text-center">
            <span
              className="text-xs font-bold px-4 py-2 rounded-full"
              style={{ background: template.palette.accentSoft, color: accent }}
            >
              {recipientName}, יש כאן משהו לפתוח
            </span>

            <h1
              className={`font-extrabold leading-tight ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
              style={{ fontSize: 'clamp(1.7rem, 7vw, 2.5rem)', color: ink }}
            >
              {config.title}
            </h1>

            <p style={{ color: inkSoft, maxWidth: '26rem' }}>{config.instruction}</p>

            <button
              type="button"
              onClick={() => setPhase('playing')}
              className="v2-btn v2-btn-primary text-lg mt-1"
            >
              יאללה, מתחילים
            </button>
          </div>
        )}

        {/* ---------------- Playing ---------------- */}
        {phase === 'playing' && (
          <EngineBoundary
            fallback={<p className="text-center" style={{ color: inkSoft }}>רגע…</p>}
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
            <h2 className="font-extrabold" style={{ fontSize: 'clamp(1.4rem, 6vw, 1.9rem)', color: ink }}>
              כמעט!
            </h2>
            <p style={{ color: inkSoft, maxWidth: '24rem' }}>
              {config.failLine || 'עוד ניסיון אחד וזה שלך'}
            </p>
            <button
              type="button"
              onClick={() => {
                setAttempt((a) => a + 1);
                setPhase('playing');
              }}
              className="v2-btn v2-btn-primary text-lg"
            >
              ניסיון נוסף
            </button>
          </div>
        )}

        {/* ---------------- Victory ---------------- */}
        {phase === 'won' && (
          <div className="relative flex flex-col items-center gap-4 text-center">
            <span
              data-burst
              aria-hidden="true"
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '12rem',
                height: '12rem',
                top: '-2rem',
                background: `radial-gradient(circle, ${template.palette.glow} 0%, transparent 70%)`,
              }}
            />
            <div data-victory className="relative flex flex-col items-center gap-4">
              <span style={{ fontSize: '3.4rem' }}>🎉</span>
              <h2
                className={`font-extrabold ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
                style={{ fontSize: 'clamp(1.6rem, 7vw, 2.3rem)', color: ink }}
              >
                {config.victoryTitle}
              </h2>
              {config.victoryLine && (
                <p style={{ color: inkSoft, maxWidth: '26rem' }}>{config.victoryLine}</p>
              )}
              <button type="button" onClick={onOpen} className="v2-btn v2-btn-primary text-lg mt-1">
                {hasGift ? '🎁 קדימה, לראות מה מחכה' : 'קדימה, לראות מה מחכה'}
              </button>
            </div>
          </div>
        )}

        {/* The escape hatch. Present in every phase except the victory screen,
          * where the primary button already does this. */}
        {phase !== 'won' && (
          <div className="flex justify-center mt-7">
            <button
              type="button"
              onClick={onOpen}
              className="text-xs underline underline-offset-4"
              style={{ color: inkSoft }}
            >
              דלגו ופתחו ישר
            </button>
          </div>
        )}
      </div>

      {/* Belt and braces: if the engine chunk itself never arrives, this lets
        * the recipient drop back to the original gate rather than staring at
        * an empty stage. */}
      {phase === 'playing' && (
        <button
          type="button"
          onClick={() => setCrashed(true)}
          className="sr-only"
        >
          חזרה לפתיחה הרגילה
        </button>
      )}
    </div>
  );
}
