'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * "How it works" — four steps, told as a sequence rather than as four
 * identical boxes sitting next to each other.
 *
 * The section used to be a static grid: whatever the copy said about it being
 * four quick steps, nothing on screen connected one step to the next. Now a
 * rule draws itself right-to-left through the circles as you arrive, each
 * circle pops onto that line in turn, and the circles keep breathing
 * afterwards so the section is still alive once the reveal is over. Hovering
 * a step lifts its circle and nudges the emoji.
 *
 * All of it is gated on `prefers-reduced-motion` through `gsap.matchMedia()`,
 * which reverts the whole set if the preference changes mid-visit.
 */

const STEPS = [
  { n: '1', emoji: '🎂', title: 'בוחרים אירוע', body: 'יום הולדת, אהבה, שחרור — או סתם כי בא לכם' },
  { n: '2', emoji: '✍️', title: 'מספרים לנו עליו/עליה', body: 'כמה מילים. זיכרון אחד. זה כל מה שצריך' },
  { n: '3', emoji: '🤖', title: 'ה-AI יוצר את ההפתעה', body: 'טקסט אישי, עיצוב, אנימציות ומוזיקה' },
  { n: '4', emoji: '🔗', title: 'משתפים בלינק', body: 'לינק אחד בוואטסאפ. זהו' },
];

export default function HowItWorks() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          if (context.conditions?.reduced) {
            // The steps still have to be legible — they just arrive already
            // in place, with no line to draw and nothing left breathing.
            gsap.set('[data-hiw-card], [data-hiw-circle], [data-hiw-badge]', {
              autoAlpha: 1,
              scale: 1,
              y: 0,
            });
            gsap.set('[data-hiw-line]', { scaleX: 1 });
            return;
          }

          const tl = gsap.timeline({
            scrollTrigger: { trigger: rootRef.current, start: 'top 78%', once: true },
          });

          tl.fromTo(
            '[data-hiw-line]',
            { scaleX: 0 },
            { scaleX: 1, duration: 1.2, ease: 'power2.inOut' },
            0
          )
            .fromTo(
              '[data-hiw-card]',
              { y: 30, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' },
              0.1
            )
            .fromTo(
              '[data-hiw-circle]',
              { scale: 0.3, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.85, stagger: 0.12, ease: 'back.out(2.2)' },
              0.15
            )
            .fromTo(
              '[data-hiw-badge]',
              { scale: 0 },
              { scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(3)' },
              0.45
            )
            /* Once the reveal lands the circles keep a slow breath going.
             * Started from a callback rather than tweened in the timeline so
             * it never fights the entrance for the same property. */
            .add(() => {
              gsap.to('[data-hiw-circle]', {
                y: -7,
                duration: 2.6,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                stagger: { each: 0.4 },
              });
            });

          // Hover: the circle lifts out of the line and the emoji kicks.
          const cleanups: (() => void)[] = [];
          gsap.utils.toArray<HTMLElement>('[data-hiw-card]').forEach((card) => {
            const circle = card.querySelector('[data-hiw-circle]');
            const emoji = card.querySelector('[data-hiw-emoji]');
            if (!circle || !emoji) return;

            const enter = () => {
              gsap.to(circle, { scale: 1.12, duration: 0.34, ease: 'power2.out', overwrite: 'auto' });
              gsap.fromTo(
                emoji,
                { rotation: -14 },
                { rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' }
              );
            };
            const leave = () =>
              gsap.to(circle, { scale: 1, duration: 0.34, ease: 'power2.out', overwrite: 'auto' });

            card.addEventListener('pointerenter', enter);
            card.addEventListener('pointerleave', leave);
            cleanups.push(() => {
              card.removeEventListener('pointerenter', enter);
              card.removeEventListener('pointerleave', leave);
            });
          });

          return () => cleanups.forEach((fn) => fn());
        },
        rootRef
      );
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="hiw-grid">
      {/* The thread the steps hang off. Its ends fade out, so it reads as a
        * drawn line rather than as a bar that has to align to the pixel with
        * the first and last circle. */}
      <span className="hiw-line" data-hiw-line aria-hidden="true" />

      {STEPS.map((step) => (
        <div key={step.n} className="hiw-card" data-hiw-card>
          <span className="hiw-circle" data-hiw-circle>
            <span className="hiw-emoji" data-hiw-emoji aria-hidden="true">
              {step.emoji}
            </span>
            <span className="hiw-badge" data-hiw-badge aria-hidden="true">
              {step.n}
            </span>
          </span>
          <p className="hiw-title">{step.title}</p>
          <p className="hiw-body">{step.body}</p>
        </div>
      ))}
    </div>
  );
}
