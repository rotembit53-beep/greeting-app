'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import { Greeting } from '@/types/greeting';
import { resolveVisualStyle, DecorKind } from '@/lib/visualStyles';
import ShareModal from '@/components/share/ShareModal';
import ScratchCard from '@/components/greeting/ScratchCard';
import HeroCarousel, { isVideoFile } from '@/components/greeting/HeroCarousel';
import CopyField from '@/components/greeting/CopyField';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/brand/Logo';

gsap.registerPlugin(useGSAP, CustomEase);

interface GiftExperienceProps {
  greeting: Greeting;
}

const CONFETTI_EXTRA = ['#3d8bfd', '#e63946', '#ffb703', '#8e6bd6'];

/**
 * The event subject wins over the style's default decoration, so a wedding
 * always gets rings and an enlistment always gets its own iconography.
 */
function decorKindFor(greeting: Greeting, styleKind: DecorKind): DecorKind {
  const event = greeting.eventType || '';
  if (event.includes('יום הולדת')) return 'cakes';
  if (event.includes('חתונה')) return 'rings';
  if (event.includes('סיום לימודים')) return 'diplomas';
  if (event.includes('גיוס') || event.includes('צה')) return 'military';
  if (event.includes('הולדת תינוק')) return 'baby';
  if (event.includes('מסיבה')) return 'balloons';
  return styleKind;
}

