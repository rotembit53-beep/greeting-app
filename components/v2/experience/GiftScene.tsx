'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TemplateDef } from '@/lib/v2/templates';
import { Gift, GIFT_KIND_META } from '@/lib/v2/gifts';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The gift beat — deliberately the last thing before the closing line.
 *
 * The recipient has already read the whole greeting and thinks it's over.
 * Then a 3D box appears, they open it themselves, and the gift is revealed.
 * The gift is never listed or previewed anywhere earlier in the page.
 */

interface Props {
  template: TemplateDef;
  gift: Gift;
  recipientName: string;
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function GiftScene({ template, gift, recipientName }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);

  const accent = template.palette.accent;
  const meta = GIFT_KIND_META[gift.kind];

  const { contextSafe } = useGSAP(
    () => {
      const el = rootRef.current;
      if (!el) return;

      const teaser = el.querySelectorAll('[data-gift-teaser]');

      if (prefersReduced()) {
        gsap.set(teaser, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        teaser,
        { y: 30, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: template.motion.duration,
          stagger: 0.18,
          ease: template.motion.ease,
          scrollTrigger: { trigger: el, start: 'top 75%', once: true },
        }
      );

      // The box breathes so it reads as interactive before it's touched.
      if (boxRef.current) {
        gsap.to(boxRef.current, {
          y: -9,
          rotation: 1.6,
          duration: 1.7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          transformOrigin: '50% 90%',
        });
      }
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.2,
          opacity: 0.75,
          duration: 1.9,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    },
    { scope: rootRef, dependencies: [template.id] }
  );

  const open = contextSafe(() => {
    if (opened) return;

    if (prefersReduced()) {
      setOpened(true);
      return;
    }

    // Safety net: if the frame loop is throttled (backgrounded tab, low-power
    // webview) the timeline can crawl or stall, and the recipient must never
    // be left staring at a half-open box. Same guard the gate uses.
    const failsafe = window.setTimeout(() => setOpened(true), 2600);

    const tl = gsap.timeline({
      onComplete: () => {
        window.clearTimeout(failsafe);
        setOpened(true);
      },
    });

    if (lidRef.current) {
      tl.to(lidRef.current, {
        y: -110,
        rotation: -18,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'back.in(1.6)',
      });
    }
    if (boxRef.current) {
      tl.to(boxRef.current, { scale: 1.12, duration: 0.3, ease: 'power2.out' }, '<');
      tl.to(boxRef.current, { scale: 0.9, autoAlpha: 0, duration: 0.4 }, '-=0.1');
    }
    if (glowRef.current) {
      tl.to(glowRef.current, { scale: 3.2, opacity: 0, duration: 0.7 }, '<');
    }
  });

  // Reveal animation, once the box has gone
  useGSAP(
    () => {
      if (!opened || !revealRef.current || prefersReduced()) return;
      gsap.fromTo(
        revealRef.current,
        { y: 34, autoAlpha: 0, scale: 0.94 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }
      );
    },
    { scope: rootRef, dependencies: [opened] }
  );

  return (
    <section ref={rootRef} className="v2-container pb-20 sm:pb-28 text-center">
      {!opened ? (
        <>
          <p
            data-gift-teaser
            className="mb-1 text-lg font-semibold"
            style={{ color: 'var(--v2-ink-soft)' }}
          >
            רגע…
          </p>
          <p
            data-gift-teaser
            className={`mb-8 ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
            style={{
              fontSize: 'clamp(1.4rem, 5.6vw, 2.1rem)',
              fontWeight: template.type.display === 'serif' ? 500 : 800,
              color: 'var(--v2-ink)',
            }}
          >
            באמת חשבת שזה נגמר? 😏
          </p>

          <div
            data-gift-teaser
            className="relative inline-flex items-center justify-center mb-8"
          >
            <div
              ref={glowRef}
              className="v2-glow-blob"
              style={{
                width: '16rem',
                height: '16rem',
                background: `radial-gradient(circle, ${template.palette.glow} 0%, transparent 70%)`,
                opacity: 0.5,
              }}
              aria-hidden="true"
            />

            {/* 3D-ish gift box: a lid plane above a body with a ribbon */}
            <button
              type="button"
              onClick={open}
              aria-label="פתחו את המתנה"
              className="relative cursor-pointer transition-transform active:scale-95"
              style={{ perspective: '700px' }}
            >
              <div ref={boxRef} style={{ transformStyle: 'preserve-3d' }}>
                <svg width="190" height="190" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="v2-giftbox-body" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={accent} />
                      <stop offset="100%" stopColor={accent} stopOpacity="0.72" />
                    </linearGradient>
                    <filter id="v2-giftbox-shadow" x="-30%" y="-20%" width="160%" height="165%">
                      <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.38" />
                    </filter>
                  </defs>

                  <g filter="url(#v2-giftbox-shadow)">
                    {/* body */}
                    <rect x="38" y="94" width="124" height="88" rx="14" fill="url(#v2-giftbox-body)" />
                    {/* front-face shading for depth */}
                    <rect x="38" y="94" width="124" height="88" rx="14" fill="#000" opacity="0.06" />
                    {/* vertical ribbon */}
                    <rect x="89" y="94" width="22" height="88" fill="#fff" opacity="0.9" />
                  </g>
                </svg>

                {/* lid sits in its own layer so it can fly off */}
                <div
                  ref={lidRef}
                  className="absolute"
                  style={{ top: 0, insetInlineStart: 0, width: '100%' }}
                >
                  <svg width="190" height="190" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                    <rect x="26" y="62" width="148" height="36" rx="12" fill={accent} />
                    <rect x="26" y="62" width="148" height="36" rx="12" fill="#fff" opacity="0.12" />
                    <rect x="89" y="62" width="22" height="36" fill="#fff" opacity="0.9" />
                    {/* bow */}
                    <path d="M100 58C100 32 60 26 60 46C60 61 84 64 100 58Z" fill="#fff" opacity="0.94" />
                    <path d="M100 58C100 32 140 26 140 46C140 61 116 64 100 58Z" fill="#fff" opacity="0.94" />
                    <circle cx="100" cy="56" r="10" fill={accent} />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          <div data-gift-teaser>
            <button type="button" onClick={open} className="v2-btn v2-btn-primary text-lg">
              🎁 פתחו את המתנה
            </button>
          </div>
        </>
      ) : (
        <div ref={revealRef}>
          <p className="mb-2 text-lg font-semibold" style={{ color: 'var(--v2-ink-soft)' }}>
            בחרתי לך משהו ❤️
          </p>
          <h2
            className={`mb-8 ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
            style={{
              fontSize: 'clamp(1.6rem, 6.4vw, 2.4rem)',
              fontWeight: template.type.display === 'serif' ? 500 : 800,
              color: 'var(--v2-ink)',
            }}
          >
            {recipientName}, יש לך גם מתנה!
          </h2>

          <div
            className="rounded-3xl px-6 py-8 mx-auto"
            style={{
              maxWidth: '26rem',
              background: 'var(--v2-surface)',
              border: `2px solid ${accent}`,
              boxShadow: `0 26px 60px -30px ${template.palette.glow}`,
            }}
          >
            <div className="text-5xl mb-3">{gift.emoji || meta.emoji}</div>

            <p
              className="text-xl font-extrabold mb-1"
              style={{ color: 'var(--v2-ink)' }}
            >
              {gift.title}
            </p>

            {gift.description ? (
              <p className="text-sm mb-4" style={{ color: 'var(--v2-ink-soft)' }}>
                {gift.description}
              </p>
            ) : null}

            {gift.amount ? (
              <p
                className="text-3xl font-extrabold my-4"
                style={{ color: accent }}
                dir="ltr"
              >
                ₪{gift.amount}
              </p>
            ) : null}

            {gift.imageUrl ? (
              <img
                src={gift.imageUrl}
                alt={gift.title}
                className="w-full rounded-2xl my-4"
                style={{ border: '1px solid var(--v2-surface-border)' }}
              />
            ) : null}

            {gift.code ? (
              <div
                className="rounded-2xl px-4 py-3 my-4"
                style={{ background: 'var(--v2-accent-soft)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--v2-ink-soft)' }}>
                  קוד מימוש
                </p>
                <p
                  dir="ltr"
                  className="text-lg font-extrabold tracking-wider select-all"
                  style={{ color: 'var(--v2-ink)' }}
                >
                  {gift.code}
                </p>
              </div>
            ) : null}

            {gift.url ? (
              <a
                href={gift.url}
                target="_blank"
                rel="noopener noreferrer"
                className="v2-btn v2-btn-primary w-full mt-2"
              >
                למימוש המתנה
              </a>
            ) : null}

            {gift.note ? (
              <p
                className="text-sm mt-5 leading-relaxed"
                style={{ color: 'var(--v2-ink)', opacity: 0.85 }}
              >
                “{gift.note}”
              </p>
            ) : null}

            {gift.provider ? (
              <p className="text-[11px] mt-4" style={{ color: 'var(--v2-ink-soft)' }}>
                {gift.provider}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
