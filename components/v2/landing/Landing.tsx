'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TEMPLATE_LIST } from '@/lib/v2/templates';
import { EVENTS } from '@/lib/v2/types';
import { track } from '@/lib/v2/analytics';
import StyleGallery from '@/components/v2/style/StyleGallery';
import LandingNav from './LandingNav';
import HowItWorks from './HowItWorks';

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
      <LandingNav />

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
      <section id="how" className="v2-section v2-container-wide py-16 sm:py-20">
        <p data-anim className="v2-eyebrow text-center mb-4">
          התהליך
        </p>
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

        <HowItWorks />
      </section>

      {/* ---------------- Styles: interactive gallery + live device ------- */}
      <section id="styles" className="v2-section v2-container-wide py-14 sm:py-20">
        <p data-anim className="v2-eyebrow text-center mb-4">
          הסגנונות
        </p>
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
          className="text-center mb-10 sm:mb-14 mx-auto"
          style={{ color: 'var(--v2-ink-soft)', fontSize: '1.05rem', maxWidth: '42ch' }}
        >
          לחצו על סגנון והברכה בטלפון מתחלפת מולכם — צבעים, טיפוגרפיה,
          אנימציות ומוזיקה, הכול משתנה יחד.
        </p>

        <div data-anim>
          <StyleGallery />
        </div>
      </section>

      {/* ---------------- Occasions ----------------
       * Was a bare wall of grey pills sitting under the style board with no
       * heading — same shape, same size, so the two rows blurred into one
       * unexplained mass. It gets its own framing now, and the tags read as
       * a quiet index rather than as a second set of controls. */}
      <section id="occasions" className="v2-section v2-container py-16 sm:py-20 text-center">
        <p data-anim className="v2-eyebrow mb-4">
          לכל רגע
        </p>
        <h2
          data-anim
          className="v2-display mb-3"
          style={{
            fontSize: 'clamp(1.6rem, 5vw, 2.3rem)',
            color: 'var(--v2-ink)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          מתאים לכל אירוע
        </h2>
        <p
          data-anim
          className="mb-9 mx-auto"
          style={{ color: 'var(--v2-ink-soft)', fontSize: '1rem', maxWidth: '40ch' }}
        >
          בוחרים אירוע, וה-AI מתאים אליו את הטקסט, הסגנון והמוזיקה.
        </p>
        <div data-anim className="flex flex-wrap justify-center gap-2 gap-y-2.5">
          {EVENTS.filter((e) => e.id !== 'other').map((e) => (
            <span key={e.id} className="v2-tag">
              {e.emoji} {e.label}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ----------------
       * A full-bleed band rather than a bordered card floating inside a
       * container — the closing note spans the canvas like everything else. */}
      <section>
        <div
          data-anim
          className="v2-band"
          style={{
            background: 'linear-gradient(150deg, #3A0F2E 0%, #26091F 62%, #1A0615 100%)',
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
            חינם, בלי הרשמה, ומוכן תוך דקה.
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
