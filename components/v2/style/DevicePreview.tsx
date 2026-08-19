'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';
import GreetingPreview from './GreetingPreview';

gsap.registerPlugin(useGSAP);

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

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const device = deviceRef.current;
      if (!device || reduce) return;

      gsap.to(device, {
        y: -12,
        duration: 4.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // Tilt only where there's a real pointer — touch would fight scrolling.
      const fine = window.matchMedia('(pointer: fine)');
      if (!fine.matches) return;

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

  // Cross-fade the screen whenever the style changes.
  useGSAP(
    () => {
      const el = screenRef.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 1.04 },
        { autoAlpha: 1, scale: 1, duration: 0.65, ease: 'power2.out' }
      );
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
            <GreetingPreview template={template} animationKey={previewKey} />
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
