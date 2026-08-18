'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TEMPLATE_LIST } from '@/lib/v2/templates';
import { EVENTS } from '@/lib/v2/types';
import { PREMIUM_PRICE_ILS } from '@/lib/v2/plan';
import { track } from '@/lib/v2/analytics';
import PhonePreview from './PhonePreview';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEPS = [
  { n: '1', emoji: '🎂', title: 'בוחרים אירוע', body: 'יום הולדת, אהבה, שחרור — או סתם כי בא לכם' },
  { n: '2', emoji: '✍️', title: 'מספרים לנו עליו/עליה', body: 'כמה מילים. זיכרון אחד. זה כל מה שצריך' },
  { n: '3', emoji: '🤖', title: 'ה-AI יוצר את ההפתעה', body: 'טקסט אישי, עיצוב, אנימציות ומוזיקה' },
  { n: '4', emoji: '🔗', title: 'משתפים בלינק', body: 'לינק אחד בוואטסאפ. זהו' },
];

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    track('landing_view');
  }, []);

  // Cycle the hero preview through the templates so the value is obvious
  // within a few seconds of landing.
  useEffect(() => {
    const id = window.setInterval(() => {
      setPreviewIndex((i) => (i + 1) % TEMPLATE_LIST.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set('[data-hero] > *, [data-anim]', { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        '[data-hero] > *',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' }
      );

      gsap.utils.toArray<HTMLElement>('[data-anim]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 36, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          }
        );
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className="v2-scope v2-shell"
      style={{
        background:
          'radial-gradient(circle at 12% -5%, #ffe9d6 0%, #ffe2ea 40%, #f3e8ff 100%)',
        ['--v2-ink' as string]: '#241019',
        ['--v2-ink-soft' as string]: '#6d5560',
        ['--v2-accent' as string]: '#e8365d',
        ['--v2-accent-soft' as string]: 'rgba(232, 54, 93, 0.12)',
        ['--v2-surface' as string]: '#ffffff',
        ['--v2-surface-border' as string]: 'rgba(36, 16, 25, 0.1)',
        ['--v2-glow' as string]: 'rgba(232, 54, 93, 0.35)',
      }}
    >
      {/* ---------------- Hero ---------------- */}
      <header className="v2-container-wide pt-8 pb-4 flex items-center justify-between">
        <span className="font-extrabold text-xl" style={{ color: 'var(--v2-ink)' }}>
          Intera<span style={{ color: 'var(--v2-accent)' }}>gift</span>
        </span>
      </header>

      <section className="v2-container-wide pt-6 pb-16 sm:pt-12 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div data-hero className="text-center lg:text-start">
            <span
              className="inline-block text-xs font-bold px-4 py-2 rounded-full mb-5"
              style={{ background: 'var(--v2-accent-soft)', color: 'var(--v2-accent)' }}
            >
              ✨ חדש — ברכות אינטראקטיביות
            </span>

            <h1
              className="font-extrabold leading-[1.05] mb-5"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 4.25rem)',
                color: 'var(--v2-ink)',
                letterSpacing: '-0.035em',
              }}
            >
              הפתעה שאי אפשר
              <br />
              לשכוח <span style={{ color: 'var(--v2-accent)' }}>❤️</span>
            </h1>

            <p
              className="mb-8 mx-auto lg:mx-0"
              style={{
                fontSize: 'clamp(1.05rem, 4vw, 1.3rem)',
                color: 'var(--v2-ink-soft)',
                lineHeight: 1.7,
                maxWidth: '32rem',
              }}
            >
              צרו ברכה אינטראקטיבית ומותאמת אישית תוך פחות מדקה — ושלחו אותה
              בלינק אחד בוואטסאפ.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link
                href="/create"
                className="v2-btn v2-btn-primary text-lg"
                onClick={() => track('started_creating', { props: { from: 'hero' } })}
              >
                ✨ צור ברכה
              </Link>
              <Link href="/g/dugma" className="v2-btn v2-btn-ghost text-lg">
                👀 ראה דוגמה
              </Link>
            </div>

            <p className="mt-5 text-sm" style={{ color: 'var(--v2-ink-soft)' }}>
              בחינם · בלי הרשמה · מוכן תוך דקה
            </p>
          </div>

          <div className="flex justify-center">
            <PhonePreview template={TEMPLATE_LIST[previewIndex]} />
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="v2-container-wide py-16 sm:py-20">
        <h2
          data-anim
          className="text-center font-extrabold mb-3"
          style={{ fontSize: 'clamp(1.9rem, 6vw, 2.8rem)', color: 'var(--v2-ink)' }}
        >
          איך זה עובד?
        </h2>
        <p
          data-anim
          className="text-center mb-12"
          style={{ color: 'var(--v2-ink-soft)', fontSize: '1.05rem' }}
        >
          ארבעה שלבים. פחות מדקה.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <div
              key={step.n}
              data-anim
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
                boxShadow: '0 12px 34px -24px rgba(36,16,25,0.5)',
              }}
            >
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
                style={{ background: 'var(--v2-accent-soft)' }}
              >
                {step.emoji}
              </div>
              <p className="font-extrabold mb-2" style={{ color: 'var(--v2-ink)' }}>
                {step.n}. {step.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--v2-ink-soft)' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Templates ---------------- */}
      <section className="v2-container-wide py-16 sm:py-20">
        <h2
          data-anim
          className="text-center font-extrabold mb-3"
          style={{ fontSize: 'clamp(1.9rem, 6vw, 2.8rem)', color: 'var(--v2-ink)' }}
        >
          שישה סגנונות. אף אחד לא דומה לשני.
        </h2>
        <p
          data-anim
          className="text-center mb-12"
          style={{ color: 'var(--v2-ink-soft)', fontSize: '1.05rem' }}
        >
          כל סגנון משנה לא רק צבע — אלא את כל החוויה
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATE_LIST.map((t) => (
            <div
              key={t.id}
              data-anim
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1.5px solid var(--v2-surface-border)',
                background: 'var(--v2-surface)',
                boxShadow: '0 16px 40px -28px rgba(36,16,25,0.6)',
              }}
            >
              <div
                className="h-36 flex items-center justify-center text-5xl relative"
                style={{ background: t.preview.gradient }}
              >
                {t.preview.emoji}
                {t.premium && (
                  <span
                    className="absolute top-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ insetInlineEnd: '0.75rem', background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  >
                    PREMIUM
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="font-extrabold mb-1.5" style={{ color: 'var(--v2-ink)' }}>
                  {t.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--v2-ink-soft)' }}>
                  {t.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Occasions ---------------- */}
      <section className="v2-container-wide py-12">
        <div className="flex flex-wrap justify-center gap-2.5">
          {EVENTS.filter((e) => e.id !== 'other').map((e) => (
            <span
              key={e.id}
              data-anim
              className="text-sm font-semibold px-4 py-2.5 rounded-full"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
                color: 'var(--v2-ink)',
              }}
            >
              {e.emoji} {e.label}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="v2-container py-16 sm:py-24 text-center">
        <div
          data-anim
          className="rounded-3xl px-6 py-12 sm:px-12"
          style={{
            background: 'linear-gradient(135deg, #e8365d 0%, #b5179e 100%)',
            boxShadow: '0 30px 70px -40px rgba(181,23,158,0.9)',
          }}
        >
          <h2
            className="font-extrabold mb-4 text-white"
            style={{ fontSize: 'clamp(1.7rem, 6vw, 2.6rem)', letterSpacing: '-0.03em' }}
          >
            מישהו מחכה להפתעה שלכם
          </h2>
          <p className="mb-8 text-white/85" style={{ fontSize: '1.05rem' }}>
            חינם לגמרי. פרימיום מ-{PREMIUM_PRICE_ILS.toFixed(2)} ₪ לברכה.
          </p>
          <Link
            href="/create"
            className="v2-btn text-lg"
            style={{ background: '#fff', color: '#b5179e' }}
            onClick={() => track('started_creating', { props: { from: 'footer_cta' } })}
          >
            ✨ צור ברכה עכשיו
          </Link>
        </div>
      </section>

      <footer className="v2-container pb-10 text-center">
        <p className="text-xs" style={{ color: 'var(--v2-ink-soft)' }}>
          Interagift · נבנה באהבה
        </p>
      </footer>
    </div>
  );
}
