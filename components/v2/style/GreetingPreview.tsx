'use client';

import { CSSProperties } from 'react';
import { TemplateDef } from '@/lib/v2/templates';
import { styleArt } from '@/lib/v2/styleArt';
import StyleArt from './StyleArt';
import { onAccentFor } from '@/components/v2/TemplateSurface';

/**
 * The greeting as it will actually look, composed for the screen.
 *
 * The layout itself changes per style — a cinematic style leads with the
 * image and lets the type sit quietly under it, a punch style lets the type
 * take the whole frame. Rendering every style through one layout is what
 * made the old preview feel like a static mockup.
 */

/* Particle budget for the phone screen.
 *
 * StyleArt's counts are tuned for a full-bleed page backdrop. This preview
 * renders it three times over (card backdrop + two photo plates) inside a
 * ~300px-wide screen, which put ~150 simultaneously animating layers — many
 * of them blurred — behind a 3D-transformed, rounded-clipped subtree, and
 * every style switch tore all of them down and built them again. That is
 * where the stutter on selecting a style came from; at this scale the extra
 * particles were never resolvable anyway. */
const BACKDROP_DENSITY = 0.5;
const PLATE_DENSITY = 0.3;

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

  /**
   * The "open" control.
   *
   * Deliberately NOT a fully-rounded pill sitting on a coloured glow —
   * `border-radius: 999px` + an accent-tinted drop shadow is the single most
   * generic button on the web right now, and next to hand-built art like the
   * enso or the dune stack it was the one element that gave the whole card
   * away as generated. This is a printed button instead: a 3px corner, flat
   * accent fill, letterspaced label, and a hairline highlight inside the top
   * edge doing the job the glow was faking.
   */
  const ctaFor = (align: CSSProperties['alignSelf'], marginTop: string) => (
    <span
      className="gp-in"
      style={{
        alignSelf: align,
        // Fixed, not `auto` — an auto top-margin here fights the flex
        // container's min-height floor and pins the whole box at exactly
        // the screen height, clipping `extra` (the messages/signoff below)
        // instead of letting the card grow tall enough to scroll to it.
        marginTop,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.42rem',
        fontSize: '.63rem',
        fontWeight: 700,
        letterSpacing: '.07em',
        padding: '.54rem 1rem',
        borderRadius: 3,
        background: p.accent,
        color: onAccentFor(template),
        boxShadow: `inset 0 1px 0 ${
          template.dark ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.32)'
        }`,
        textShadow: 'none',
        animationDelay: '.45s',
      }}
    >
      {spec.sample.cta}
    </span>
  );

  const cta = ctaFor('center', '1.4rem');

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
      <StyleArt template={template} active density={PLATE_DENSITY} />
    </div>
  );

  /* ---- extra beats below the hero, so there's a real "rest of the card"
   * to scroll to — matches the real product's Reveal -> Memories -> Messages
   * -> Closing beats, and gives every layout (even the short editorial
   * ones) enough height to actually need the scroll.
   *
   * Every block below shares one right-anchored rhythm (kicker style,
   * gap, and a consistent side-inset) so the section reads as a single
   * composed unit instead of a pile of unrelated pieces — the messages in
   * particular used to sit at nearly full width with only a token margin,
   * which read as a mistake rather than an alternating "notes" layout. */
  const extraKicker = (label: string, delay: string) => (
    <span
      className="gp-in"
      style={{
        display: 'inline-block',
        fontSize: '.54rem',
        fontWeight: 700,
        letterSpacing: '.22em',
        color: p.accent,
        opacity: 0.85,
        animationDelay: delay,
      }}
    >
      {label}
    </span>
  );

  const extra = (
    <div
      className="gp-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginTop: '1.85rem', animationDelay: '.6s' }}
    >
      <figure
        className="m-0"
        data-gp-reveal
        data-gp-reveal-dir="up"
        style={{
          position: 'relative',
          borderRadius: '.85rem',
          overflow: 'hidden',
          aspectRatio: '4 / 3',
          border: `1px solid ${p.surfaceBorder}`,
          boxShadow: `0 16px 34px -20px ${p.glow}`,
        }}
      >
        <StyleArt template={template} density={PLATE_DENSITY} />
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {extraKicker('מה שכתבתם', '.68s')}
        {spec.sample.messages.map((m, i) => (
          <div
            key={i}
            data-gp-reveal
            data-gp-reveal-dir="up"
            style={{
              textAlign: 'start',
              fontSize: '.72rem',
              fontWeight: 600,
              lineHeight: 1.55,
              padding: '.65rem .9rem',
              borderRadius: '.85rem',
              background: p.surface,
              color: p.ink,
              // Same accent stripe on the same (start/right) side for
              // every line — one consistent, orderly stack, not a
              // zig-zag; the previous alternating-side layout read as
              // disorganized rather than deliberate.
              borderInlineStart: `2.5px solid ${p.accent}`,
              borderInlineEnd: `1px solid ${p.surfaceBorder}`,
              borderBlock: `1px solid ${p.surfaceBorder}`,
              boxShadow: `0 10px 22px -16px ${p.glow}`,
            }}
          >
            {m}
          </div>
        ))}
      </div>

      <div
        data-gp-reveal
        data-gp-reveal-dir="up"
        style={{
          textAlign: 'center',
          marginTop: '.35rem',
          paddingTop: '1.15rem',
          borderTop: `1px solid ${p.surfaceBorder}`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            fontSize: '1.1rem',
            lineHeight: 1,
            color: p.accent,
            opacity: 0.6,
            marginBottom: '.4rem',
          }}
        >
          ✦
        </span>
        <p
          className={serif ? 'v2-serif' : ''}
          style={{
            fontSize: '.86rem',
            lineHeight: 1.6,
            color: p.ink,
            opacity: 0.9,
            fontWeight: serif ? 500 : 700,
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

    /* Celebration: type sits directly on the art.
     * The art itself is no longer rendered here — it's the page-wide
     * backdrop below, same as every other layout now — so this case is
     * just the type treatment that leans on it.
     *
     * The CTA lives inside the same centered flex column as the text
     * (not as a trailing sibling after it) — `alignSelf` only means
     * anything on a flex item, and the shared `cta` was previously
     * dropped into a plain (non-flex) wrapper here, so its intended
     * `alignSelf: center` silently did nothing and left it sitting wherever
     * inline RTL flow put it, with a large accidental gap above it from
     * the text block's own vertical centering. Grouping it in means it
     * centers as ONE unit with the text, and its own `alignSelf` here
     * lines it up on the same right edge as everything else. */
    case 'celebration':
    default:
      inner = (
        <div style={{ position: 'relative', minHeight: '19rem', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              margin: 'auto 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '.6rem',
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
            {ctaFor('flex-start', '.15rem')}
          </div>
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
        /* Top padding clears the device's dynamic island (which ends at
         * ~1.85rem) — at 1.6rem the greeting's first line ran under it. */
        padding: '2.5rem 1.15rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* The style's art across the whole card, mirroring what the real
       * greeting page now does — previously only the 'celebration' layout
       * showed any art behind its type and every other layout was a plain
       * gradient. Absolute (not fixed) so it spans this scrollable card
       * rather than the browser viewport. */}
      <div className="gp-art" aria-hidden="true">
        <StyleArt
          template={template}
          active
          density={BACKDROP_DENSITY}
          style={{ background: 'transparent' }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>{inner}</div>
      <div style={{ position: 'relative', zIndex: 1 }}>{extra}</div>
    </div>
  );
}
