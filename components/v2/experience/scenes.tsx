'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TemplateDef } from '@/lib/v2/templates';
import { GreetingContent, MediaItem } from '@/lib/v2/types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The content beats. Each one is a self-contained scene that reveals itself
 * as the recipient scrolls into it, styled entirely from the template's
 * `--v2-*` variables and motion profile.
 */

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Staggered entrance for `[data-reveal]` children, driven by scroll. */
function useSceneReveal(
  scope: React.RefObject<HTMLElement | null>,
  template: TemplateDef,
  deps: unknown[] = []
) {
  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;

      const targets = el.querySelectorAll('[data-reveal]');
      if (!targets.length) return;

      if (prefersReduced()) {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { y: 34, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: template.motion.duration,
          stagger: template.motion.stagger,
          ease: template.motion.ease,
          scrollTrigger: {
            trigger: el,
            start: 'top 78%',
            once: true,
          },
        }
      );
    },
    { scope, dependencies: [template.id, ...deps] }
  );
}

interface SceneProps {
  template: TemplateDef;
  content: GreetingContent;
}

/* ------------------------------------------------------------------ *
 * Reveal — the hero moment: title, intro, then the body beats
 * ------------------------------------------------------------------ */

export function RevealScene({ template, content }: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  useSceneReveal(ref, template);

  const t = template.type;

  return (
    <section ref={ref} className="v2-container py-16 sm:py-24">
      <h1
        data-reveal
        className={t.display === 'serif' ? 'v2-serif' : ''}
        style={{
          fontSize: t.titleSize,
          fontWeight: t.titleWeight,
          letterSpacing: t.titleTracking,
          textTransform: t.titleTransform,
          lineHeight: 1.08,
          color: 'var(--v2-ink)',
          marginBottom: '1.25rem',
        }}
      >
        {content.title}
      </h1>

      <p
        data-reveal
        style={{
          fontSize: `calc(${t.bodySize} * 1.12)`,
          lineHeight: t.bodyLeading,
          color: 'var(--v2-ink)',
          opacity: 0.92,
          marginBottom: '3rem',
        }}
      >
        {content.intro}
      </p>

      <div className="flex flex-col gap-10">
        {content.sections.map((section, i) => (
          <div key={i} data-reveal>
            {section.heading ? (
              <h2
                className={t.display === 'serif' ? 'v2-serif' : ''}
                style={{
                  fontSize: 'clamp(1.15rem, 4.6vw, 1.5rem)',
                  fontWeight: t.display === 'serif' ? 500 : 800,
                  color: 'var(--v2-accent)',
                  marginBottom: '0.6rem',
                }}
              >
                {section.heading}
              </h2>
            ) : null}
            <p
              style={{
                fontSize: t.bodySize,
                lineHeight: t.bodyLeading,
                color: 'var(--v2-ink)',
                opacity: 0.9,
                whiteSpace: 'pre-wrap',
              }}
            >
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Messages — short screenshot-able lines as cards
 * ------------------------------------------------------------------ */

export function MessagesScene({ template, content }: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  useSceneReveal(ref, template);

  if (!content.messages?.length) return null;

  return (
    <section ref={ref} className="v2-container pb-16 sm:pb-24">
      <div className="flex flex-col gap-3">
        {content.messages.map((message, i) => (
          <div
            key={i}
            data-reveal
            className="rounded-2xl px-5 py-4"
            style={{
              background: 'var(--v2-surface)',
              border: '1.5px solid var(--v2-surface-border)',
              color: 'var(--v2-ink)',
              fontWeight: 600,
              fontSize: 'clamp(1rem, 4vw, 1.15rem)',
              lineHeight: 1.6,
              // Alternating inset gives the stack a rhythm instead of
              // reading as a plain list.
              marginInlineStart: i % 2 === 0 ? 0 : 'clamp(0px, 6vw, 2.5rem)',
              marginInlineEnd: i % 2 === 0 ? 'clamp(0px, 6vw, 2.5rem)' : 0,
            }}
          >
            <span style={{ color: 'var(--v2-accent)', marginInlineEnd: '0.5rem' }}>✦</span>
            {message}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Memories — photos revealed one at a time, not a grid dump
 * ------------------------------------------------------------------ */

export function MemoriesScene({
  template,
  media,
}: {
  template: TemplateDef;
  media: MediaItem[];
}) {
  const ref = useRef<HTMLElement>(null);
  useSceneReveal(ref, template, [media.length]);

  if (!media.length) return null;

  return (
    <section ref={ref} className="v2-container pb-16 sm:pb-24">
      <p
        data-reveal
        className={template.type.display === 'serif' ? 'v2-serif' : ''}
        style={{
          fontSize: 'clamp(1.3rem, 5.5vw, 1.9rem)',
          fontWeight: template.type.display === 'serif' ? 500 : 800,
          color: 'var(--v2-accent)',
          marginBottom: '1.5rem',
        }}
      >
        זוכר/ת את הרגעים האלה?
      </p>

      <div className="flex flex-col gap-6">
        {media.map((item, i) => (
          <figure key={`${item.url}-${i}`} data-reveal className="m-0">
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                border: '1.5px solid var(--v2-surface-border)',
                boxShadow: '0 18px 50px -22px var(--v2-glow)',
                // Slight alternating tilt so a run of photos reads as a
                // scattered pile rather than a uniform column.
                transform: `rotate(${i % 2 === 0 ? -1.1 : 1.1}deg)`,
              }}
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full block"
                  style={{ maxHeight: '70vh' }}
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || `זיכרון ${i + 1}`}
                  loading="lazy"
                  className="w-full block"
                  style={{ maxHeight: '70vh', objectFit: 'cover' }}
                />
              )}
            </div>
            {item.caption ? (
              <figcaption
                className="mt-3 text-center text-sm"
                style={{ color: 'var(--v2-ink-soft)' }}
              >
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Surprise — the "there's one more thing" beat
 * ------------------------------------------------------------------ */

export function SurpriseScene({ template, content }: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useSceneReveal(ref, template);

  if (!content.surprise) return null;

  const reveal = () => {
    setRevealed(true);
    if (prefersReduced()) return;
    requestAnimationFrame(() => {
      if (!revealRef.current) return;
      gsap.fromTo(
        revealRef.current,
        { y: 26, autoAlpha: 0, scale: 0.96 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: template.motion.duration,
          ease: template.motion.ease,
        }
      );
    });
  };

  return (
    <section ref={ref} className="v2-container pb-16 sm:pb-24 text-center">
      {!revealed ? (
        <button
          data-reveal
          type="button"
          onClick={reveal}
          className="v2-btn v2-btn-primary text-lg"
        >
          ✨ יש עוד משהו…
        </button>
      ) : (
        <div
          ref={revealRef}
          className="rounded-3xl px-6 py-8"
          style={{
            background: 'var(--v2-accent-soft)',
            border: '1.5px solid var(--v2-accent)',
          }}
        >
          <p
            className={template.type.display === 'serif' ? 'v2-serif' : ''}
            style={{
              fontSize: 'clamp(1.15rem, 4.8vw, 1.5rem)',
              lineHeight: 1.7,
              color: 'var(--v2-ink)',
              fontWeight: 600,
            }}
          >
            {content.surprise}
          </p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Closing
 * ------------------------------------------------------------------ */

export function ClosingScene({
  template,
  content,
  senderName,
}: SceneProps & { senderName?: string }) {
  const ref = useRef<HTMLElement>(null);
  useSceneReveal(ref, template);

  return (
    <section ref={ref} className="v2-container pb-24 sm:pb-32 text-center">
      <div
        data-reveal
        className="mx-auto mb-8"
        style={{ width: 56, height: 2, background: 'var(--v2-accent)', opacity: 0.6 }}
      />
      <p
        data-reveal
        className={template.type.display === 'serif' ? 'v2-serif' : ''}
        style={{
          fontSize: 'clamp(1.25rem, 5.2vw, 1.7rem)',
          lineHeight: 1.75,
          color: 'var(--v2-ink)',
          fontWeight: template.type.display === 'serif' ? 500 : 700,
        }}
      >
        {content.closing}
      </p>

      {senderName ? (
        <p
          data-reveal
          className="mt-6 text-lg font-bold"
          style={{ color: 'var(--v2-accent)' }}
        >
          — {senderName}
        </p>
      ) : null}
    </section>
  );
}
