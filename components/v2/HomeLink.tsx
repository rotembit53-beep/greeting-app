'use client';

import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/**
 * The wordmark in the create flow's header, doubling as the way back.
 *
 * A wordmark doesn't announce that it's a control, so the motion does it —
 * no label, no arrow, nothing to read. On hover the mark lifts, the ink half
 * warms toward the gold, the foil on "gift" sweeps across as if catching
 * light, and a gold rule draws itself out from the centre. All of it comes
 * back on the way out, so the resting state stays a plain wordmark.
 *
 * Touch has no hover to offer, so the same beat plays itself once a few
 * seconds in — once per browser session, and just as wordlessly.
 */

const HINT_SEEN_KEY = 'interagift-home-hint-seen';

export default function HomeLink() {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const hoverRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      // Reduced motion keeps the affordance, minus the movement: the colour
      // shift and the rule are CSS transitions that respect the same query.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });

      tl.addLabel('lift')
        .to('[data-home-mark]', { y: -2, duration: 0.4 }, 'lift')
        // The foil is a gradient wider than the text, so moving its position
        // reads as light travelling across the letters rather than a colour
        // change. `ease: "none"` — a sweep that decelerates looks like a drag.
        .fromTo(
          '[data-home-foil]',
          { backgroundPositionX: '0%' },
          { backgroundPositionX: '100%', duration: 0.75, ease: 'none' },
          'lift'
        )
        .fromTo(
          '[data-home-rule]',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.45 },
          'lift+=0.05'
        );

      hoverRef.current = tl;

      const enter = () => tl.play();
      const leave = () => tl.reverse();

      root.addEventListener('pointerenter', enter);
      root.addEventListener('pointerleave', leave);
      root.addEventListener('focus', enter);
      root.addEventListener('blur', leave);

      // One wordless demonstration for anyone who can't hover.
      let seen = false;
      try {
        seen = sessionStorage.getItem(HINT_SEEN_KEY) === '1';
      } catch {
        // Private mode / storage disabled — play it, just don't remember.
      }

      if (!seen && !window.matchMedia('(pointer: fine)').matches) {
        try {
          sessionStorage.setItem(HINT_SEEN_KEY, '1');
        } catch {
          /* nothing to do */
        }
        gsap.delayedCall(2.4, () => tl.play());
        gsap.delayedCall(4.2, () => tl.reverse());
      }

      return () => {
        root.removeEventListener('pointerenter', enter);
        root.removeEventListener('pointerleave', leave);
        root.removeEventListener('focus', enter);
        root.removeEventListener('blur', leave);
      };
    },
    { scope: rootRef }
  );

  return (
    <Link
      ref={rootRef}
      href="/"
      aria-label="Interagift — חזרה לדף הבית"
      className="v2-home-link justify-self-center"
    >
      <span data-home-mark className="v2-display v2-home-mark" style={{ direction: 'ltr' }}>
        Intera
        <span data-home-foil className="v2-home-foil">
          gift
        </span>
      </span>
      <span data-home-rule aria-hidden="true" className="v2-home-rule" />
    </Link>
  );
}
