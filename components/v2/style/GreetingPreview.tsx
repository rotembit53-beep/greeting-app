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
        // Fixed, not `auto` — an auto top-margin here fights the flex
        // container's min-height floor and pins the whole box at exactly
        // the screen height, clipping `extra` (the messages/signoff below)
        // instead of letting the card grow tall enough to scroll to it.
        marginTop: '1.4rem',
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

  /* ---- extra beats below the hero, so there's a real "rest of the card"
   * to scroll to — matches the real product's Reveal -> Memories -> Messages
   * -> Closing beats, and gives every layout (even the short editorial
   * ones) enough height to actually need the scroll. */
  const extra = (
    <div
      className="gp-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '1.6rem', animationDelay: '.6s' }}
    >
      <figure
        className="m-0"
        style={{
          position: 'relative',
          borderRadius: '.85rem',
          overflow: 'hidden',
          aspectRatio: '4 / 3',
          border: `1px solid ${p.surfaceBorder}`,
          boxShadow: `0 16px 34px -20px ${p.glow}`,
          marginBottom: '.3rem',
        }}
      >
        <StyleArt template={template} />
        <figcaption
          style={{
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            padding: '.4rem .6rem',
            fontSize: '.62rem',
            fontWeight: 600,
            color: '#fff',
            textShadow: '0 1px 6px rgba(0,0,0,.6)',
            background: 'linear-gradient(0deg, rgba(0,0,0,.4) 0%, transparent 100%)',
          }}
        >
          רגע שנשמר
        </figcaption>
      </figure>

      {spec.sample.messages.map((m, i) => (
        <div
          key={i}
          style={{
            fontSize: '.72rem',
            fontWeight: 600,
            lineHeight: 1.5,
            padding: '.65rem .85rem',
            borderRadius: '.9rem',
            background: p.surface,
            border: `1px solid ${p.surfaceBorder}`,
            color: p.ink,
            marginInlineStart: i % 2 === 0 ? 0 : 'clamp(0px, 8vw, 1.6rem)',
            marginInlineEnd: i % 2 === 0 ? 'clamp(0px, 8vw, 1.6rem)' : 0,
          }}
        >
          <span style={{ color: p.accent, marginInlineEnd: '.4rem' }}>✦</span>
          {m}
        </div>
      ))}

      <div
        style={{
          textAlign: 'center',
          marginTop: '1rem',
          paddingTop: '1.1rem',
          borderTop: `1px solid ${p.surfaceBorder}`,
        }}
      >
        <p
          className={serif ? 'v2-serif' : ''}
          style={{
            fontSize: '.78rem',
            lineHeight: 1.6,
            color: p.ink,
            opacity: 0.85,
            fontWeight: serif ? 500 : 600,
            margin: 0,
          }}
        >
          {spec.sample.signoff}
        </p>
      </div>
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

    /* Type is the whole event.
     * A bounded, self-centering box rather than `margin: auto 0` on a flex
     * item — that trick pins the whole gp-root to exactly its min-height
     * floor and swallows any content that should extend it (see the
     * celebration case below for the same fix). */
    case 'punch':
      inner = (
        <div style={{ minHeight: '18rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
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
        </div>
      );
      break;

    /* Refined, rule-led, lots of air. Same bounded-box fix as punch. */
    case 'editorial':
      inner = (
        <div style={{ minHeight: '18rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
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
        </div>
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

    /* Celebration: art fills the frame, type sits on top of it.
     * Bounded to its own height (not gp-root's, which grows with `extra`
     * below) — otherwise the confetti/balloons would stretch to cover the
     * whole scrollable card instead of just the hero. */
    case 'celebration':
    default:
      inner = (
        <div style={{ position: 'relative', minHeight: '19rem', display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ position: 'relative', zIndex: 1 }}>{cta}</div>
        </div>
      );
  }

  return (
    <div
      key={animationKey}
      className="gp-root"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        background: p.pageBg,
        color: p.ink,
        padding: '1.6rem 1.15rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {inner}
      {extra}
    </div>
  );
}
