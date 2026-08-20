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
            className="py-3"
            style={{
              color: 'var(--v2-ink)',
              fontWeight: 500,
              fontSize: 'clamp(1.05rem, 4vw, 1.3rem)',
              lineHeight: 1.7,
              // No bubble: an accent rule on the reading edge carries the
              // line instead of a bordered card around it.
              borderInlineStart: '2px solid var(--v2-accent)',
              paddingInlineStart: '1.15rem',
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
 * Memories — staged per the template's photoPresentation, never a plain grid
 * ------------------------------------------------------------------ */

function MediaFrame({
  item,
  className = '',
  style,
  dataAttr,
}: {
  item: MediaItem;
  className?: string;
  style?: React.CSSProperties;
  /** Marker the scene's scroll effects hook onto, e.g. "data-kenburns". */
  dataAttr?: string;
}) {
  const marker = dataAttr ? { [dataAttr]: '' } : {};
  if (item.type === 'video') {
    return (
      <video
        {...marker}
        src={item.url}
        controls
        playsInline
        preload="metadata"
        className={`w-full block ${className}`}
        style={style}
      />
    );
  }
  if (item.type === 'audio') {
    return <audio src={item.url} controls className={`w-full ${className}`} style={style} />;
  }
  return (
    <img
      {...marker}
      src={item.url}
      alt={item.caption || 'זיכרון'}
      loading="lazy"
      className={`w-full block ${className}`}
      style={style}
    />
  );
}

export function MemoriesScene({
  template,
  media,
}: {
  template: TemplateDef;
  media: MediaItem[];
}) {
  const ref = useRef<HTMLElement>(null);
  useSceneReveal(ref, template, [media.length, template.photoPresentation]);

  // Ken Burns / parallax drift on the active images.
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReduced()) return;

      if (template.photoPresentation === 'cinematic') {
        gsap.utils.toArray<HTMLElement>('[data-kenburns]', el).forEach((img, i) => {
          gsap.fromTo(
            img,
            { scale: 1.02, xPercent: i % 2 === 0 ? -1.5 : 1.5 },
            {
              scale: 1.14,
              xPercent: 0,
              ease: 'none',
              scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
            }
          );
        });
      }

      if (template.photoPresentation === 'parallax') {
        gsap.utils.toArray<HTMLElement>('[data-parallax]', el).forEach((img, i) => {
          gsap.fromTo(
            img,
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: 'none',
              scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 0.35 },
            }
          );
        });
      }
    },
    { scope: ref, dependencies: [media.length, template.photoPresentation] }
  );

  if (!media.length) return null;

  const presentation = template.photoPresentation;

  return (
    <section ref={ref} className="v2-bleed pb-16 sm:pb-24">
      <p
        data-reveal
        className={`v2-measure ${template.type.display === 'serif' ? 'v2-serif' : ''}`}
        style={{
          fontSize: 'clamp(1.3rem, 5.5vw, 1.9rem)',
          fontWeight: template.type.display === 'serif' ? 500 : 800,
          color: 'var(--v2-accent)',
          marginBottom: '1.5rem',
        }}
      >
        {media.length > 1 ? 'זוכר/ת את הרגעים האלה?' : 'זוכר/ת את היום הזה?'}
      </p>

      {/* ---- Polaroid stack: tilted prints with a caption strip ---- */}
      {presentation === 'polaroid' && (
        <div className="flex flex-col items-center gap-7">
          {media.map((item, i) => (
            <figure
              key={item.id}
              data-reveal
              className="m-0"
              style={{
                background: '#fffdf8',
                padding: '0.75rem 0.75rem 0',
                borderRadius: '0.4rem',
                boxShadow: '0 20px 46px -22px rgba(0,0,0,0.55)',
                transform: `rotate(${i % 2 === 0 ? -2.4 : 2.1}deg)`,
                maxWidth: '22rem',
                width: '100%',
              }}
            >
              <MediaFrame item={item} style={{ maxHeight: '62vh', objectFit: 'cover' }} />
              <figcaption
                className="text-center py-3 text-sm"
                style={{ color: '#4a4038', minHeight: '2.6rem' }}
              >
                {item.caption || ''}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* ---- Cinematic: full-bleed with a slow Ken Burns push ---- */}
      {presentation === 'cinematic' && (
        <div className="flex flex-col gap-8">
          {media.map((item) => (
            <figure key={item.id} data-reveal className="m-0">
              <div
                className="overflow-hidden"
                style={{ boxShadow: '0 22px 56px -26px var(--v2-glow)' }}
              >
                <MediaFrame
                  item={item}
                  dataAttr="data-kenburns"
                  className="will-change-transform"
                  style={{ maxHeight: '72vh', objectFit: 'cover' }}
                />
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
      )}

      {/* ---- 3D cards: perspective tilt on hover/scroll ---- */}
      {presentation === 'cards3d' && (
        <div className="flex flex-col gap-8" style={{ perspective: '1100px' }}>
          {media.map((item, i) => (
            <figure
              key={item.id}
              data-reveal
              className="m-0 transition-transform duration-500 hover:!rotate-0"
              style={{
                transform: `rotateY(${i % 2 === 0 ? 7 : -7}deg) rotateX(3deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="overflow-hidden"
                style={{ boxShadow: '0 30px 70px -30px var(--v2-glow)' }}
              >
                <MediaFrame item={item} style={{ maxHeight: '68vh', objectFit: 'cover' }} />
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
      )}

      {/* ---- Parallax: images drift against the scroll ---- */}
      {presentation === 'parallax' && (
        <div className="flex flex-col gap-10">
          {media.map((item) => (
            <figure key={item.id} data-reveal className="m-0">
              <div
                className="overflow-hidden rounded-none"
                style={{ height: '58vh', border: '1px solid var(--v2-surface-border)' }}
              >
                <MediaFrame
                  item={item}
                  dataAttr="data-parallax"
                  className="will-change-transform"
                  style={{ height: '116%', objectFit: 'cover' }}
                />
              </div>
              {item.caption ? (
                <figcaption
                  className="mt-3 text-center text-sm tracking-widest uppercase"
                  style={{ color: 'var(--v2-ink-soft)' }}
                >
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )}

      {/* ---- Wall: dense scrapbook collage ---- */}
      {presentation === 'wall' && (
        <div className="grid grid-cols-2 gap-3">
          {media.map((item, i) => (
            <figure
              key={item.id}
              data-reveal
              className="m-0"
              style={{
                gridColumn: i % 5 === 0 ? 'span 2' : 'span 1',
                transform: `rotate(${(i % 3) - 1}deg)`,
              }}
            >
              <div
                className="overflow-hidden rounded-xl"
                style={{ border: '3px solid var(--v2-ink)' }}
              >
                <MediaFrame
                  item={item}
                  style={{ aspectRatio: i % 5 === 0 ? '16/9' : '1/1', objectFit: 'cover' }}
                />
              </div>
              {item.caption ? (
                <figcaption
                  className="mt-1.5 text-center text-xs font-bold"
                  style={{ color: 'var(--v2-ink)' }}
                >
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )}
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
