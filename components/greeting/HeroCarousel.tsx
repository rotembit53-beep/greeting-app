'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function isVideoFile(src: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(src);
}

interface HeroCarouselProps {
  media: string[];
  alt: string;
  overlay?: string | null;
  /** Flips true once the gift is opened — starts playback and auto-advance. */
  started: boolean;
  accentColor: string;
  /** Per-video-file: false = play muted (creator's choice); true/absent = keep its own audio. */
  audioSettings?: Record<string, boolean>;
}

/** How long each still image stays on screen. */
const SLIDE_MS = 4200;

export default function HeroCarousel({
  media,
  alt,
  overlay,
  started,
  accentColor,
  audioSettings,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const pausedRef = useRef(false);
  const reduceMotion = useRef(false);

  const multiple = media.length > 1;

  // Crossfade between slides, with a slow Ken Burns push on the active one
  useGSAP(
    () => {
      reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const isActive = i === index;
        gsap.to(el, {
          autoAlpha: isActive ? 1 : 0,
          duration: reduceMotion.current ? 0 : 0.9,
          ease: 'power2.inOut',
        });

        const inner = el.querySelector('img, video');
        if (inner && isActive && !reduceMotion.current) {
          gsap.fromTo(
            inner,
            { scale: 1 },
            { scale: 1.08, duration: SLIDE_MS / 1000 + 1.5, ease: 'none' }
          );
        }
      });
    },
    { scope: rootRef, dependencies: [index] }
  );

  // Play the active video; pause every other one
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i !== index) {
        v.pause();
        return;
      }
      if (!started) return;
      v.currentTime = 0;
      // Creator's explicit choice (Step2Media "בלי קול" toggle) always wins.
      v.muted = audioSettings?.[media[i]] === false;
      v.play().catch(() => {
        // Audible autoplay refused by the browser — fall back to muted so it still plays
        v.muted = true;
        v.play().catch(() => {});
      });
    });
  }, [index, started, media, audioSettings]);

  // Auto-advance. Videos advance when they finish instead of on a timer.
  useEffect(() => {
    if (!multiple || !started) return;
    if (isVideoFile(media[index])) return;

    const id = window.setTimeout(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % media.length);
    }, SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, started, multiple, media]);

  const goTo = (i: number) => setIndex(((i % media.length) + media.length) % media.length);

  return (
    <div
      ref={rootRef}
      className="relative aspect-video overflow-hidden will-change-transform"
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
    >
      {media.map((src, i) => (
        <div
          key={src}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          {isVideoFile(src) ? (
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={src}
              className="w-full h-full object-cover"
              playsInline
              controls
              muted={audioSettings?.[src] === false}
              loop={media.length === 1}
              onEnded={() => multiple && setIndex((c) => (c + 1) % media.length)}
            />
          ) : (
            <img src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
          )}
        </div>
      ))}

      {overlay && <div className="absolute inset-0 pointer-events-none" style={{ background: overlay }} />}

      {multiple && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-10">
          {media.map((src, i) => (
            <button
              key={src}
              onClick={() => goTo(i)}
              aria-label={`תמונה ${i + 1} מתוך ${media.length}`}
              aria-current={i === index}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                background: i === index ? accentColor : 'rgba(255,255,255,0.75)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
