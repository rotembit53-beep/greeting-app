'use client';

import { CSSProperties } from 'react';
import { TemplateDef } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import StyleArt from './StyleArt';

/**
 * The greeting as it will actually look, composed for the screen.
 *
 * The layout itself changes per style — a cinematic style leads with the
 * image and lets the type sit quietly under it, a punch style lets the type
 * take the whole frame. Rendering every style through one layout is what
 * made the old preview feel like a static mockup.
 */

interface Props {
  template: TemplateDef;
  /** Retriggers the entrance animation when the style changes. */
  animationKey: string | number;
}

export default function GreetingPreview({ template, animationKey }: Props) {
  const spec = styleArt(template.id);
  const t = template.type;
  const p = template.palette;
  const serif = t.display === 'serif';

  const titleStyle: CSSProperties = {
    fontSize: 'clamp(1.15rem, 5.6vw, 1.6rem)',
    fontWeight: t.titleWeight,
    letterSpacing: t.titleTracking,
    textTransform: t.titleTransform,
    lineHeight: 1.16,
    color: p.ink,
    margin: 0,
  };

  const kicker = (
    <span
      className="gp-in"
      style={{
        display: 'inline-block',
        fontSize: '.58rem',
        fontWeight: 700,
        letterSpacing: '.24em',
        color: p.accent,
        animationDelay: '.05s',
      }}
    >
      {spec.sample.kicker}
    </span>
  );

  const body = (
    <p
      className="gp-in"
      style={{
        fontSize: '.72rem',
        lineHeight: 1.75,
        color: p.ink,
        opacity: 0.82,
        margin: 0,
        animationDelay: '.3s',
      }}
    >
      {spec.sample.body}
    </p>
  );

  const cta = (
    <span
      className="gp-in"
      style={{
        alignSelf: 'center',
        marginTop: 'auto',
        fontSize: '.68rem',
        fontWeight: 700,
        padding: '.5rem 1.05rem',
        borderRadius: 999,
        background: p.accent,
        color: template.id === 'funny' ? '#ffe75e' : '#fff',
        boxShadow: `0 8px 22px -10px ${p.glow}`,
        animationDelay: '.45s',
      }}
    >
      {spec.sample.cta}
    </span>
  );

  /* ---- an "image" stand-in built from the style's own art ---- */
  const imagePlate = (
    <div
      className="gp-in"
      style={{
        position: 'relative',
        borderRadius: '.85rem',
        overflow: 'hidden',
        aspectRatio: '4 / 3',
        border: `1px solid ${p.surfaceBorder}`,
        boxShadow: `0 16px 34px -20px ${p.glow}`,
        animationDelay: '.18s',
      }}
    >
      <StyleArt template={template} active />
    </div>
  );

  let inner: React.ReactNode;

  switch (spec.layout) {
    /* Image leads, type sits quietly beneath it. */
    case 'cinematic':
      inner = (
        <>
          {imagePlate}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '.9rem' }}>
            {kicker}
            <h3 className={`gp-in ${serif ? 'v2-serif' : ''}`} style={{ ...titleStyle, animationDelay: '.24s' }}>
              {spec.sample.title}
            </h3>
            {body}
          </div>
          {cta}
        </>
      );
      break;

    /* Type is the whole event. */
    case 'punch':
      inner = (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', margin: 'auto 0' }}>
            {kicker}
            <h3
              className={`gp-in ${serif ? 'v2-serif' : ''}`}
              style={{
                ...titleStyle,
                fontSize: 'clamp(1.5rem, 8vw, 2.15rem)',
                animationDelay: '.18s',
              }}
            >
              {spec.sample.title}
            </h3>
            {body}
          </div>
          {cta}
        </>
      );
      break;

    /* Refined, rule-led, lots of air. */
    case 'editorial':
      inner = (
        <>
          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {kicker}
            <div
              className="gp-in"
              style={{ width: 34, height: 1, background: p.accent, opacity: 0.7, animationDelay: '.15s' }}
            />
            <h3 className={`gp-in ${serif ? 'v2-serif' : ''}`} style={{ ...titleStyle, animationDelay: '.24s' }}>
              {spec.sample.title}
            </h3>
            {body}
          </div>
          {cta}
        </>
      );
      break;

    /* Warm ground, textured, handmade. */
    case 'organic':
      inner = (
        <>
          <div style={{ marginBottom: '.85rem' }}>{imagePlate}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {kicker}
            <h3 className={`gp-in ${serif ? 'v2-serif' : ''}`} style={{ ...titleStyle, animationDelay: '.24s' }}>
              {spec.sample.title}
            </h3>
            {body}
          </div>
          {cta}
        </>
      );
      break;

    /* Celebration: art fills the frame, type sits on top of it. */
    case 'celebration':
    default:
      inner = (
        <>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <StyleArt template={template} active />
          </div>
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              margin: 'auto 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '.55rem',
              textShadow: template.dark ? '0 2px 18px rgba(0,0,0,.55)' : '0 1px 12px rgba(255,255,255,.45)',
            }}
          >
            {kicker}
            <h3
              className={`gp-in ${serif ? 'v2-serif' : ''}`}
              style={{ ...titleStyle, fontSize: 'clamp(1.3rem, 6.4vw, 1.8rem)', animationDelay: '.2s' }}
            >
              {spec.sample.title}
            </h3>
            {body}
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'contents' }}>{cta}</div>
        </>
      );
  }

  return (
    <div
      key={animationKey}
      className="gp-root"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: p.pageBg,
        color: p.ink,
        padding: '1.6rem 1.15rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {inner}
    </div>
  );
}
