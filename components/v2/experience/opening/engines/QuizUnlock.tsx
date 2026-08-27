'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EngineProps, Hud, haptic, reduceMotion, safeReveal } from './shared';

gsap.registerPlugin(useGSAP);

/**
 * A couple of questions only someone who knows them could answer.
 *
 * No clock: this one rewards thinking, and a countdown would turn a warm
 * "do you remember?" into an exam.
 */
export default function QuizUnlock({ config, template, onWin, onLose }: EngineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const settledRef = useRef(false);

  const question = config.questions[index];

  // The question and its answers ARE the game — see safeReveal.
  useGSAP(
    () =>
      safeReveal('[data-quiz]', {
        y: 0,
        autoAlpha: 1,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power2.out',
      }),
    { scope: rootRef, dependencies: [index] }
  );

  if (!question) return null;

  const answer = (optionIndex: number, el: HTMLButtonElement) => {
    if (settledRef.current || chosen !== null) return;

    setChosen(optionIndex);
    const correct = optionIndex === question.answerIndex;
    haptic(correct ? 12 : 26);

    if (!correct) {
      if (!reduceMotion()) {
        gsap.fromTo(el, { x: -7 }, { x: 0, duration: 0.45, ease: 'elastic.out(1, 0.3)' });
      }
      settledRef.current = true;
      window.setTimeout(onLose, 620);
      return;
    }

    window.setTimeout(() => {
      if (index + 1 >= config.questions.length) {
        settledRef.current = true;
        onWin();
      } else {
        setChosen(null);
        setIndex((i) => i + 1);
      }
    }, 560);
  };

  const { accent, accentSoft, ink, surface, surfaceBorder } = template.palette;

  return (
    <div ref={rootRef} className="flex flex-col gap-5 w-full" dir="rtl">
      <Hud
        template={template}
        score={index}
        target={config.questions.length}
        goalLabel="שאלה"
      />

      <p
        data-quiz
        className="text-center font-extrabold"
        style={{ fontSize: 'clamp(1.15rem, 5vw, 1.5rem)', color: ink }}
      >
        {question.question}
      </p>

      <div className="flex flex-col gap-2.5">
        {question.options.map((option, i) => {
          const isChosen = chosen === i;
          const isAnswer = chosen !== null && i === question.answerIndex;

          return (
            <button
              key={i}
              data-quiz
              type="button"
              onClick={(e) => answer(i, e.currentTarget)}
              disabled={chosen !== null}
              className="rounded-2xl px-5 py-4 text-start font-bold transition-colors"
              style={{
                background: isAnswer ? accent : isChosen ? accentSoft : surface,
                color: isAnswer ? '#fff' : ink,
                border: `1.5px solid ${isAnswer || isChosen ? accent : surfaceBorder}`,
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
