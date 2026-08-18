'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getTemplate } from '@/lib/v2/templates';
import { PublicGreetingV2 } from '@/lib/v2/types';
import { track } from '@/lib/v2/analytics';
import TemplateSurface from '@/components/v2/TemplateSurface';
import Decor from '@/components/v2/Decor';
import Gate from './Gate';
import MusicPlayer from './MusicPlayer';
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
  const hasGift = greeting.media.length > 0 || Boolean(greeting.content.surprise);

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
      <Decor template={template} active={opened} />

      {!opened && (
        <Gate
          template={template}
          recipientName={greeting.recipientName}
          senderName={greeting.senderName}
          hasGift={hasGift}
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
        {template.scenes.map((scene) => {
          switch (scene) {
            case 'reveal':
              return <RevealScene key={scene} {...sceneProps} />;
            case 'messages':
              return <MessagesScene key={scene} {...sceneProps} />;
            case 'memories':
              return (
                <MemoriesScene key={scene} template={template} media={greeting.media} />
              );
            case 'surprise':
              return <SurpriseScene key={scene} {...sceneProps} />;
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
            <a
              href="/v2"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-transform hover:scale-105"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
                color: 'var(--v2-ink)',
              }}
              onClick={() => track('premium_click', { greetingId: greeting.id, props: { from: 'recipient_footer' } })}
            >
              ✨ רוצים להכין הפתעה כזאת? צרו אחת בחינם
            </a>
          </div>
        )}
      </div>
    </TemplateSurface>
  );
}
