'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { getTemplate } from '@/lib/v2/templates';
import { PublicGreetingV2 } from '@/lib/v2/types';
import { track } from '@/lib/v2/analytics';
import { hasGift } from '@/lib/v2/gifts';
import TemplateSurface from '@/components/v2/TemplateSurface';
import Decor from '@/components/v2/Decor';
import StyleArt from '@/components/v2/style/StyleArt';
import Gate from './Gate';
import MusicPlayer from './MusicPlayer';
import GiftScene from './GiftScene';
import {
  ClosingScene,
  MemoriesScene,
  MessagesScene,
  RevealScene,
  SurpriseScene,
} from './scenes';

/**
 * The recipient's whole experience.
 *
 * Order of beats comes from the template's `scenes` list, so a template can
 * restructure the experience (not just recolour it) without any change here.
 */

interface Props {
  greeting: PublicGreetingV2;
  /** Preview mode: skips analytics and never counts as a real open. */
  preview?: boolean;
}

export default function GreetingExperience({ greeting, preview = false }: Props) {
  const template = getTemplate(greeting.templateId);
  const [opened, setOpened] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const musicSrc = greeting.musicEnabled ? greeting.musicTrack : '';
  const giftAttached = hasGift(greeting.gift);

  // Photos assigned to a scene are shown there; everything else stays in the
  // library and never renders. Legacy items (no role) default to memories.
  const memoryMedia = greeting.media.filter(
    (m) => m.role === 'memory' || m.role === undefined || m.role === 'library'
  );
  const cover = greeting.media.find((m) => m.id === greeting.coverMediaId);

  // Lock scrolling behind the gate so the content can't be peeked at.
  useEffect(() => {
    if (preview) return;
    document.body.classList.toggle('v2-noscroll', !opened);
    return () => document.body.classList.remove('v2-noscroll');
  }, [opened, preview]);

  const handleOpen = () => {
    setOpened(true);
    if (!preview) {
      track('greeting_opened', { greetingId: greeting.id, slug: greeting.slug });
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          gsap.fromTo(
            contentRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }
          );
        }
      });
    }
  };

  // "Reached the end" — the strongest signal that the surprise actually landed.
  useEffect(() => {
    if (!opened || preview || completedRef.current) return;

    const onScroll = () => {
      const reachedEnd =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 120;
      if (reachedEnd && !completedRef.current) {
        completedRef.current = true;
        track('greeting_completed', { greetingId: greeting.id, slug: greeting.slug });
        window.removeEventListener('scroll', onScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [opened, preview, greeting.id, greeting.slug]);

  const sceneProps = { template, content: greeting.content };

  return (
    <TemplateSurface template={template} className="v2-shell">
      {/* The template's own art direction, across the whole page rather than
       * boxed into a thumbnail. Until now StyleArt only ever rendered inside
       * gallery cards and the phone preview, so the greeting a recipient
       * actually opened was a flat gradient plus falling particles — none of
       * the composition that defines the style. Fixed so it stays put while
       * the scenes scroll over it, and faded via CSS so running text keeps
       * its contrast. `background: transparent` because TemplateSurface
       * already paints pageBg underneath; without it the art would repaint
       * the gradient at viewport scale and band against the page. */}
      <div className="v2-art-backdrop" aria-hidden="true">
        <StyleArt
          template={template}
          active={opened}
          style={{ background: 'transparent' }}
        />
      </div>

      <Decor template={template} active={opened} />

      {!opened && (
        <Gate
          template={template}
          recipientName={greeting.recipientName}
          senderName={greeting.senderName}
          hasGift={giftAttached}
          onOpen={handleOpen}
        />
      )}

      {musicSrc ? (
        <MusicPlayer
          src={musicSrc}
          active={opened}
          accent={template.palette.accent}
          ink={template.palette.ink}
          surface={template.palette.surface}
          border={template.palette.surfaceBorder}
        />
      ) : null}

      <div ref={contentRef} className="relative z-10">
        {cover ? (
          <div className="v2-container pt-10">
            <div
              className="overflow-hidden rounded-3xl"
              style={{
                border: '1.5px solid var(--v2-surface-border)',
                boxShadow: '0 26px 64px -30px var(--v2-glow)',
              }}
            >
              {cover.type === 'video' ? (
                <video src={cover.url} controls playsInline className="w-full block" />
              ) : (
                <img
                  src={cover.url}
                  alt={greeting.recipientName}
                  className="w-full block"
                  style={{ maxHeight: '62vh', objectFit: 'cover' }}
                />
              )}
            </div>
          </div>
        ) : null}
        {template.scenes.map((scene) => {
          switch (scene) {
            case 'reveal':
              return <RevealScene key={scene} {...sceneProps} />;
            case 'messages':
              return <MessagesScene key={scene} {...sceneProps} />;
            case 'memories':
              return (
                <MemoriesScene key={scene} template={template} media={memoryMedia} />
              );
            case 'surprise':
              return <SurpriseScene key={scene} {...sceneProps} />;
            case 'gift':
              // Only rendered when a real gift is attached, so the scene list
              // can carry it unconditionally.
              return giftAttached && greeting.gift ? (
                <GiftScene
                  key={scene}
                  template={template}
                  gift={greeting.gift}
                  recipientName={greeting.recipientName}
                />
              ) : null;
            case 'closing':
              return (
                <ClosingScene
                  key={scene}
                  {...sceneProps}
                  senderName={greeting.senderName}
                />
              );
            default:
              // Gate scenes are rendered above, not in the scroll flow.
              return null;
          }
        })}

        {/* Free-plan branding — the viral loop back to the product. */}
        {greeting.plan === 'free' && (
          <div className="v2-container pb-16 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-transform hover:scale-105"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
                color: 'var(--v2-ink)',
              }}
              onClick={() => track('premium_click', { greetingId: greeting.id, props: { from: 'recipient_footer' } })}
            >
              ✨ רוצים להכין הפתעה כזאת? צרו אחת בחינם
            </Link>
          </div>
        )}
      </div>
    </TemplateSurface>
  );
}
