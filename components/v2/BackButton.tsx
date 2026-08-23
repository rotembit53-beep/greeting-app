'use client';

import { useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

/**
 * A "go back" control built to read as a back control from its shape alone —
 * a circular chevron, the same glyph every phone's native back button uses —
 * rather than a pill someone has to stop and read the Hebrew on. The chevron
 * steps back on hover and snaps like a pressed key on click/tap, the same
 * tactile language as the calculator keys elsewhere in the product (see
 * BudgetCalculator's `bump`). `label` is optional context ("לפרטים",
 * "לעריכה"…) that rides along next to the icon — never required to
 * understand what the control does.
 */

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  onClick?: () => void;
  href?: string;
  label?: string;
  variant?: 'ghost' | 'floating';
  className?: string;
  style?: CSSProperties;
}

export default function BackButton({
  onClick,
  href,
  label,
  variant = 'ghost',
  className,
  style,
}: Props) {
  const arrowRef = useRef<HTMLSpanElement>(null);

  const step = () => {
    if (reducedMotion() || !arrowRef.current) return;
    gsap.to(arrowRef.current, {
      x: -5,
      duration: 0.26,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const settle = () => {
    if (reducedMotion() || !arrowRef.current) return;
    gsap.to(arrowRef.current, {
      x: 0,
      duration: 0.32,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const press = () => {
    if (reducedMotion() || !arrowRef.current) return;
    gsap.fromTo(
      arrowRef.current,
      { x: -10 },
      { x: 0, duration: 0.42, ease: 'back.out(3)', overwrite: 'auto' }
    );
  };

  const content = (
    <>
      <span className="v2-back-circle" aria-hidden="true">
        <span ref={arrowRef} className="v2-back-arrow">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M14.5 6.5l-6 5.5 6 5.5"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      {label && <span className="v2-back-label">{label}</span>}
    </>
  );

  const classes = [
    'v2-back-btn',
    variant === 'floating' ? 'v2-back-btn-floating' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const shared = {
    className: classes,
    style,
    onMouseEnter: step,
    onMouseLeave: settle,
    onFocus: step,
    onBlur: settle,
    'aria-label': label ? `חזרה — ${label}` : 'חזרה',
  };

  if (href) {
    return (
      <Link href={href} onClick={press} {...shared}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        press();
        onClick?.();
      }}
      {...shared}
    >
      {content}
    </button>
  );
}
