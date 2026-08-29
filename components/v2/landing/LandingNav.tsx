'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { track } from '@/lib/v2/analytics';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

/**
 * The landing page's masthead nav.
 *
 * The page used to open straight onto the hero with no way to see what else
 * was down there, so everything below the fold depended on the visitor
 * deciding to scroll on faith. The bar names the three sections, keeps the
 * "create" action reachable from anywhere on the page, and marks which
 * section the reader is currently in.
 *
 * The bar carries its own surface from the first paint rather than fading one
 * in past the hero: a masthead that isn't there until you scroll is a masthead
 * a first-time visitor never sees.
 */

const LINKS = [
  { id: 'how', label: 'איך זה עובד' },
  { id: 'styles', label: 'סגנונות' },
  { id: 'occasions', label: 'אירועים' },
];

/** Height of the bar. Mirrored in CSS as `--v2-nav-h`. */
const NAV_HEIGHT = 64;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LandingNav() {
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useGSAP(
    () => {
      /* The sections this bar watches live outside it, so these are real
       * element lookups: `scope` resolves selector strings against the nav
       * itself, where none of them exist.
       *
       * Which section the reader is actually in, for the link states. */
      LINKS.forEach((link) => {
        const section = document.getElementById(link.id);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: `top ${NAV_HEIGHT + 24}px`,
          end: `bottom ${NAV_HEIGHT + 24}px`,
          onToggle: (self) => setActive((current) => (self.isActive ? link.id : current === link.id ? '' : current)),
        });
      });

      if (prefersReducedMotion()) return;

      // The bar drops in once, on load.
      gsap.from(rootRef.current, {
        y: -NAV_HEIGHT,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    },
    { scope: rootRef }
  );

  // Open/close choreography for the mobile panel and its toggle.
  useGSAP(
    () => {
      const bars = gsap.utils.toArray<HTMLElement>('[data-bar]');
      if (prefersReducedMotion()) {
        gsap.set(bars, { rotation: 0, y: 0 });
        return;
      }

      gsap.to(bars, {
        rotation: (i) => (open ? (i === 0 ? 45 : -45) : 0),
        y: (i) => (open ? (i === 0 ? 3.5 : -3.5) : 0),
        duration: 0.34,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (!open) return;
      gsap.from('.v2-nav-panel', { height: 0, duration: 0.34, ease: 'power2.out' });
      gsap.from('.v2-nav-panel-link', {
        y: -10,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: 'power2.out',
      });
    },
    { scope: rootRef, dependencies: [open] }
  );

  // Escape closes the panel — a menu you can open but not dismiss from the
  // keyboard is a trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* Anchor jumps run through GSAP rather than `href="#id"` so the page
   * scrolls instead of teleporting, and so the offset for the fixed bar is
   * applied in exactly one place. */
  const goTo = (id: string) => {
    setOpen(false);
    const target = document.getElementById(id);
    if (!target) return;

    if (prefersReducedMotion()) {
      target.scrollIntoView();
      return;
    }
    gsap.to(window, {
      duration: 0.9,
      ease: 'power2.inOut',
      scrollTo: { y: target, offsetY: NAV_HEIGHT + 8 },
    });
  };

  const toTop = () => {
    setOpen(false);
    if (prefersReducedMotion()) {
      window.scrollTo(0, 0);
      return;
    }
    gsap.to(window, { duration: 0.8, ease: 'power2.inOut', scrollTo: 0 });
  };

  return (
    <header ref={rootRef} className="v2-nav">
      <div className="v2-nav-inner v2-container-wide">
        <button type="button" className="v2-nav-mark" onClick={toTop} aria-label="לראש העמוד">
          Intera<span className="v2-logo-gi">gift</span>
        </button>

        <nav className="v2-nav-links" aria-label="ניווט בעמוד">
          {LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className="v2-nav-link"
              data-active={active === link.id || undefined}
              aria-current={active === link.id ? 'true' : undefined}
              onClick={() => goTo(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="v2-nav-actions">
          <Link
            href="/create"
            className="v2-btn v2-btn-primary v2-nav-cta"
            onClick={() => track('started_creating', { props: { from: 'nav' } })}
          >
            צור ברכה
          </Link>

          <button
            type="button"
            className="v2-nav-toggle"
            aria-expanded={open}
            aria-controls="v2-nav-panel"
            aria-label={open ? 'סגירת התפריט' : 'פתיחת התפריט'}
            onClick={() => setOpen((v) => !v)}
          >
            <span data-bar />
            <span data-bar />
          </button>
        </div>
      </div>

      {/* Rendered only while open, so the links stay out of the tab order when
        * it's shut — a hidden-but-focusable menu is the classic way this
        * pattern breaks for keyboard users. */}
      {open && (
        <div id="v2-nav-panel" className="v2-nav-panel">
          {LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className="v2-nav-panel-link"
              onClick={() => goTo(link.id)}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
