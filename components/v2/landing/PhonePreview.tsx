'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TemplateDef } from '@/lib/v2/templates';
import { templateVars } from '@/components/v2/TemplateSurface';

gsap.registerPlugin(useGSAP);

/**
 * The hero's live preview: a phone frame showing a real greeting rendered
 * with real template tokens, cycling through the templates so a visitor sees
 * within seconds that this is an experience, not a text generator.
 */

const SAMPLE = {
  title: 'יום הולדת שמח נועה',
  intro: 'שלוש שנים אני מכיר אותך ועדיין לא הבנתי איך את מצליחה להיות הכי רגועה בחדר.',
  message: 'את עדיין לא יודעת לקרוא מפה',
};

export default function PhonePreview({ template }: { template: TemplateDef }) {
  const screenRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.fromTo(
        '[data-preview-item]',
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.09, ease: 'power2.out' }
      );
    },
    { scope: screenRef, dependencies: [template.id] }
  );

  const t = template.type;

  return (
    <div
      className="relative"
      style={{
        width: 'min(19rem, 82vw)',
        aspectRatio: '9 / 18',
        borderRadius: '2.5rem',
        padding: '0.7rem',
        background: '#15121a',
        boxShadow:
          '0 40px 80px -30px rgba(36,16,25,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset',
      }}
    >
      {/* Notch */}
      <div
        className="absolute z-10 rounded-full"
        style={{
          top: '1.15rem',
          insetInlineStart: '50%',
          transform: 'translateX(-50%)',
          width: '4.5rem',
          height: '1.1rem',
          background: '#15121a',
        }}
        aria-hidden="true"
      />

      <div
        ref={screenRef}
        className="v2-scope w-full h-full overflow-hidden flex flex-col justify-center gap-4 px-5"
        style={{
          ...templateVars(template),
          background: template.palette.pageBg,
          borderRadius: '1.9rem',
        }}
      >
        <span
          data-preview-item
          className="self-start text-[10px] font-bold px-3 py-1.5 rounded-full"
          style={{
            background: template.palette.accentSoft,
            color: template.palette.accent,
          }}
        >
          {template.label}
        </span>

        <h3
          data-preview-item
          className={t.display === 'serif' ? 'v2-serif' : ''}
          style={{
            fontSize: 'clamp(1.4rem, 6.5vw, 1.85rem)',
            fontWeight: t.titleWeight,
            letterSpacing: t.titleTracking,
            textTransform: t.titleTransform,
            lineHeight: 1.12,
            color: template.palette.ink,
          }}
        >
          {SAMPLE.title}
        </h3>

        <p
          data-preview-item
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.75,
            color: template.palette.ink,
            opacity: 0.85,
          }}
        >
          {SAMPLE.intro}
        </p>

        <div
          data-preview-item
          className="rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{
            background: template.palette.surface,
            border: `1.5px solid ${template.palette.surfaceBorder}`,
            color: template.palette.ink,
          }}
        >
          <span style={{ color: template.palette.accent }}>✦ </span>
          {SAMPLE.message}
        </div>

        <div
          data-preview-item
          className="self-center mt-1 px-5 py-2.5 rounded-full text-sm font-bold"
          style={{
            background: template.palette.accent,
            color: template.id === 'funny' ? '#ffe75e' : '#fff',
          }}
        >
          ✨ יש עוד משהו…
        </div>
      </div>
    </div>
  );
}
