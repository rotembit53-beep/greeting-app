'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';

gsap.registerPlugin(useGSAP);

/**
 * The ambient particle layer behind a greeting. Each template picks a `kind`
 * and a palette, which is what makes two templates feel structurally
 * different rather than merely recoloured.
 *
 * Everything is `position: fixed` + transform-only animation so it stays on
 * the compositor and never triggers layout while the page scrolls.
 */

function shapeHtml(kind: TemplateDef['decor']['kind'], color: string): string {
  switch (kind) {
    case 'petals':
      return `<svg width="20" height="22" viewBox="0 0 22 24" fill="${color}" opacity="0.85"><path d="M11 0 C 17 5, 22 11, 18 18 C 15 23, 7 23, 4 18 C 0 11, 5 5, 11 0 Z"/></svg>`;
    case 'sparkles':
      return `<svg width="16" height="16" viewBox="0 0 20 20" fill="${color}"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"/></svg>`;
    case 'balloons':
      return `<svg width="26" height="40" viewBox="0 0 34 52" fill="none"><ellipse cx="17" cy="16" rx="13" ry="16" fill="${color}"/><ellipse cx="12" cy="10" rx="4" ry="5" fill="rgba(255,255,255,0.35)"/><path d="M17 32 L14 37 H20 Z" fill="${color}"/><path d="M17 37 C 15 44, 19 46, 17 52" stroke="${color}" stroke-width="1.5" fill="none"/></svg>`;
    case 'bubbles':
      return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="${color}" stroke-width="1.6" opacity="0.9"/><circle cx="6.5" cy="6" r="1.8" fill="${color}" opacity="0.6"/></svg>`;
    case 'orbs':
      return `<div style="width:14px;height:14px;border-radius:999px;background:${color};box-shadow:0 0 18px 4px ${color};opacity:0.85"></div>`;
    case 'confetti':
    default: {
      const w = 5 + Math.round(Math.random() * 4);
      const h = 8 + Math.round(Math.random() * 8);
      const radius = Math.random() > 0.6 ? '999px' : '2px';
      return `<div style="width:${w}px;height:${h}px;border-radius:${radius};background:${color}"></div>`;
    }
  }
}

interface DecorProps {
  template: TemplateDef;
  /** Pauses spawning until the recipient has opened the gate. */
  active?: boolean;
}

export default function Decor({ template, active = true }: DecorProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const layer = layerRef.current;
      const { kind, palette, density } = template.decor;

      if (!layer || kind === 'none' || !active || density === 0) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Fewer particles on phones — same look, far less work per frame.
      // Capped outright regardless of a template's configured density: past
      // ~55 concurrently-tweened particles the per-frame cost stopped buying
      // any visible extra "fullness" and just cost main-thread time.
      const isNarrow = window.matchMedia('(max-width: 640px)').matches;
      const count = Math.min(55, Math.round(density * (isNarrow ? 0.5 : 0.85)));

      const nodes: HTMLElement[] = [];

      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.style.cssText =
          'position:absolute;will-change:transform;top:0;left:0;opacity:0;';
        el.innerHTML = shapeHtml(kind, gsap.utils.random(palette));
        layer.appendChild(el);
        nodes.push(el);
      }

      const risesUp = kind === 'balloons' || kind === 'orbs';

      nodes.forEach((el) => {
        const startX = gsap.utils.random(0, window.innerWidth);
        const fallDistance = window.innerHeight + 160;

        gsap.set(el, {
          x: startX,
          y: risesUp ? window.innerHeight + 80 : -120,
          rotation: gsap.utils.random(-40, 40),
        });

        const duration = gsap.utils.random(
          risesUp ? 11 : 7,
          risesUp ? 22 : 15
        );

        gsap.to(el, {
          y: risesUp ? -160 : fallDistance,
          duration,
          delay: gsap.utils.random(0, duration),
          repeat: -1,
          ease: 'none',
          onRepeat: () => {
            gsap.set(el, { x: gsap.utils.random(0, window.innerWidth) });
          },
        });

        // One-shot fade-in only (no repeat) — cheap, completes once and
        // drops out of GSAP's active tween list.
        gsap.to(el, {
          opacity: gsap.utils.random(0.45, 0.95),
          duration: 1.4,
          delay: gsap.utils.random(0, 3),
        });

        // Lateral drift + tumble, decoupled from the fall so the motion
        // never looks like a single repeating loop.
        gsap.to(el, {
          x: `+=${gsap.utils.random(-90, 90)}`,
          rotation: kind === 'petals' ? `+=${gsap.utils.random(-200, 200)}` : `+=${gsap.utils.random(-40, 40)}`,
          duration: gsap.utils.random(3, 7),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    },
    { dependencies: [template.id, active], revertOnUpdate: true }
  );

  if (template.decor.kind === 'none') return null;

  return <div ref={layerRef} className="v2-decor-layer" aria-hidden="true" />;
}
