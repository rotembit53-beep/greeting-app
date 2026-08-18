'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';

gsap.registerPlugin(useGSAP);

/**
 * The first thing the recipient sees. Three structurally different openings —
 * an envelope that unfolds, a gift whose lid blows off, and balloons you
 * actually have to pop — chosen by the template, never by chance.
 *
 * Whatever happens with the animation, `onOpen` is guaranteed to fire: the
 * timeline drives it, and a timer backs it up in case the tab is throttled.
 */

interface GateProps {
  template: TemplateDef;
  recipientName: string;
  senderName?: string;
  hasGift: boolean;
  onOpen: () => void;
}

const OPEN_FAILSAFE_MS = 4200;

export default function Gate({
  template,
  recipientName,
  senderName,
  hasGift,
  onOpen,
}: GateProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<SVGGElement>(null);
  const lidRef = useRef<SVGGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [opening, setOpening] = useState(false);
  const [poppedCount, setPoppedCount] = useState(0);

  const kind = template.scenes[0];
  const balloonCount = 5;

  const reduceMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Idle choreography ---------------- */

  const { contextSafe } = useGSAP(
    () => {
      if (reduceMotion()) return;

      // fromTo, never from: React StrictMode mounts effects twice in dev, and
      // a `from` tween that gets interrupted can leave the element pinned at
      // its start values (invisible). fromTo always has an explicit end state.
      if (artRef.current) {
        gsap.fromTo(
          artRef.current,
          { scale: 0.82, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.9, ease: 'back.out(1.5)' }
        );
        gsap.to(artRef.current, {
          y: -10,
          rotation: kind === 'gate-gift' ? 1.5 : 2.5,
          duration: 1.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          transformOrigin: '50% 85%',
          delay: 0.9,
        });
      }

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.22,
          opacity: 0.7,
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      // Targeted by selector rather than `copyRef.current.children`: that's a
      // live HTMLCollection, and handing it straight to GSAP left the tween
      // pinned at its start values (elements stuck invisible).
      gsap.fromTo(
        '[data-gate-copy] > *',
        { y: 22, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.09,
          ease: 'power2.out',
          delay: 0.25,
        }
      );
    },
    { scope: rootRef }
  );

  /* ---------------- Opening ---------------- */

  const runOpen = contextSafe(() => {
    if (opening) return;
    setOpening(true);

    if (reduceMotion()) {
      onOpen();
      return;
    }

    // Backstop: if rAF is throttled (backgrounded tab, low-power webview)
    // the timeline may never complete, and the recipient must never be stuck.
    const failsafe = window.setTimeout(onOpen, OPEN_FAILSAFE_MS);

    const tl = gsap.timeline({
      onComplete: () => {
        window.clearTimeout(failsafe);
        onOpen();
      },
    });

    if (kind === 'gate-envelope' && flapRef.current) {
      tl.to(flapRef.current, {
        scaleY: -1,
        svgOrigin: '130 58',
        duration: 0.55,
        ease: 'power2.inOut',
      }).to(
        artRef.current,
        { y: -40, scale: 1.08, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }

    if (kind === 'gate-gift' && lidRef.current) {
      tl.to(lidRef.current, {
        y: -80,
        rotation: -16,
        duration: 0.5,
        ease: 'back.in(1.5)',
        transformOrigin: '50% 50%',
      }).to(
        artRef.current,
        { scale: 1.16, duration: 0.35, ease: 'power2.out' },
        '<'
      );
    }

    if (kind === 'gate-balloons') {
      tl.to('[data-balloon]', {
        y: -window.innerHeight * 1.2,
        rotation: () => gsap.utils.random(-40, 40),
        duration: 1,
        stagger: 0.06,
        ease: 'power2.in',
      });
    }

    if (glowRef.current) {
      tl.to(glowRef.current, { scale: 3, opacity: 0, duration: 0.7 }, '<');
    }

    tl.to(rootRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, '-=0.15');
  });

  /** Balloon gate: pop them one by one, then it opens itself. */
  const popBalloon = contextSafe((index: number, el: HTMLElement) => {
    if (opening) return;

    if (!reduceMotion()) {
      gsap
        .timeline()
        .to(el, { scale: 1.35, duration: 0.12, ease: 'power2.out' })
        .to(el, { scale: 0, autoAlpha: 0, duration: 0.22, ease: 'back.in(2)' });
    } else {
      gsap.set(el, { autoAlpha: 0 });
    }

    const next = poppedCount + 1;
    setPoppedCount(next);
    if (next >= balloonCount) {
      window.setTimeout(runOpen, 320);
    }
  });

  /* ---------------- Art ---------------- */

  const accent = template.palette.accent;
  const ink = template.palette.ink;

  const balloonPalette = template.decor.palette.length
    ? template.decor.palette
    : [accent];

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 px-6 text-center"
      style={{ background: template.palette.pageBg }}
    >
      <div
        ref={glowRef}
        className="v2-glow-blob"
        style={{
          width: 'min(70vw, 22rem)',
          height: 'min(70vw, 22rem)',
          background: `radial-gradient(circle, ${template.palette.glow} 0%, transparent 70%)`,
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div ref={artRef} className="relative z-10">
        {kind === 'gate-envelope' && (
          <svg width="248" height="188" viewBox="0 0 260 200" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="v2-env-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} />
                <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
              </linearGradient>
              <filter id="v2-env-shadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#000" floodOpacity="0.32" />
              </filter>
            </defs>
            <g filter="url(#v2-env-shadow)">
              <rect x="26" y="58" width="208" height="112" rx="14" fill="url(#v2-env-body)" />
              <rect x="52" y="44" width="156" height="82" rx="7" fill="#fffdf8" />
              <path
                d="M72 68 H188 M72 82 H174 M72 96 H182"
                stroke={accent}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.28"
              />
              <path
                d="M26 100 L130 158 L234 100 L234 164 Q234 170 228 170 L32 170 Q26 170 26 164 Z"
                fill="url(#v2-env-body)"
              />
              <path d="M26 100 L130 158 L234 100" stroke="#fff" strokeWidth="1.6" opacity="0.3" fill="none" />
              <circle cx="130" cy="128" r="17" fill="#fff" opacity="0.92" />
              <text x="130" y="135" textAnchor="middle" fontSize="17" fill={accent}>♥</text>
              <g ref={flapRef}>
                <path
                  d="M26 66 Q26 58 34 58 L226 58 Q234 58 234 66 L130 134 Z"
                  fill={accent}
                />
                <path
                  d="M26 66 Q26 58 34 58 L226 58 Q234 58 234 66 L130 134 Z"
                  stroke="#fff"
                  strokeOpacity="0.3"
                  strokeWidth="1.4"
                  fill="none"
                />
              </g>
            </g>
          </svg>
        )}

        {kind === 'gate-gift' && (
          <svg width="212" height="212" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <defs>
              <filter id="v2-gift-shadow" x="-30%" y="-20%" width="160%" height="160%">
                <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000" floodOpacity="0.35" />
              </filter>
            </defs>
            <g filter="url(#v2-gift-shadow)">
              <rect x="42" y="92" width="116" height="84" rx="14" fill={accent} />
              <rect x="91" y="92" width="18" height="84" fill="#fff" opacity="0.85" />
              <g ref={lidRef}>
                <rect x="30" y="64" width="140" height="32" rx="11" fill={accent} />
                <rect x="91" y="64" width="18" height="32" fill="#fff" opacity="0.85" />
                <path d="M100 60C100 36 62 30 62 48C62 62 85 65 100 60Z" fill="#fff" opacity="0.92" />
                <path d="M100 60C100 36 138 30 138 48C138 62 115 65 100 60Z" fill="#fff" opacity="0.92" />
                <circle cx="100" cy="58" r="9" fill={accent} />
              </g>
            </g>
          </svg>
        )}

        {kind === 'gate-balloons' && (
          <div className="flex items-end justify-center gap-2 sm:gap-3">
            {Array.from({ length: balloonCount }).map((_, i) => (
              <button
                key={i}
                data-balloon
                type="button"
                onClick={(e) => popBalloon(i, e.currentTarget)}
                aria-label={`פוצצו בלון ${i + 1}`}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                style={{ marginTop: i % 2 === 0 ? 0 : 18 }}
              >
                <svg width="46" height="70" viewBox="0 0 34 52" fill="none" aria-hidden="true">
                  <ellipse
                    cx="17"
                    cy="16"
                    rx="13"
                    ry="16"
                    fill={balloonPalette[i % balloonPalette.length]}
                  />
                  <ellipse cx="12" cy="10" rx="4" ry="5" fill="rgba(255,255,255,0.4)" />
                  <path d="M17 32 L14 37 H20 Z" fill={balloonPalette[i % balloonPalette.length]} />
                  <path
                    d="M17 37 C 15 44, 19 46, 17 52"
                    stroke={balloonPalette[i % balloonPalette.length]}
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={copyRef}
        data-gate-copy
        className="relative z-10 flex flex-col items-center gap-3"
      >
        <span
          className="inline-block text-xs font-bold px-4 py-2 rounded-full"
          style={{ background: template.palette.accentSoft, color: accent }}
        >
          {template.gate.badge}
        </span>

        <h1
          className={`font-extrabold leading-tight ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
          style={{
            fontSize: 'clamp(1.75rem, 7.5vw, 2.7rem)',
            color: ink,
            fontWeight: template.type.titleWeight,
          }}
        >
          {recipientName}, {template.gate.title}
        </h1>

        <p style={{ color: template.palette.inkSoft, maxWidth: '30rem' }}>
          {template.gate.subtitle}
          {senderName ? ` — מ${senderName}` : ''}
        </p>

        {hasGift && (
          <span
            className="mt-1 inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full"
            style={{ background: accent, color: 'var(--v2-on-accent, #fff)' }}
          >
            🎁 ומחכה לך גם משהו בפנים
          </span>
        )}
      </div>

      {kind === 'gate-balloons' ? (
        <div className="relative z-10 flex flex-col items-center gap-3">
          <p className="text-sm font-semibold" style={{ color: template.palette.inkSoft }}>
            {poppedCount === 0
              ? 'לחצו על הבלונים כדי לפוצץ 🎈'
              : `נשארו ${balloonCount - poppedCount} בלונים`}
          </p>
          <button
            type="button"
            onClick={runOpen}
            className="text-xs underline underline-offset-4"
            style={{ color: template.palette.inkSoft }}
          >
            דלגו ופתחו ישר
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={runOpen}
          disabled={opening}
          className="v2-btn v2-btn-primary relative z-10 text-lg"
        >
          {template.gate.cta}
        </button>
      )}
    </div>
  );
}
