'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, haptic, reduceMotion, safeReveal } from './shared';
import { useGameArt } from '../kit/art';
import { sfx } from '../kit/feel';
import Scenery from '../kit/Scenery';
import { ParticleCanvas } from '../kit/feel';
import { GameHud, stageCaptionStyle, useFloatingText, useGameStage } from '../kit/GameShell';

gsap.registerPlugin(useGSAP);

/**
 * "Do you actually know them?" — a game show, not a form.
 *
 * The old version was a stack of grey buttons with no stakes, which is the
 * exact shape of a survey. Three things change that: a per-question clock that
 * visibly drains, answers that reveal right-and-wrong together before moving
 * on, and a wrong answer costing a life rather than ending the round instantly
 * — nobody should lose their greeting to one misremembered detail.
 */

const SECONDS_PER_QUESTION = 12;

export default function QuizUnlock({ config, onWin, onLose }: EngineProps) {
  const art = useGameArt(config);
  const stage = useGameStage();
  // Destructured up front — reaching into `stage` inside JSX reads to the
  // lint rule (rightly) as touching a ref mid-render.
  const { stageRef, flashRef, particlesRef } = stage;
  const floating = useFloatingText();

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(2);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const settledRef = useRef(false);
  const chosenRef = useRef<number | null>(null);
  const livesRef = useRef(2);

  const question = config.questions[index];

  const advance = useCallback(
    (wasCorrect: boolean) => {
      if (wasCorrect && index + 1 >= config.questions.length) {
        settledRef.current = true;
        particlesRef.current?.rain({ count: 60 });
        sfx.win();
        window.setTimeout(onWin, 700);
        return;
      }
      if (!wasCorrect && livesRef.current <= 0) {
        settledRef.current = true;
        window.setTimeout(onLose, 700);
        return;
      }
      // A wrong answer still moves the quiz on — being stuck re-reading the
      // question you just failed is the least fun place this could leave you.
      setChosen(null);
      chosenRef.current = null;
      setTimeLeft(SECONDS_PER_QUESTION);
      setIndex((i) => Math.min(i + 1, config.questions.length - 1));
    },
    [index, config.questions.length, onWin, onLose, particlesRef]
  );

  const resolve = useCallback(
    (optionIndex: number | null, el?: HTMLButtonElement) => {
      if (settledRef.current || chosenRef.current !== null || !question) return;

      chosenRef.current = optionIndex ?? -1;
      setChosen(optionIndex ?? -1);

      const correct = optionIndex === question.answerIndex;

      if (correct) {
        haptic(14);
        sfx.collect(correctCount);
        setCorrectCount((c) => c + 1);
        stage.feel.punch(1.4);
        stage.feel.flash(art.palette.accent, 0.18);

        if (el) {
          const { x, y } = stage.centreOf(el);
          stage.burstAt(x, y, {
            count: 22,
            colors: [art.palette.accent, '#ffffff', '#f5c246'],
            power: 250,
            shape: 'spark',
          });
          floating.push(x, y, 'נכון!', '#ffffff', true);
        }
      } else {
        haptic(28);
        sfx.miss();
        livesRef.current -= 1;
        setLives(livesRef.current);
        stage.feel.shake(1.3);
        stage.feel.flash('#e0503c', 0.24);

        if (el && !reduceMotion()) {
          gsap.fromTo(el, { x: -9 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        }
      }

      // Hold the reveal so the right answer is actually seen before moving on.
      window.setTimeout(() => advance(correct), 1150);
    },
    [question, correctCount, advance, art.palette.accent, floating, stage]
  );

  /* Per-question clock. Running out is simply a wrong answer — the pressure is
   * the point, but it must never be a dead end.
   *
   * A plain effect, not `useGSAP`: this is an interval, not an animation, and
   * routing it through a GSAP context left the clock from the previous
   * question still running into the next one — question two opened on a
   * timer that was already nearly expired.
   *
   * `resolve` is reached through a ref so re-arming is driven only by the
   * question changing. Depending on the callback directly would tear the
   * interval down and restart the clock on every unrelated state change. */
  const resolveRef = useRef(resolve);
  useEffect(() => {
    resolveRef.current = resolve;
  });

  useEffect(() => {
    if (settledRef.current) return;
    const endAt = Date.now() + SECONDS_PER_QUESTION * 1000;
    const id = window.setInterval(() => {
      // Paused while an answer is being revealed.
      if (chosenRef.current !== null) return;
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        resolveRef.current(null);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [index]);

  useGSAP(
    () =>
      safeReveal(
        '[data-quiz]',
        { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(1.5)' },
        { y: 26, autoAlpha: 0 }
      ),
    { scope: stageRef, dependencies: [index] }
  );

  if (!question) return null;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden rounded-[1.75rem] select-none"
        style={{
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 30px 70px -38px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)',
          background: art.palette.sky,
          padding: '3.8rem 1rem 1.3rem',
          minHeight: '22rem',
        }}
      >
        <Scenery theme={art.theme} speed={0} quiet />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 80% at 50% 35%, transparent 35%, rgba(0,0,0,0.5) 100%)' }}
          aria-hidden="true"
        />

        <GameHud
          palette={art.palette}
          score={correctCount}
          target={config.questions.length}
          goalLabel={art.goalLabel || 'שאלה'}
          secondsLeft={timeLeft}
          totalSeconds={SECONDS_PER_QUESTION}
          lives={lives}
          maxLives={2}
        />

        <div className="relative flex flex-col gap-4" dir="rtl">
          <p
            data-quiz
            className="text-center font-extrabold px-2"
            style={{
              fontSize: 'clamp(1.15rem, 5.2vw, 1.55rem)',
              color: '#ffffff',
              textShadow: '0 2px 14px rgba(0,0,0,0.8)',
              opacity: 0,
            }}
          >
            {question.question}
          </p>

          <div className="flex flex-col gap-2.5">
            {question.options.map((option, i) => {
              const isAnswer = chosen !== null && i === question.answerIndex;
              const isWrongPick = chosen === i && i !== question.answerIndex;

              return (
                <button
                  key={i}
                  data-quiz
                  type="button"
                  onClick={(e) => resolve(i, e.currentTarget)}
                  disabled={chosen !== null}
                  className="rounded-2xl px-5 py-4 text-start font-bold transition-all duration-200 flex items-center gap-3"
                  style={{
                    opacity: 0,
                    background: isAnswer
                      ? art.palette.accent
                      : isWrongPick
                        ? '#e0503c'
                        : 'rgba(255,255,255,0.93)',
                    color: isAnswer || isWrongPick ? '#ffffff' : '#1f2937',
                    border: `1.5px solid ${isAnswer ? '#ffffff' : isWrongPick ? '#ff9b8a' : 'rgba(255,255,255,0.7)'}`,
                    boxShadow: isAnswer
                      ? `0 0 26px -6px ${art.palette.accent}`
                      : '0 10px 24px -14px rgba(0,0,0,0.9)',
                    // Dim the options that were neither picked nor correct, so
                    // the eye goes straight to the answer during the reveal.
                    filter: chosen !== null && !isAnswer && !isWrongPick ? 'saturate(0.4) opacity(0.55)' : 'none',
                  }}
                >
                  <span
                    className="flex items-center justify-center rounded-lg font-black flex-shrink-0"
                    style={{
                      width: '1.7rem', height: '1.7rem', fontSize: '0.8rem',
                      background: isAnswer || isWrongPick ? 'rgba(255,255,255,0.28)' : art.palette.accent,
                      color: '#ffffff',
                    }}
                  >
                    {isAnswer ? '✓' : isWrongPick ? '✕' : ['א', 'ב', 'ג', 'ד'][i]}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <ParticleCanvas ref={particlesRef} className="z-20" />
        <div
          ref={flashRef}
          className="absolute inset-0 pointer-events-none z-20 mix-blend-screen"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
        {floating.layer}
      </div>

      <p className="text-center text-xs" style={stageCaptionStyle}>
        שאלה {index + 1} מתוך {config.questions.length}
      </p>
    </div>
  );
}