function decorSvg(kind: DecorKind, color: string): string {
  switch (kind) {
    case 'balloons':
      return `<svg width="34" height="52" viewBox="0 0 34 52" fill="none"><ellipse cx="17" cy="16" rx="13" ry="16" fill="${color}"/><ellipse cx="12" cy="10" rx="4" ry="5" fill="rgba(255,255,255,0.35)"/><path d="M17 32 L14 37 H20 Z" fill="${color}"/><path d="M17 37 C 15 44, 19 46, 17 52" stroke="${color}" stroke-width="1.5" fill="none"/></svg>`;
    case 'hearts':
      return `<svg width="28" height="26" viewBox="0 0 24 22" fill="${color}"><path d="M12 22 C 5 16, 0 11.5, 0 6.5 C 0 2.9, 2.9 0, 6.5 0 C 8.7 0, 10.8 1.1, 12 2.9 C 13.2 1.1, 15.3 0, 17.5 0 C 21.1 0, 24 2.9, 24 6.5 C 24 11.5, 19 16, 12 22 Z"/></svg>`;
    case 'petals':
      return `<svg width="22" height="24" viewBox="0 0 22 24" fill="${color}"><path d="M11 0 C 17 5, 22 11, 18 18 C 15 23, 7 23, 4 18 C 0 11, 5 5, 11 0 Z" opacity="0.85"/></svg>`;
    case 'bubbles':
      return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="${color}" stroke-width="1.6" opacity="0.9"/><circle cx="6.5" cy="6" r="1.8" fill="${color}" opacity="0.6"/></svg>`;
    case 'stars':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}"><path d="M12 0 L14.8 8.2 L24 9.2 L17 15.1 L19.4 24 L12 18.8 L4.6 24 L7 15.1 L0 9.2 L9.2 8.2 Z"/></svg>`;
    case 'embers':
      return `<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${color}" opacity="0.9"/></svg>`;
    case 'cakes':
      // Two-tier cake with a lit candle
      return `<svg width="40" height="44" viewBox="0 0 40 44" fill="none">
        <rect x="6" y="24" width="28" height="15" rx="3" fill="${color}"/>
        <rect x="10" y="16" width="20" height="9" rx="2.5" fill="${color}" opacity="0.75"/>
        <rect x="19" y="6" width="2.5" height="9" rx="1.2" fill="${color}" opacity="0.9"/>
        <ellipse cx="20.2" cy="4" rx="2.6" ry="3.6" fill="#ffb703"/>
        <ellipse cx="20.2" cy="4.6" rx="1.2" ry="1.9" fill="#fff2cc"/>
        <circle cx="12" cy="30" r="1.6" fill="#fff" opacity="0.65"/>
        <circle cx="21" cy="33" r="1.6" fill="#fff" opacity="0.65"/>
        <circle cx="29" cy="29" r="1.6" fill="#fff" opacity="0.65"/>
      </svg>`;
    case 'rings':
      // Diamond engagement ring
      return `<svg width="34" height="40" viewBox="0 0 34 40" fill="none">
        <circle cx="17" cy="26" r="10" stroke="${color}" stroke-width="3.2" fill="none"/>
        <path d="M17 3 L24 11 L17 19 L10 11 Z" fill="${color}"/>
        <path d="M17 3 L24 11 L17 11 Z" fill="#fff" opacity="0.45"/>
        <path d="M10 11 L17 11 L17 19 Z" fill="#fff" opacity="0.22"/>
      </svg>`;
    case 'diplomas':
      // Rolled certificate tied with a ribbon
      return `<svg width="42" height="26" viewBox="0 0 42 26" fill="none">
        <rect x="4" y="4" width="34" height="18" rx="3" fill="${color}" opacity="0.92"/>
        <rect x="4" y="4" width="34" height="18" rx="3" stroke="#fff" stroke-width="1.2" opacity="0.4" fill="none"/>
        <path d="M10 10 H30 M10 14 H26" stroke="#fff" stroke-width="1.6" opacity="0.75" stroke-linecap="round"/>
        <rect x="18" y="1" width="5" height="24" rx="2.2" fill="#e0568a"/>
      </svg>`;
    case 'military':
      // Alternates between the IDF-style emblem (sword + olive branch) and a beret
      return Math.random() > 0.5
        ? `<svg width="30" height="38" viewBox="0 0 30 38" fill="none">
             <path d="M15 2 L27 7 V19 C27 27 21 32 15 35 C9 32 3 27 3 19 V7 Z" fill="${color}" opacity="0.9"/>
             <path d="M15 9 V27" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
             <path d="M11 12 H19" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
             <path d="M9 26 C 13 22, 13 16, 11 13" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.8"/>
             <path d="M21 26 C 17 22, 17 16, 19 13" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.8"/>
           </svg>`
        : `<svg width="36" height="26" viewBox="0 0 36 26" fill="none">
             <path d="M4 17 C 6 8, 14 4, 22 5 C 29 6, 33 10, 33 14 L33 16 C33 17 32 18 31 18 L7 19 C5 19 4 18 4 17 Z" fill="${color}"/>
             <rect x="3" y="17" width="30" height="4" rx="2" fill="#2b2320" opacity="0.55"/>
           </svg>`;
    case 'baby':
      // Pacifier
      return `<svg width="30" height="32" viewBox="0 0 30 32" fill="none">
        <circle cx="15" cy="12" r="9" stroke="${color}" stroke-width="3" fill="none"/>
        <ellipse cx="15" cy="24" rx="6" ry="7" fill="${color}"/>
        <circle cx="15" cy="12" r="4" fill="${color}" opacity="0.55"/>
      </svg>`;
    case 'sparkles':
    default:
      return `<svg width="20" height="20" viewBox="0 0 20 20" fill="${color}"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"/></svg>`;
  }
}

/** Palette used for the subject-matched decorations, so they read clearly. */
const SUBJECT_PALETTES: Partial<Record<DecorKind, string[]>> = {
  cakes: ['#e0568a', '#f5a623', '#8e6bd6', '#3d8bfd'],
  rings: ['#7fd3e8', '#bfe9f5', '#e8c4d8', '#ffffff'],
  diplomas: ['#3d8bfd', '#2b5fa8', '#f5a623'],
  military: ['#4a7c59', '#3f6b47', '#6f8f5f'],
  baby: ['#8e6bd6', '#f7b7d3', '#9fd4f0'],
};

