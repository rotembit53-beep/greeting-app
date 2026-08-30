'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';
import { MediaItem } from '@/lib/v2/types';
import { safeReveal } from './opening/engines/shared';

gsap.registerPlugin(useGSAP);

/**
 * The first thing the recipient sees after unlocking: their own photos and
 * videos, full-bleed, before a word of the greeting.
 *
 * Presented as a story-style sequence rather than a grid — one memory at a
 * time, at size, is what makes this land emotionally. Photos advance on their
 * own; a video holds until it finishes or the viewer moves on, because
 * cutting away from someone's face mid-sentence is the one thing this must
 * never do.
 */

const PHOTO_MS = 3600;

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  template: TemplateDef;
  media: MediaItem[];
  /** Optional AI-written line introducing the memories. */
  intro?: string;
}

export default function MediaHero({ template, media, intro }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const item = media[index];
  const isVideo = item?.type === 'video';

  const go = useCallback(
    (next: number) => {
      if (!media.length) return;
      setIndex(((next % media.length) + media.length) % media.length);
    },
    [media.length]
  );

  /* Auto-advance. Photos run on a timer; videos are driven by `onEnded`, so
   * no timer is armed for them at all. */
  useEffect(() => {
    if (isVideo || paused || media.length < 2) return;
    const id = window.setTimeout(() => go(index + 1), PHOTO_MS);
    return () => window.clearTimeout(id);
  }, [index, isVideo, paused, media.length, go]);

  /* Only one video is ever mounted, so several can never play at once. Muted
   * autoplay is the only kind mobile browsers allow without a gesture; if the
   * play promise is rejected anyway the poster frame simply stays up and the
   * viewer can advance manually. */
  useEffect(() => {
    if (!isVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => {});
  }, [index, isVideo]);

  /* Cross-fade + a slow push in. Re-runs per slide via the dependency. */
  useGSAP(
    () => {
      const frame = frameRef.current;
      if (!frame) return;

      // Whether the photo is visible at all must not depend on rAF running.
      const cleanup = safeReveal(
        frame,
        { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' },
        { autoAlpha: 0, scale: 1.04 }
      );

      if (prefersReduced()) return cleanup;

      // Ken Burns only for stills — drifting a video fights its own framing.
      if (!isVideo) {
        gsap.fromTo(
          frame.querySelector('[data-media]'),
          { scale: 1 },
          { scale: 1.07, duration: PHOTO_MS / 1000 + 0.6, ease: 'none' }
        );
      }

      return cleanup;
    },
    { scope: rootRef, dependencies: [index, isVideo] }
  );

  useGSAP(
    () =>
      safeReveal('[data-hero-intro]', {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        delay: 0.25,
        ease: 'power2.out',
      }),
    { scope: rootRef }
  );

  if (!media.length) return null;

  const { accent, ink, inkSoft, surfaceBorder } = template.palette;

  return (
    <section ref={rootRef} className="pt-6 pb-10 sm:pb-14">
      {intro && (
        <p
          data-hero-intro
          className={`v2-container text-center mb-4 ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
          style={{
            fontSize: 'clamp(1.15rem, 5vw, 1.6rem)',
            fontWeight: template.type.display === 'serif' ? 500 : 800,
            color: accent,
          }}
        >
          {intro}
        </p>
      )}

      <div className="v2-bleed">
        <div
          ref={frameRef}
          className="relative overflow-hidden"
          style={{
            aspectRatio: '4 / 5',
            maxHeight: '76vh',
            // Once max-height binds, the aspect ratio makes the box narrower
            // than its container — as a block in an RTL page it would then sit
            // against the right edge with all the slack on the left.
            marginInline: 'auto',
            background: `${ink}0a`,
            boxShadow: `0 26px 64px -30px ${template.palette.glow}`,
          }}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              data-media
              src={item.url}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              controls
              onEnded={() => go(index + 1)}
              onPlay={() => setPaused(false)}
            />
          ) : (
            <img
              data-media
              src={item.url}
              alt={item.caption || ''}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ willChange: 'transform' }}
            />
          )}

          {/* Tap zones — the story-viewer gesture people already know. Kept
            * clear of a video's own controls at the bottom. */}
          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="התמונה הבאה"
                className="absolute inset-y-0 start-0 w-1/2"
                style={{ bottom: isVideo ? '3.5rem' : 0 }}
              />
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="התמונה הקודמת"
                className="absolute inset-y-0 end-0 w-1/2"
                style={{ bottom: isVideo ? '3.5rem' : 0 }}
              />
            </>
          )}

          {item.caption && (
            <p
              className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-10 text-center text-sm font-semibold pointer-events-none"
              style={{
                color: '#fff',
                background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent)',
                paddingBottom: isVideo ? '3.5rem' : undefined,
              }}
            >
              {item.caption}
            </p>
          )}
        </div>
      </div>

      {media.length > 1 && (
        // Deliberately `ltr`, independent of the page's own RTL direction:
        // the "next" tap zone sits on the right (`start` in RTL), so the
        // active dot must also progress rightward as `index` grows to stay
        // parallel with the direction the viewer is actually moving through
        // the sequence. Mirroring this row under `rtl` — as the container
        // did before — put photo 1 on the far right and made the indicator
        // crawl backwards (right-to-left) while tapping the right/forward
        // zone, which read as broken.
        <div className="v2-container mt-4 flex items-center justify-center gap-1.5" dir="ltr">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setPaused(true);
                go(i);
              }}
              aria-label={`פריט ${i + 1}`}
              aria-current={i === index}
              className="rounded-full transition-all"
              style={{
                width: i === index ? '1.6rem' : '0.45rem',
                height: '0.45rem',
                background: i === index ? accent : `${inkSoft}55`,
                border: i === index ? 'none' : `1px solid ${surfaceBorder}`,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
