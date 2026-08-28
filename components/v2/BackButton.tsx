'use client';

import Link from 'next/link';

/**
 * The way back, identical on every step: a plain button reading "הקודם".
 *
 * It used to be a circular chevron carrying an optional label beside it,
 * which left the control looking different on almost every step — some with
 * words, some without — and the wordless ones read as decoration rather than
 * as the way back. One shape, one word, no glyph: the same button sitting in
 * the same place in every step's action row, next to the way forward.
 */

interface Props {
  onClick?: () => void;
  href?: string;
  className?: string;
}

const CLASSES = 'v2-btn v2-btn-ghost v2-back-btn';

export default function BackButton({ onClick, href, className }: Props) {
  const classes = className ? `${CLASSES} ${className}` : CLASSES;

  if (href) {
    return (
      <Link href={href} className={classes}>
        הקודם
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      הקודם
    </button>
  );
}