export default function GiftExperience({ greeting }: GiftExperienceProps) {
  const style = resolveVisualStyle(greeting.visualConcept, greeting.designOverrides);
  const event = greeting.eventType || '';
  const wantsConfetti =
    event.includes('יום הולדת') || event.includes('מסיבה') || style.id === 'festive' || style.id === 'playful';

  const giftCard = greeting.giftCard;
  // The gift card and the BuyMe voucher are two separate gifts.
  const hasGiftCard = Boolean(
    giftCard?.number || giftCard?.code || giftCard?.date || giftCard?.images?.length
  );
  const giftCount = (hasGiftCard ? 1 : 0) + (greeting.buyMeLink ? 1 : 0);
  const hasGift = giftCount > 0;

  // A video with its own audio takes priority over the background music, so
  // music only gets skipped when at least one video is set to keep its sound
  // (a video explicitly muted via the "בלי קול" upload toggle doesn't block it).
  const hasVideo = greeting.mediaFiles.some(
    (f) => isVideoFile(f) && greeting.mediaAudioSettings?.[f] !== false
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const giftRef = useRef<SVGSVGElement>(null);
  const lidRef = useRef<SVGGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<SVGSVGElement>(null);
  const flapRef = useRef<SVGGElement>(null);
  const giftWrapRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [opened, setOpened] = useState(false);
  const reduceMotionRef = useRef(false);

  const { contextSafe } = useGSAP(
    () => {
      CustomEase.create('giftOut', '0.25, 1, 0.5, 1');

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        reduceMotionRef.current = true;
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        reduceMotionRef.current = false;

        // Waiting-state choreography on the gate — the sealed envelope breathes
        if (envelopeRef.current) {
          gsap.to(envelopeRef.current, {
            rotation: 2.5,
            y: -8,
            duration: 1.4,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            transformOrigin: '50% 90%',
          });
        }
        if (glowRef.current) {
          gsap.to(glowRef.current, {
            scale: 1.25,
            opacity: 0.65,
            duration: 1.6,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }

        // Ambient drifting light blobs behind the card
        gsap.utils.toArray<HTMLElement>('.ambient-blob').forEach((blob, i) => {
          gsap.to(blob, {
            x: i % 2 === 0 ? 90 : -90,
            y: i % 2 === 0 ? 60 : -70,
            scale: 1.2,
            duration: gsap.utils.random(16, 24),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });
      });

      // Desktop-only 3D tilt on the hero photo
      mm.add(
        '(min-width: 992px) and (prefers-reduced-motion: no-preference)',
        () => {
          const wrap = heroWrapRef.current;
          if (!wrap) return;

          const rx = gsap.quickTo(wrap, 'rotationX', { duration: 0.5, ease: 'power2.out' });
          const ry = gsap.quickTo(wrap, 'rotationY', { duration: 0.5, ease: 'power2.out' });

          const onMove = (e: PointerEvent) => {
            const rect = wrap.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            ry(px * 10);
            rx(py * -10);
          };
          const onLeave = () => {
            rx(0);
            ry(0);
          };

          wrap.addEventListener('pointermove', onMove);
          wrap.addEventListener('pointerleave', onLeave);
          return () => {
            wrap.removeEventListener('pointermove', onMove);
            wrap.removeEventListener('pointerleave', onLeave);
          };
        }
      );
    },
    { scope: rootRef }
  );

  // Choreographed content reveal once the gift is opened
  useGSAP(
    () => {
      if (!opened || reduceMotionRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: 'giftOut' } });

      if (cardRef.current) {
        tl.from(cardRef.current, { y: 60, autoAlpha: 0, duration: 1.2 });
      }
      if (heroWrapRef.current) {
        tl.from(heroWrapRef.current, { scale: 1.06, duration: 1.6 }, '-=0.9');
      }
      tl.from(
        '.reveal',
        { y: 36, autoAlpha: 0, duration: 0.8, stagger: 0.1 },
        '-=1.1'
      );

      // These tweens start by hiding the content. If the frame loop is
      // throttled (backgrounded tab, mobile app switch) the timeline never
      // advances and the greeting would stay invisible — so force it to its
      // final state if it hasn't finished on its own.
      const failsafe = window.setTimeout(() => {
        if (tl.progress() < 1) tl.progress(1);
      }, 4000);

      return () => window.clearTimeout(failsafe);
    },
    { scope: rootRef, dependencies: [opened] }
  );

  const launchConfetti = contextSafe(() => {
    const container = confettiRef.current;
    if (!container) return;

    const colors = [...style.decorPalette, ...CONFETTI_EXTRA];
    const count = 140;
    const pieces: HTMLSpanElement[] = [];

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      const shape = Math.random();
      const color = gsap.utils.random(colors);
      let css = `position:absolute;top:-6vh;left:${gsap.utils.random(0, 100)}vw;background:${color};`;
      if (shape < 0.35) {
        // Circles
        const s = gsap.utils.random(6, 10);
        css += `width:${s}px;height:${s}px;border-radius:50%;`;
      } else if (shape < 0.7) {
        // Squares/rects
        const s = gsap.utils.random(7, 12);
        css += `width:${s}px;height:${s * gsap.utils.random(0.5, 1)}px;border-radius:2px;`;
      } else {
        // Streamers
        css += `width:4px;height:${gsap.utils.random(14, 22)}px;border-radius:3px;`;
      }
      piece.style.cssText = css;
      container.appendChild(piece);
      pieces.push(piece);
    }

    pieces.forEach((piece, i) => {
      gsap.to(piece, {
        y: () => window.innerHeight * gsap.utils.random(1.05, 1.3),
        x: () => gsap.utils.random(-140, 140),
        rotation: () => gsap.utils.random(-620, 620),
        duration: gsap.utils.random(2.6, 4.6),
        delay: gsap.utils.random(0, 0.8),
        ease: 'power1.in',
        onComplete: () => {
          piece.remove();
          if (i === pieces.length - 1) container.replaceChildren();
        },
      });
    });
  });

  const startFloatingDecor = contextSafe(() => {
    const container = decorRef.current;
    if (!container) return;

    const kind = decorKindFor(greeting, style.decorKind);
    const palette = SUBJECT_PALETTES[kind] ?? style.decorPalette;
    const count = kind === 'embers' || kind === 'bubbles' ? 14 : 9;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.innerHTML = decorSvg(kind, gsap.utils.random(palette));
      el.style.cssText = `position:absolute;left:${gsap.utils.random(3, 93)}vw;top:110vh;opacity:0;${kind === 'embers' ? 'filter:blur(0.5px);' : ''}`;
      container.appendChild(el);

      gsap.to(el, {
        y: () => -window.innerHeight - 250,
        duration: gsap.utils.random(10, 20),
        delay: gsap.utils.random(0, 10),
        repeat: -1,
        ease: 'none',
        onRepeat: () => {
          el.style.left = `${gsap.utils.random(3, 93)}vw`;
        },
      });
      gsap.to(el, {
        opacity: gsap.utils.random(0.45, 0.85),
        duration: 1.2,
        delay: gsap.utils.random(0, 10),
      });
      gsap.to(el, {
        x: gsap.utils.random(-50, 50),
        rotation: kind === 'petals' ? gsap.utils.random(-160, 160) : gsap.utils.random(-18, 18),
        duration: gsap.utils.random(2.2, 4),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  });

  /** Themed icons burst out of the gift the moment it opens. */
  const launchSubjectBurst = contextSafe(() => {
    const container = confettiRef.current;
    if (!container) return;

    const kind = decorKindFor(greeting, style.decorKind);
    const palette = SUBJECT_PALETTES[kind] ?? style.decorPalette;
    const count = 16;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.innerHTML = decorSvg(kind, gsap.utils.random(palette));
      el.style.cssText =
        'position:absolute;left:50%;top:45%;will-change:transform;pointer-events:none;';
      container.appendChild(el);

      const angle = (i / count) * Math.PI * 2 + gsap.utils.random(-0.3, 0.3);
      const distance = gsap.utils.random(180, 460);

      gsap
        .timeline({ onComplete: () => el.remove() })
        .fromTo(
          el,
          { scale: 0.2, autoAlpha: 0, x: 0, y: 0, rotation: 0 },
          {
            scale: gsap.utils.random(0.85, 1.3),
            autoAlpha: 1,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 60,
            rotation: gsap.utils.random(-180, 180),
            duration: gsap.utils.random(1.1, 1.7),
            ease: 'power2.out',
          }
        )
        .to(el, { autoAlpha: 0, y: '+=90', duration: 0.7, ease: 'power1.in' }, '-=0.35');
    }
  });

  // A small celebration the moment the gift is scratched open
  const revealGiftConfetti = contextSafe(() => {
    if (reduceMotionRef.current) return;
    launchConfetti();
  });

  const handleOpen = contextSafe(() => {
    // A video brings its own sound, so don't start the music over it.
    const audio = audioRef.current;
    if (audio && !hasVideo) {
      audio.volume = 0;
      audio
        .play()
        .then(() => gsap.to(audio, { volume: 1, duration: 2, ease: 'power1.in' }))
        .catch(() => {
          // Audible autoplay refused by the browser — fall back to muted so
          // playback actually starts (matches HeroCarousel's video fallback).
          // The visible <audio controls> bar lets the recipient unmute with one tap.
          audio.volume = 1;
          audio.muted = true;
          audio.play().catch(() => {});
        });
    }

    if (reduceMotionRef.current) {
      setOpened(true);
      return;
    }

    // Safety net: never leave the user stuck at the gate if the animation
    // can't run (hidden tab, throttled webview, etc.)
    window.setTimeout(() => setOpened(true), 4500);

    const tl = gsap.timeline({ onComplete: () => setOpened(true) });

    // 1. The envelope flap folds open
    if (flapRef.current) {
      tl.to(flapRef.current, {
        scaleY: -1,
        svgOrigin: '130 58',
        duration: 0.6,
        ease: 'power2.inOut',
      });
    }

    // 2. The gift rises out of the envelope
    if (giftWrapRef.current) {
      tl.to(
        giftWrapRef.current,
        { autoAlpha: 1, y: -70, scale: 1, duration: 0.75, ease: 'back.out(1.3)' },
        '-=0.15'
      );
    }
    if (envelopeRef.current) {
      tl.to(
        envelopeRef.current,
        { y: 40, autoAlpha: 0, duration: 0.6, ease: 'power2.in' },
        '-=0.45'
      );
    }

    // 3. The lid pops off and the glow bursts
    if (lidRef.current) {
      tl.to(lidRef.current, { y: -60, rotation: -14, duration: 0.5, ease: 'back.in(1.4)' }, '-=0.1');
    }
    if (giftRef.current) {
      tl.to(giftRef.current, { scale: 1.18, duration: 0.35, ease: 'power2.out' }, '<');
    }
    if (glowRef.current) {
      tl.to(glowRef.current, { scale: 2.4, opacity: 0, duration: 0.7, ease: 'power2.out' }, '<');
    }
    tl.to(overlayRef.current, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, '-=0.1');

    if (wantsConfetti) {
      launchConfetti();
    }
    launchSubjectBurst();
    startFloatingDecor();
  });

  return (
    <div
      ref={rootRef}
      className="min-h-screen relative overflow-hidden"
      style={{ background: style.pageBackground }}
    >
      {/* Ambient light blobs */}
      <div
        className="ambient-blob pointer-events-none absolute -top-32 -right-24 w-[45vw] h-[45vw] rounded-full"
        style={{ background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`, filter: 'blur(50px)' }}
        aria-hidden="true"
      />
      <div
        className="ambient-blob pointer-events-none absolute -bottom-40 -left-24 w-[50vw] h-[50vw] rounded-full"
        style={{ background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`, filter: 'blur(60px)' }}
        aria-hidden="true"
      />

      {/* Floating decorations layer */}
      <div ref={decorRef} className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" />
      {/* Confetti layer */}
      <div ref={confettiRef} className="pointer-events-none fixed inset-0 z-40" aria-hidden="true" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-20">
        <div className="flex justify-center mb-8">
          <Logo size={40} tone={style.darkSurface ? 'light' : 'dark'} />
        </div>

        <div ref={cardRef} className="relative">
          {style.pattern && (
            <div
              className="absolute inset-x-0 top-0 h-4 z-10 rounded-full"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(191,85,57,0.35) 2px, transparent 2px)',
                backgroundSize: '14px 14px',
              }}
            />
          )}

          {/* Hero Image with 3D tilt — kept as its own rounded photo insert
              now that it isn't clipped by a surrounding card */}
          {greeting.mediaFiles.length > 0 && (
            <div style={{ perspective: '900px' }}>
              <div ref={heroWrapRef} className="will-change-transform rounded-2xl overflow-hidden">
                <HeroCarousel
                  media={greeting.mediaFiles}
                  alt={`ברכה עבור ${greeting.recipientName}`}
                  overlay={hasVideo ? null : style.heroOverlay}
                  started={opened}
                  accentColor={style.eventColor}
                  audioSettings={greeting.mediaAudioSettings}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="pt-8 pb-6 sm:pt-10 sm:pb-8">
            <h1
              className="reveal text-4xl font-extrabold mb-2"
              style={{ color: style.pageNameColor ?? style.nameColor }}
            >
              {greeting.recipientName}
            </h1>

            <p
              className="reveal text-2xl mb-8"
              style={{ color: style.pageEventColor ?? style.eventColor }}
            >
              {greeting.eventType}
            </p>

            <div className="reveal mb-8">
              <p
                className="text-lg leading-relaxed whitespace-pre-wrap"
                style={{ color: style.pageBodyColor ?? style.bodyColor }}
              >
                {greeting.aiText.fullGreeting}
              </p>
            </div>

            {greeting.audioTrack && (
              <div
                className="reveal mb-8 p-6 rounded-xl border"
                style={{ borderColor: style.cardBorder, background: 'rgba(0,0,0,0.03)' }}
              >
                <p className="field-label" style={{ color: style.pageBodyColor ?? style.bodyColor }}>
                  המוזיקה שנבחרה במיוחד בשבילך
                </p>
                <audio ref={audioRef} src={greeting.audioTrack} controls className="w-full rounded-lg" />
              </div>
            )}

            {hasGift && (
              <div className="reveal mb-8 space-y-5">
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full"
                    style={{ background: style.gift.bow, color: '#fff' }}
                  >
                    <Icon name="gift" size={20} />
                  </span>
                  <div>
                    <p
                      className="text-lg font-bold"
                      style={{ color: style.pageNameColor ?? style.nameColor }}
                    >
                      {giftCount > 1
                        ? `יש לך ${giftCount} מתנות שמחכות שתממש אותן!`
                        : 'יש לך מתנה שמחכה שתממש אותה!'}
                    </p>
                    <p
                      className="text-sm mt-1 leading-relaxed"
                      style={{ color: style.pageBodyColor ?? style.bodyColor }}
                    >
                      {giftCount > 1
                        ? 'כל מתנה מוסתרת מתחת לשכבה כסופה נפרדת. העבירו את האצבע (או את העכבר) על כל שכבה כדי לגרד אותה — בדיוק כמו בכרטיס גירוד — וכל מתנה תתגלה בנפרד.'
                        : 'פרטי המתנה מוסתרים מתחת לשכבה הכסופה שלמטה. העבירו את האצבע (או את העכבר) על השכבה כדי לגרד אותה — בדיוק כמו בכרטיס גירוד — והמתנה שלכם תתגלה.'}
                    </p>
                  </div>
                </div>

                {/* Gift 1 — the gift card */}
                {hasGiftCard && (
                  <div
                    className="p-5 rounded-xl border"
                    style={{ borderColor: style.cardBorder, background: 'rgba(0,0,0,0.03)' }}
                  >
                    <p
                      className="text-sm font-bold mb-3 flex items-center gap-2"
                      style={{ color: style.pageEventColor ?? style.eventColor }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs text-white"
                        style={{ background: style.eventColor }}
                      >
                        1
                      </span>
                      {giftCard?.company ? `כרטיס מתנה — ${giftCard.company}` : 'כרטיס מתנה'}
                    </p>

                    <ScratchCard
                      foilFrom={style.gift.bow}
                      foilTo={style.gift.lid}
                      label="גרדו כאן ✦ פרטי כרטיס המתנה"
                      onRevealed={revealGiftConfetti}
                    >
                      <div
                        className="p-5 space-y-3 text-center"
                        style={{ background: style.cardBackground, minHeight: 140 }}
                      >
                        {giftCard?.images && giftCard.images.length > 0 && (
                          <div
                            className={`grid gap-2 ${giftCard.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                          >
                            {giftCard.images.map((img) => (
                              <img
                                key={img}
                                src={img}
                                alt="תמונת כרטיס המתנה"
                                className="w-full rounded-lg object-cover"
                                style={{ maxHeight: 220 }}
                              />
                            ))}
                          </div>
                        )}

                        {giftCard?.number && (
                          <div>
                            <p className="text-xs" style={{ color: style.bodyColor, opacity: 0.7 }}>
                              מספר כרטיס
                            </p>
                            <p
                              dir="ltr"
                              className="text-lg font-bold tracking-wider"
                              style={{ color: style.nameColor }}
                            >
                              {giftCard.number}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-center gap-8">
                          {giftCard?.code && (
                            <div>
                              <p className="text-xs" style={{ color: style.bodyColor, opacity: 0.7 }}>
                                קוד מימוש
                              </p>
                              <p dir="ltr" className="font-bold" style={{ color: style.eventColor }}>
                                {giftCard.code}
                              </p>
                            </div>
                          )}
                          {giftCard?.date && (
                            <div>
                              <p className="text-xs" style={{ color: style.bodyColor, opacity: 0.7 }}>
                                תוקף
                              </p>
                              <p dir="ltr" className="font-bold" style={{ color: style.eventColor }}>
                                {giftCard.date}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScratchCard>
                  </div>
                )}

                {/* Gift 2 — the BuyMe voucher, shown as a copyable link */}
                {greeting.buyMeLink && (
                  <div
                    className="p-5 rounded-xl border"
                    style={{ borderColor: style.cardBorder, background: 'rgba(0,0,0,0.03)' }}
                  >
                    <p
                      className="text-sm font-bold mb-3 flex items-center gap-2"
                      style={{ color: style.pageEventColor ?? style.eventColor }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs text-white"
                        style={{ background: style.eventColor }}
                      >
                        {hasGiftCard ? 2 : 1}
                      </span>
                      שובר BuyMe
                    </p>

                    <ScratchCard
                      foilFrom={style.gift.lid}
                      foilTo={style.gift.bow}
                      label="גרדו כאן ✦ קישור לשובר BuyMe"
                      onRevealed={revealGiftConfetti}
                    >
                      <div
                        className="p-5 space-y-3"
                        style={{ background: style.cardBackground, minHeight: 140 }}
                      >
                        <p
                          className="text-xs text-center"
                          style={{ color: style.bodyColor, opacity: 0.7 }}
                        >
                          העתיקו את הקישור והדביקו אותו בדפדפן כדי לממש את השובר
                        </p>
                        <CopyField
                          value={greeting.buyMeLink}
                          accentColor={style.eventColor}
                          borderColor={style.cardBorder}
                        />
                      </div>
                    </ScratchCard>
                  </div>
                )}
              </div>
            )}

            <div className="reveal">
              <ShareModal greeting={greeting} />
            </div>
          </div>
        </div>
      </div>

      {/* Gift opening gate */}
      {!opened && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6 text-center"
          style={{ background: style.pageBackground }}
        >
          <Logo size={44} tone={style.darkSurface ? 'light' : 'dark'} />

          <div className="relative flex items-center justify-center">
            <div
              ref={glowRef}
              className="absolute w-64 h-64 rounded-full"
              style={{
                background: `radial-gradient(circle, ${style.glow} 0%, transparent 65%)`,
                opacity: 0.45,
              }}
              aria-hidden="true"
            />
            {/* The gift starts tucked inside the envelope and rises out of it */}
            <div
              ref={giftWrapRef}
              className="absolute invisible"
              style={{ transform: 'scale(0.45)' }}
            >
              <svg
                ref={giftRef}
                width="190"
                height="190"
                viewBox="0 0 200 200"
                fill="none"
                aria-hidden="true"
              >
                <g>
                  <rect x="42" y="92" width="116" height="84" rx="14" fill={style.gift.box} />
                  <rect x="91" y="92" width="18" height="84" fill={style.gift.ribbon} />
                </g>
                <g ref={lidRef}>
                  <rect x="30" y="66" width="140" height="30" rx="10" fill={style.gift.lid} />
                  <rect x="91" y="66" width="18" height="30" fill={style.gift.ribbon} />
                  <path d="M100 62C100 38 62 32 62 50C62 64 85 67 100 62Z" fill={style.gift.bow} />
                  <path d="M100 62C100 38 138 32 138 50C138 64 115 67 100 62Z" fill={style.gift.bow} />
                  <circle cx="100" cy="60" r="9" fill={style.gift.lid} />
                </g>
              </svg>
            </div>

            {/* Sealed envelope — the first thing the recipient sees */}
            <svg
              ref={envelopeRef}
              width="260"
              height="200"
              viewBox="0 0 260 200"
              fill="none"
              className="relative"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="env-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={style.gift.box} />
                  <stop offset="100%" stopColor={style.gift.lid} />
                </linearGradient>
                <linearGradient id="env-front" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={style.gift.lid} />
                  <stop offset="55%" stopColor={style.gift.box} />
                  <stop offset="100%" stopColor={style.gift.lid} />
                </linearGradient>
                <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={style.gift.ribbon} />
                  <stop offset="100%" stopColor={style.gift.box} stopOpacity="0.55" />
                </linearGradient>
                <radialGradient id="env-seal" cx="0.35" cy="0.3" r="0.8">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                  <stop offset="45%" stopColor={style.gift.bow} />
                  <stop offset="100%" stopColor={style.gift.lid} />
                </radialGradient>
                <filter id="env-shadow" x="-30%" y="-30%" width="160%" height="170%">
                  <feDropShadow
                    dx="0"
                    dy="10"
                    stdDeviation="10"
                    floodColor="#000000"
                    floodOpacity="0.28"
                  />
                </filter>
              </defs>

              <g filter="url(#env-shadow)">
                {/* Body */}
                <rect x="26" y="58" width="208" height="112" rx="14" fill="url(#env-body)" />

                {/* Letter peeking out of the top */}
                <rect x="52" y="46" width="156" height="80" rx="6" fill="#fdfaf4" />
                <path
                  d="M70 66 H190 M70 78 H176 M70 90 H184"
                  stroke={style.gift.lid}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.28"
                />

                {/* Front panel with the classic V edge */}
                <path
                  d="M26 100 L130 158 L234 100 L234 164 Q234 170 228 170 L32 170 Q26 170 26 164 Z"
                  fill="url(#env-front)"
                />
                {/* Crisp fold highlights along the V */}
                <path
                  d="M26 100 L130 158 L234 100"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  opacity="0.28"
                  fill="none"
                />

                {/* Wax seal */}
                <circle cx="130" cy="128" r="17" fill="url(#env-seal)" />
                <circle
                  cx="130"
                  cy="128"
                  r="17"
                  stroke="#ffffff"
                  strokeOpacity="0.35"
                  strokeWidth="1.2"
                  fill="none"
                />
                <path
                  d="M130 120 L132.4 126.2 L139 126.6 L133.9 130.6 L135.6 137 L130 133.3 L124.4 137 L126.1 130.6 L121 126.6 L127.6 126.2 Z"
                  fill="#ffffff"
                  opacity="0.55"
                />

                {/* Flap — folds open on click */}
                <g ref={flapRef}>
                  <path
                    d="M26 66 Q26 58 34 58 L226 58 Q234 58 234 66 L130 134 Z"
                    fill="url(#env-flap)"
                  />
                  <path
                    d="M26 66 Q26 58 34 58 L226 58 Q234 58 234 66 L130 134 Z"
                    stroke="#ffffff"
                    strokeOpacity="0.3"
                    strokeWidth="1.4"
                    fill="none"
                  />
                </g>
              </g>
            </svg>
          </div>

          <div>
            <h1
              className="text-3xl font-extrabold mb-2"
              style={{ color: style.pageNameColor ?? style.nameColor }}
            >
              {greeting.recipientName}, מחכה לך כאן מתנה
            </h1>
            <p style={{ color: style.pageBodyColor ?? style.bodyColor, opacity: 0.75 }}>
              מישהו שאוהב אותך הכין עבורך ברכה אישית
            </p>

            {hasGift && (
              <p
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full"
                style={{ background: style.gift.bow, color: '#fff' }}
              >
                <Icon name="gift" size={16} />
                ומחכה לך גם מתנה בפנים
              </p>
            )}
          </div>

          <button onClick={handleOpen} className="btn-primary text-lg !px-12 !py-4">
            פתחו את המעטפה
          </button>
        </div>
      )}
    </div>
  );
}
