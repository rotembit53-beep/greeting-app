'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TEMPLATE_LIST } from '@/lib/v2/templates';
import { EVENTS } from '@/lib/v2/types';
import { PREMIUM_PRICE_ILS } from '@/lib/v2/plan';
import { track } from '@/lib/v2/analytics';
import StyleGallery from '@/components/v2/style/StyleGallery';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEPS = [
  { n: '1', emoji: '🎂', title: 'בוחרים אירוע', body: 'יום הולדת, אהבה, שחרור — או סתם כי בא לכם' },
  { n: '2', emoji: '✍️', title: 'מספרים לנו עליו/עליה', body: 'כמה מילים. זיכרון אחד. זה כל מה שצריך' },
  { n: '3', emoji: '🤖', title: 'ה-AI יוצר את ההפתעה', body: 'טקסט אישי, עיצוב, אנימציות ומוזיקה' },
  { n: '4', emoji: '🔗', title: 'משתפים בלינק', body: 'לינק אחד בוואטסאפ. זהו' },
];

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track('landing_view');
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
    <div ref={rootRef} className="v2-scope v2-studio v2-shell">
      {/* ---------------- Masthead ---------------- */}
      <section className="v2-container-wide pt-10 pb-4 sm:pt-16 text-center">
        <div data-hero>
          <p className="v2-eyebrow mb-5">ברכות אינטראקטיביות</p>

          <h1 className="v2-logo">
            Intera<span className="gi">gift</span>
          </h1>

          <div className="v2-gold-rule" />

          <p
            className="v2-display mx-auto"
            style={{
              fontSize: 'clamp(1.3rem, 4.2vw, 2.1rem)',
              color: 'var(--v2-ink)',
              lineHeight: 1.5,
              maxWidth: '24ch',
            }}
          >
            הפתעה שאי אפשר לשכוח
          </p>

          <p
            className="mx-auto mt-4"
            style={{
              fontSize: 'clamp(1rem, 3.4vw, 1.15rem)',
              color: 'var(--v2-ink-soft)',
              lineHeight: 1.8,
              maxWidth: '44ch',
            }}
          >
            צרו ברכה אינטראקטיבית ומותאמת אישית תוך פחות מדקה — ושלחו אותה
            בלינק אחד בוואטסאפ.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-8">
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
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="v2-container-wide py-16 sm:py-20">
        <h2
          data-anim
          className="v2-display text-center mb-3"
          style={{
            fontSize: 'clamp(1.9rem, 6vw, 2.8rem)',
            color: 'var(--v2-ink)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
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
              className="v2-panel p-6 text-center"
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

      {/* ---------------- Styles: interactive gallery + live device ------- */}
      <section className="v2-container-wide py-14 sm:py-20">
        <h2
          data-anim
          className="v2-display text-center mb-3"
          style={{
            fontSize: 'clamp(1.9rem, 6vw, 2.8rem)',
            color: 'var(--v2-ink)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {TEMPLATE_LIST.length} סגנונות. כל אחד עולם אחר.
        </h2>
        <p
          data-anim
          className="text-center mb-10"
          style={{ color: 'var(--v2-ink-soft)', fontSize: '1.05rem' }}
        >
          בחרו סגנון — והברכה בטלפון משתנה מולכם
        </p>

        <StyleGallery />
      </section>

      {/* ---------------- Occasions ---------------- */}
      <section className="v2-container-wide py-12">
        <div className="flex flex-wrap justify-center gap-2.5">
          {EVENTS.filter((e) => e.id !== 'other').map((e) => (
            <span
              key={e.id}
              data-anim
              className="v2-panel text-sm font-semibold px-4 py-2.5"
              style={{ borderRadius: '999px' }}
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
            background: 'linear-gradient(150deg, #3A0F2E 0%, #26091F 62%, #1A0615 100%)',
            boxShadow: '0 34px 74px -38px rgba(58,15,46,0.85)',
            border: '1px solid rgba(201,162,39,0.34)',
          }}
        >
          <h2
            className="v2-display mb-4"
            style={{
              fontSize: 'clamp(1.7rem, 6vw, 2.6rem)',
              letterSpacing: '-0.01em',
              fontWeight: 700,
              color: '#F6ECDC',
            }}
          >
            מישהו מחכה להפתעה שלכם
          </h2>
          <p className="mb-8" style={{ fontSize: '1.05rem', color: 'rgba(246,236,220,0.82)' }}>
            חינם לגמרי. פרימיום מ-{PREMIUM_PRICE_ILS.toFixed(2)} ₪ לברכה.
          </p>
          <Link
            href="/create"
            className="v2-btn text-lg"
            style={{ background: '#EBD08A', color: '#26091F' }}
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
