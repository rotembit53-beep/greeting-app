'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { TemplateDef } from '@/lib/v2/templates';
import GreetingPreview from './GreetingPreview';

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

// One ease vocabulary for this preview, defined once. `caseOut` is a soft,
// slightly overshoot-free deceleration used for every 3D settle below.
if (!CustomEase.get('caseOut')) CustomEase.create('caseOut', '0.25, 1, 0.5, 1');

/**
 * The device. Treated as a real object on the page: machined frame, glass
 * reflection, a glow tinted by whatever style is loaded, a slow float, and a
 * pointer-driven tilt on devices that actually have a pointer.
 */

interface Props {
  template: TemplateDef;
  /** Bumped on every style change so the screen re-animates. */
  previewKey: string | number;
}

export default function DevicePreview({ template, previewKey }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // The greeting is usually taller than the screen — this hints that the
  // rest is one scroll away, then gets out of the way once it's obvious.
  const [showScrollHint, setShowScrollHint] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const device = deviceRef.current;
      if (!device || reduce) return;

      // Both the float and the pointer-tilt are desktop flourishes — a real
      // phone has no pointer to tilt with, and keeping an infinite
      // compositor animation running on the device while the page itself is
      // being scrolled is exactly the kind of thing that reads as "laggy"
      // on weaker hardware for no visible benefit (nobody's watching it
      // bob while they're mid-scroll).
      const fine = window.matchMedia('(pointer: fine)');
      if (!fine.matches) return;

      gsap.to(device, {
        y: -12,
        duration: 4.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      const wrap = wrapRef.current;
      if (!wrap) return;

      const rx = gsap.quickTo(device, 'rotationX', { duration: 0.6, ease: 'power2.out' });
      const ry = gsap.quickTo(device, 'rotationY', { duration: 0.6, ease: 'power2.out' });

      const onMove = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 16);
        rx(py * -12);
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
    },
    { scope: wrapRef }
  );

  // Swap the screen in with a real 3D turn (perspective + rotateY), not just
  // a cross-fade — the phone reads as a physical object showing a new card,
  // not a <div> changing its background.
  useGSAP(
    () => {
      const el = screenRef.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, rotateY: -13, rotateX: 5, scale: 1.05, transformPerspective: 900 },
        { autoAlpha: 1, rotateY: 0, rotateX: 0, scale: 1, duration: 0.85, ease: 'caseOut' }
      );
    },
    { dependencies: [previewKey], scope: wrapRef }
  );

  // A new style may render taller or shorter than the last one — jump the
  // scroll position back to the top, re-check whether there's now anything
  // to scroll to, reveal the "rest of the card" (memory photo, message
  // bubbles, sign-off) with a 3D card-in as it scrolls into view, and — the
  // showcase piece — automatically scroll through the whole design once so
  // a visitor who never touches the phone still sees the full template. The
  // instant a real person scrolls or touches it, autoplay steps aside for
  // good until the style changes again.
  useGSAP(
    () => {
      const scroller = scrollRef.current;
      if (!scroller) return;

      scroller.scrollTop = 0;
      setShowScrollHint(scroller.scrollHeight > scroller.clientHeight + 4);

      const onScroll = () => {
        setShowScrollHint(
          scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 12
        );
      };
      scroller.addEventListener('scroll', onScroll, { passive: true });

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        gsap.set('[data-gp-reveal]', { autoAlpha: 1, x: 0, y: 0, rotateX: 0, rotateY: 0 });
        return () => scroller.removeEventListener('scroll', onScroll);
      }

      // Scroll-triggered 3D reveal for everything below the hero.
      scroller.querySelectorAll<HTMLElement>('[data-gp-reveal]').forEach((el) => {
        const dir = el.dataset.gpRevealDir;
        const from =
          dir === 'left'
            ? { x: -30, rotateY: -20 }
            : dir === 'right'
              ? { x: 30, rotateY: 20 }
              : { y: 30, rotateX: 12 };
        gsap.fromTo(
          el,
          { autoAlpha: 0, transformPerspective: 700, ...from },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            duration: 0.75,
            ease: 'caseOut',
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top 92%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Autoplay: down through the whole card, hold, back up, hold, repeat —
      // a slow, deliberate demo pace, never a scrub.
      const max = scroller.scrollHeight - scroller.clientHeight;
      const autoplay = gsap.timeline({ repeat: -1, paused: true });
      if (max > 24) {
        const downDuration = gsap.utils.clamp(2.4, 6, max / 90);
        autoplay
          .to(scroller, { scrollTop: max, duration: downDuration, ease: 'sine.inOut' }, 1.1)
          .to(scroller, { scrollTop: 0, duration: downDuration, ease: 'sine.inOut' }, '+=1.3');
        autoplay.play();
      }

      // kill() is idempotent — safe to call again from cleanup even after a
      // real scroll/touch already stopped it.
      const stopAutoplay = () => autoplay.kill();
      scroller.addEventListener('pointerdown', stopAutoplay, { passive: true });
      scroller.addEventListener('wheel', stopAutoplay, { passive: true });
      scroller.addEventListener('touchstart', stopAutoplay, { passive: true });

      return () => {
        scroller.removeEventListener('scroll', onScroll);
        scroller.removeEventListener('pointerdown', stopAutoplay);
        scroller.removeEventListener('wheel', stopAutoplay);
        scroller.removeEventListener('touchstart', stopAutoplay);
        autoplay.kill();
      };
    },
    { dependencies: [previewKey], scope: wrapRef }
  );

  return (
    <div ref={wrapRef} style={{ perspective: '1400px', padding: '1.5rem 0' }}>
      {/* Glow pool on the surface, tinted by the current style. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetInlineStart: '50%',
          top: '52%',
          width: 'min(30rem, 90vw)',
          height: 'min(30rem, 90vw)',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${template.palette.glow} 0%, transparent 68%)`,
          filter: 'blur(52px)',
          opacity: 0.85,
          pointerEvents: 'none',
          transition: 'background .7s ease',
        }}
      />

      <div
        ref={deviceRef}
        style={{
          position: 'relative',
          width: 'min(19rem, 78vw)',
          aspectRatio: '9 / 19',
          marginInline: 'auto',
          borderRadius: '2.7rem',
          padding: '.62rem',
          transformStyle: 'preserve-3d',
          background:
            'linear-gradient(158deg, #3a3238 0%, #14100f 26%, #241d21 55%, #0d0a0b 78%, #2c2429 100%)',
          boxShadow:
            '0 52px 96px -44px rgba(30,18,14,.72), 0 12px 30px -14px rgba(30,18,14,.4), inset 0 0 0 1px rgba(255,255,255,.13)',
        }}
      >
        {/* side buttons */}
        <span aria-hidden="true" style={{ position: 'absolute', insetInlineEnd: -2, top: '22%', width: 2.5, height: '7%', borderRadius: 2, background: 'linear-gradient(180deg,#4a4046,#241d21)' }} />
        <span aria-hidden="true" style={{ position: 'absolute', insetInlineStart: -2, top: '17%', width: 2.5, height: '4.5%', borderRadius: 2, background: 'linear-gradient(180deg,#4a4046,#241d21)' }} />
        <span aria-hidden="true" style={{ position: 'absolute', insetInlineStart: -2, top: '24%', width: 2.5, height: '8%', borderRadius: 2, background: 'linear-gradient(180deg,#4a4046,#241d21)' }} />

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '2.15rem',
            overflow: 'hidden',
            background: '#0b0809',
          }}
        >
          <div ref={screenRef} style={{ width: '100%', height: '100%' }}>
            <div
              ref={scrollRef}
              className="dp-scroll"
              style={{ width: '100%', height: '100%', overflowY: 'auto' }}
            >
              <GreetingPreview template={template} animationKey={previewKey} />
            </div>
          </div>

          {/* "there's more below" hint — fades away once it's obvious */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              insetInline: 0,
              bottom: 0,
              height: '3.4rem',
              zIndex: 4,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '.5rem',
              background: 'linear-gradient(0deg, rgba(0,0,0,.32) 0%, transparent 100%)',
              opacity: showScrollHint ? 1 : 0,
              transition: 'opacity .4s ease',
            }}
          >
            <span
              className="sa-float"
              style={{
                width: '1.7rem',
                height: '1.7rem',
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,255,255,.22)',
                backdropFilter: 'blur(3px)',
                color: '#fff',
                fontSize: '.8rem',
              }}
            >
              ⌄
            </span>
          </div>

          {/* dynamic island */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '.7rem',
              insetInlineStart: '50%',
              transform: 'translateX(-50%)',
              width: '4.6rem',
              height: '1.15rem',
              borderRadius: 999,
              background: '#0b0809',
              zIndex: 5,
            }}
          />

          {/* glass reflection, sits above content but never blocks it */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 6,
              background:
                'linear-gradient(122deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,.05) 22%, transparent 44%, transparent 72%, rgba(255,255,255,.09) 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
