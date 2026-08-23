'use client';

import { CSSProperties, useMemo } from 'react';
import { TemplateDef } from '@/lib/v2/templates';

/**
 * Per-style art direction.
 *
 * Deliberately a switch rather than a generic "layer engine": abstracting
 * these into one parameterised renderer is exactly what flattened every
 * style into gradient-plus-emoji in the first place. Each case below is its
 * own composition, and they are allowed to differ structurally.
 *
 * All randomness is seeded from the template id so the server and client
 * produce identical markup — Math.random() here would desync hydration.
 */

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Props {
  template: TemplateDef;
  /** Hover / selected state — drives the parallax lift on inner layers. */
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  /**
   * Multiplier on every particle count. Full density is tuned for the
   * full-bleed page backdrop; inside the phone preview the same counts are
   * detail nobody can resolve, bought at the cost of ~150 simultaneously
   * animating (and in the bokeh's case, blurred) layers per style switch.
   */
  density?: number;
}

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

/** A CSS-only balloon with a real highlight, not a flat circle. */
function Balloon({
  color,
  x,
  y,
  size,
  delay,
  rotate,
}: {
  color: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  rotate: number;
}) {
  return (
    <div
      className="sa-float"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size * 1.18,
        animationDelay: `${delay}s`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50% 50% 48% 48% / 45% 45% 55% 55%',
          background: `radial-gradient(circle at 32% 28%, #fff8 0%, #fff0 38%), radial-gradient(circle at 62% 72%, ${color} 0%, ${color} 55%, rgba(0,0,0,.28) 100%)`,
          boxShadow: `0 10px 24px -10px ${color}`,
        }}
      />
      {/* knot */}
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          width: 6,
          height: 6,
          transform: 'translateX(-50%) rotate(45deg)',
          background: color,
          filter: 'brightness(.85)',
        }}
      />
      {/* string */}
      <svg
        width="18"
        height={size * 0.85}
        viewBox={`0 0 18 ${size * 0.85}`}
        style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' }}
        aria-hidden="true"
      >
        <path
          d={`M9 0 C 3 ${size * 0.25}, 15 ${size * 0.45}, 9 ${size * 0.85}`}
          stroke={color}
          strokeOpacity=".5"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </div>
  );
}

/** Pure-CSS 3D-ish heart built from two lobes + a point. */
function Heart({
  x,
  y,
  size,
  color,
  glow,
  delay,
  rotate,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  glow: string;
  delay: number;
  rotate: number;
}) {
  const lobe: CSSProperties = {
    position: 'absolute',
    width: size * 0.62,
    height: size * 0.98,
    borderRadius: `${size * 0.4}px ${size * 0.4}px 0 0`,
    background: `linear-gradient(150deg, #ffffffcc 0%, ${color} 34%, rgba(0,0,0,.35) 100%)`,
  };
  return (
    <div
      className="sa-float"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        animationDelay: `${delay}s`,
        filter: `drop-shadow(0 8px 20px ${glow})`,
      }}
      aria-hidden="true"
    >
      <div style={{ ...lobe, left: size * 0.19, transform: 'rotate(-45deg)', transformOrigin: '0 100%' }} />
      <div style={{ ...lobe, left: size * 0.19, transform: 'rotate(45deg)', transformOrigin: '100% 100%' }} />
    </div>
  );
}

function Confetti({ seed, colors, count }: { seed: string; colors: string[]; count: number }) {
  const bits = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: rnd() * 100,
      y: rnd() * 100,
      w: 3 + rnd() * 5,
      h: 6 + rnd() * 9,
      r: rnd() * 360,
      c: colors[i % colors.length],
      o: 0.5 + rnd() * 0.5,
      d: rnd() * 4,
      round: rnd() > 0.65,
    }));
  }, [seed, colors, count]);

  return (
    <>
      {bits.map((b, i) => (
        <span
          key={i}
          className="sa-drift"
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.w,
            height: b.round ? b.w : b.h,
            borderRadius: b.round ? '999px' : 1.5,
            background: b.c,
            opacity: b.o,
            transform: `rotate(${b.r}deg)`,
            animationDelay: `${b.d}s`,
          }}
        />
      ))}
    </>
  );
}

/** A few soft, out-of-focus lights at varying depth — the one enhancement
 * applied to every style alike. Tinted by that style's own accent/glow, so
 * it reads as atmosphere rather than a bolted-on generic effect. Depth comes
 * from `translateZ` inside the shell's `perspective`: farther orbs sit
 * smaller and dimmer, nearer ones loom larger, and `active` pulls all of
 * them closer to the glass for a parallax "pop". */
function DepthBokeh({
  seed,
  colors,
  active,
  count = 4,
}: {
  seed: string;
  colors: string[];
  active: boolean;
  count?: number;
}) {
  const orbs = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: 8 + rnd() * 84,
      y: 8 + rnd() * 84,
      size: 26 + rnd() * 46,
      z: -80 - rnd() * 160,
      c: colors[i % colors.length],
      o: 0.18 + rnd() * 0.22,
      d: rnd() * 3,
    }));
  }, [seed, colors, count]);

  return (
    <>
      {orbs.map((b, i) => (
        <span
          key={i}
          className="sa-float"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: '999px',
            background: b.c,
            opacity: b.o,
            filter: `blur(${b.size * 0.32}px)`,
            animationDelay: `${b.d}s`,
            transform: `translateZ(${active ? b.z * 0.4 : b.z}px)`,
            transition: 'transform .8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ))}
    </>
  );
}

function Starfield({ seed, count, color }: { seed: string; count: number; color: string }) {
  const stars = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      s: 1 + rnd() * 2.2,
      o: 0.35 + rnd() * 0.65,
      d: rnd() * 3.5,
    }));
  }, [seed, count]);

  return (
    <>
      {stars.map((s, i) => (
        <span
          key={i}
          className="sa-twinkle"
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            borderRadius: '999px',
            background: color,
            opacity: s.o,
            animationDelay: `${s.d}s`,
            boxShadow: `0 0 ${s.s * 3}px ${color}`,
          }}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The compositions
 * ------------------------------------------------------------------ */

export default function StyleArt({
  template,
  active = false,
  className = '',
  style,
  density = 1,
}: Props) {
  const p = template.palette;
  const id = template.id;

  /** Scales a particle count, never below 1 so a style never loses its
   *  signature element entirely at low density. */
  const n = (count: number) => Math.max(1, Math.round(count * density));

  const shell: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: p.pageBg,
    perspective: '640px',
    ...style,
  };

  // translateZ (not just translateY/scale) — with `perspective` on the shell
  // above, layers with a bigger `n` genuinely loom closer on hover/active
  // instead of just sliding and scaling in 2D.
  const lift = (n: number): CSSProperties => ({
    transform: active
      ? `translateY(${-n}px) translateZ(${n * 2.6}px) scale(1.03)`
      : 'translateZ(0px)',
    transition: 'transform .6s cubic-bezier(0.16, 1, 0.3, 1)',
  });

  let art: React.ReactNode = null;

  switch (id) {
    /* ---------- BIRTHDAY: balloons breaking the frame + confetti ---------- */
    case 'birthday':
      art = (
        <>
          <div style={{ position: 'absolute', inset: 0, ...lift(4) }}>
            <Confetti seed="bday" colors={template.decor.palette} count={n(26)} />
          </div>
          <div style={{ position: 'absolute', inset: 0, ...lift(9) }}>
            <Balloon color="#e8365d" x={8} y={-16} size={44} delay={0} rotate={-8} />
            <Balloon color="#ffb03a" x={68} y={-24} size={54} delay={0.7} rotate={6} />
            <Balloon color="#4bc0c8" x={40} y={-8} size={34} delay={1.3} rotate={-3} />
          </div>
          {/* warm floor light */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(70% 50% at 50% 118%, rgba(255,176,58,.5) 0%, transparent 70%)',
            }}
          />
        </>
      );
      break;

    /* ---------- ROMANTIC: cinematic glow + sculpted hearts ---------- */
    case 'romantic':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(52% 46% at 68% 22%, rgba(255,143,171,.5) 0%, transparent 68%)',
              ...lift(3),
            }}
          />
          <div style={{ position: 'absolute', inset: 0, ...lift(8) }}>
            <Heart x={16} y={46} size={40} color="#ff8fab" glow="rgba(255,105,145,.55)" delay={0} rotate={-14} />
            <Heart x={62} y={22} size={26} color="#f76b8a" glow="rgba(255,105,145,.45)" delay={1.1} rotate={12} />
            <Heart x={76} y={60} size={18} color="#ffc2d4" glow="rgba(255,105,145,.4)" delay={2} rotate={-6} />
          </div>
          {/* vignette keeps the eye centred */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(78% 68% at 50% 50%, transparent 42%, rgba(0,0,0,.55) 100%)',
            }}
          />
        </>
      );
      break;

    /* ---------- ELEGANT: metallic gold band + glass + hard side light ---------- */
    case 'elegant':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, transparent 30%, rgba(212,175,55,.16) 48%, transparent 62%)',
            }}
          />
          {/* metal band */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '46%',
              height: 3,
              background:
                'linear-gradient(90deg, transparent 2%, #8a6d2f 18%, #f0dda0 38%, #d4af37 52%, #f6e9c0 66%, #8a6d2f 84%, transparent 98%)',
              ...lift(2),
            }}
          />
          {/* glass plate */}
          <div
            style={{
              position: 'absolute',
              left: '18%',
              right: '18%',
              top: '24%',
              bottom: '24%',
              border: '1px solid rgba(212,175,55,.45)',
              background:
                'linear-gradient(160deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.02) 45%, rgba(255,255,255,.07) 100%)',
              backdropFilter: 'blur(2px)',
              ...lift(6),
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(60% 50% at 84% 8%, rgba(212,175,55,.30) 0%, transparent 66%)',
            }}
          />
        </>
      );
      break;

    /* ---------- FUNNY: oversized type slab + stickers, off-axis ---------- */
    case 'funny':
      art = (
        <>
          {/* halftone */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(#1a1a1a 1.4px, transparent 1.5px)',
              backgroundSize: '11px 11px',
              opacity: 0.16,
            }}
          />
          <div
            className="v2-display"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 'clamp(2.6rem, 9vw, 4.4rem)',
              color: '#1a1a1a',
              letterSpacing: '-.06em',
              transform: `rotate(-7deg) ${active ? 'scale(1.06)' : 'scale(1)'}`,
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: 'inherit',
            }}
          >
            HA!
          </div>
          {/* stickers */}
          <span
            style={{
              position: 'absolute',
              top: '14%',
              insetInlineStart: '10%',
              background: '#1a1a1a',
              color: '#ffe75e',
              fontWeight: 800,
              fontSize: 11,
              padding: '5px 11px',
              borderRadius: 999,
              transform: `rotate(-12deg) translateY(${active ? -5 : 0}px)`,
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            לא רציני
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '16%',
              insetInlineEnd: '9%',
              background: '#ff5f6d',
              color: '#fff',
              fontWeight: 800,
              fontSize: 11,
              padding: '5px 11px',
              borderRadius: 999,
              transform: `rotate(9deg) translateY(${active ? 5 : 0}px)`,
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            אזהרה
          </span>
        </>
      );
      break;

    /* ---------- MINIMAL: almost nothing, executed precisely ---------- */
    case 'minimal':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: '30%',
              width: 1,
              height: '40%',
              background: 'linear-gradient(180deg, transparent, #1f1d1a55, transparent)',
              ...lift(2),
            }}
          />
          <div
            className="v2-display"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
              color: '#1f1d1a',
              opacity: active ? 0.9 : 0.62,
              transition: 'opacity .5s cubic-bezier(0.16, 1, 0.3, 1), transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: active ? 'translateY(-3px)' : 'none',
            }}
          >
            א
          </div>
        </>
      );
      break;

    /* ---------- PARTY: neon beams + glow orbs ---------- */
    case 'party':
      art = (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-30%',
                bottom: '-30%',
                insetInlineStart: `${12 + i * 30}%`,
                width: '16%',
                background: `linear-gradient(180deg, transparent, ${
                  ['#00f5d4', '#9b5de5', '#f15bb5'][i]
                }55, transparent)`,
                filter: 'blur(14px)',
                transform: `rotate(${i % 2 === 0 ? 14 : -14}deg) translateY(${active ? -10 : 0}px)`,
                transition: 'transform .6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
          <div style={{ position: 'absolute', inset: 0, ...lift(5) }}>
            <Confetti seed="party" colors={['#00f5d4', '#9b5de5', '#f15bb5', '#fee440']} count={n(22)} />
          </div>
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '18%',
              top: '30%',
              width: 62,
              height: 62,
              borderRadius: '999px',
              background: 'radial-gradient(circle at 35% 30%, #fff 0%, #00f5d4 38%, #067f74 100%)',
              boxShadow: '0 0 40px 10px rgba(0,245,212,.45)',
              ...lift(9),
            }}
          />
        </>
      );
      break;

    /* ---------- BOTANICAL: paper grain + real leaf silhouettes ---------- */
    case 'botanical':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
              opacity: 0.3,
              mixBlendMode: 'multiply',
            }}
          />
          <svg
            viewBox="0 0 200 140"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(6) }}
            aria-hidden="true"
          >
            <g fill="none" stroke="#4f6b45" strokeWidth="1.4" strokeLinecap="round" opacity=".8">
              <path d="M20 132 C 40 96, 52 62, 54 22" />
              <path d="M176 132 C 158 100, 148 72, 146 36" />
            </g>
            <g fill="#6f8f5f" opacity=".85">
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse key={i} cx={30 + i * 6} cy={118 - i * 22} rx="13" ry="6"
                  transform={`rotate(${-32 + i * 4} ${30 + i * 6} ${118 - i * 22})`} />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <ellipse key={`r${i}`} cx={168 - i * 5} cy={116 - i * 21} rx="11" ry="5.4"
                  transform={`rotate(${28 - i * 4} ${168 - i * 5} ${116 - i * 21})`} opacity=".7" />
              ))}
            </g>
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(58% 46% at 26% 8%, rgba(255,255,255,.55) 0%, transparent 62%)',
            }}
          />
        </>
      );
      break;

    /* ---------- RETRO: 70s sunburst + grain ---------- */
    case 'retro':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: '58%',
              width: '190%',
              aspectRatio: '1',
              transform: `translate(-50%,-50%) ${active ? 'rotate(8deg)' : 'rotate(0deg)'}`,
              transition: 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
              background:
                'repeating-conic-gradient(from 0deg, rgba(193,68,14,.30) 0deg 9deg, transparent 9deg 18deg)',
              borderRadius: '999px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: '58%',
              width: '46%',
              aspectRatio: '1',
              transform: 'translate(-50%,-50%)',
              borderRadius: '999px',
              background: 'radial-gradient(circle at 38% 32%, #ffe6ad 0%, #f6c65b 45%, #e07a3f 100%)',
              boxShadow: '0 14px 34px -12px rgba(140,59,30,.6)',
              ...lift(5),
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
              opacity: 0.26,
              mixBlendMode: 'multiply',
            }}
          />
        </>
      );
      break;

    /* ---------- MIDNIGHT: starfield + crescent + haze ---------- */
    case 'midnight':
      art = (
        <>
          <div style={{ position: 'absolute', inset: 0, ...lift(2) }}>
            <Starfield seed="mid" count={n(46)} color="#eaf0ff" />
          </div>
          {/* crescent: one disc masked by an offset disc */}
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '18%',
              top: '18%',
              width: 58,
              height: 58,
              borderRadius: '999px',
              background: 'radial-gradient(circle at 34% 30%, #ffffff 0%, #dfe7ff 45%, #9aa6cc 100%)',
              boxShadow: '0 0 44px 12px rgba(180,200,255,.4)',
              ...lift(7),
            }}
          >
            <div
              style={{
                position: 'absolute',
                insetInlineEnd: -16,
                top: -10,
                width: 58,
                height: 58,
                borderRadius: '999px',
                // Carves the crescent by overlaying the ground colour, so it
                // has to track the midnight palette's pageBg in this region
                // (top-right, near the radial's centre stop) — a mismatch
                // shows up as a visible disc rather than a moon.
                background: '#283460',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(70% 40% at 50% 108%, rgba(142,167,233,.35) 0%, transparent 70%)',
            }}
          />
        </>
      );
      break;

    /* ---------- BOLD: brutalist type block + hard geometry ---------- */
    case 'bold':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              top: '34%',
              width: active ? '78%' : '64%',
              height: 12,
              background: '#ff5252',
              transition: 'width .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '12%',
              bottom: '18%',
              width: 46,
              height: 46,
              border: '4px solid #ff5252',
              transform: `rotate(${active ? 24 : 12}deg)`,
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 8vw, 3.6rem)',
              letterSpacing: '-.06em',
              color: '#f5f5f5',
              transform: active ? 'translateY(-4px)' : 'none',
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            BOLD
          </div>
        </>
      );
      break;

    /* ---------- AURORA: layered light ribbons over a starfield ---------- */
    case 'aurora':
      art = (
        <>
          <div style={{ position: 'absolute', inset: 0, ...lift(2) }}>
            <Starfield seed="aur" count={n(34)} color="#dbe8ff" />
          </div>
          {[
            { c: 'rgba(100,240,196,.55)', x: '-10%', w: '58%', r: -16, d: '0s' },
            { c: 'rgba(138,169,255,.5)', x: '26%', w: '52%', r: 12, d: '1.4s' },
            { c: 'rgba(180,120,240,.42)', x: '58%', w: '48%', r: -8, d: '2.6s' },
          ].map((b, i) => (
            <div
              key={i}
              className="sa-float"
              style={{
                position: 'absolute',
                insetInlineStart: b.x,
                top: '-14%',
                width: b.w,
                height: '86%',
                background: `linear-gradient(180deg, transparent 0%, ${b.c} 42%, transparent 92%)`,
                filter: 'blur(20px)',
                transform: `rotate(${b.r}deg) translateY(${active ? -12 : 0}px)`,
                transition: 'transform .7s cubic-bezier(0.16, 1, 0.3, 1)',
                animationDelay: b.d,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(70% 34% at 50% 106%, rgba(20,40,70,.85) 0%, transparent 72%)',
            }}
          />
        </>
      );
      break;

    /* ---------- BLUEPRINT: measured grid + dimension lines ---------- */
    case 'blueprint':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(127,178,255,.20) 1px, transparent 1px), linear-gradient(90deg, rgba(127,178,255,.20) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(127,178,255,.34) 1px, transparent 1px), linear-gradient(90deg, rgba(127,178,255,.34) 1px, transparent 1px)',
              backgroundSize: '100px 100px',
            }}
          />
          <svg
            viewBox="0 0 200 150"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(4) }}
            aria-hidden="true"
          >
            <g stroke="#7fb2ff" strokeWidth="1.3" fill="none">
              <rect x="52" y="42" width="96" height="66" rx="3" opacity=".95" />
              <circle cx="100" cy="75" r="20" opacity=".7" />
              {/* dimension line */}
              <path d="M52 122 H148" strokeDasharray="3 3" opacity=".8" />
              <path d="M52 118 V126 M148 118 V126" opacity=".8" />
            </g>
            <circle cx="100" cy="75" r="3" fill="#7fb2ff" />
          </svg>
        </>
      );
      break;

    /* ---------- SUNSET: banded dusk sky + low sun + haze ---------- */
    case 'sunset':
      art = (
        <>
          <div
            className="sa-float"
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              bottom: '-14%',
              width: '44%',
              aspectRatio: '1',
              transform: 'translateX(-50%)',
              borderRadius: '999px',
              background: 'radial-gradient(circle at 46% 38%, #fff6d8 0%, #ffd07a 42%, #ff9557 100%)',
              boxShadow: '0 0 70px 26px rgba(255,170,110,.6)',
            }}
          />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                insetInline: 0,
                bottom: `${16 + i * 13}%`,
                height: 5,
                background: 'rgba(255,255,255,.32)',
                filter: 'blur(3px)',
                transform: `translateY(${active ? -4 - i * 2 : 0}px)`,
                transition: 'transform .6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(120,60,110,.34) 0%, transparent 46%)',
            }}
          />
        </>
      );
      break;

    /* ---------- NOIR: hard light shaft + grain + a single red mark ------ */
    case 'noir':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '-30%',
              background:
                'linear-gradient(108deg, transparent 34%, rgba(255,255,255,.16) 44%, rgba(255,255,255,.05) 50%, transparent 58%)',
              transform: `translateX(${active ? '6%' : '0%'})`,
              transition: 'transform .7s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          {/* venetian blind bars */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                insetInline: 0,
                top: `${6 + i * 13}%`,
                height: '4%',
                background: 'rgba(0,0,0,.55)',
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '16%',
              bottom: '18%',
              width: 34,
              height: 34,
              borderRadius: '999px',
              background: '#e02b3c',
              boxShadow: '0 0 26px 6px rgba(224,43,60,.5)',
              transform: active ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
              opacity: 0.22,
            }}
          />
        </>
      );
      break;

    /* ---------- CANDY: soft overlapping blobs + bubbles ---------- */
    case 'candy':
      art = (
        <>
          {[
            { c: '#ffc2e0', x: '6%', y: '10%', s: 96, d: '0s' },
            { c: '#a8d8ff', x: '52%', y: '-6%', s: 118, d: '1.2s' },
            { c: '#d9c2ff', x: '30%', y: '46%', s: 88, d: '2.1s' },
          ].map((b, i) => (
            <div
              key={i}
              className="sa-float"
              style={{
                position: 'absolute',
                insetInlineStart: b.x,
                top: b.y,
                width: b.s,
                height: b.s,
                borderRadius: '48% 52% 55% 45% / 52% 46% 54% 48%',
                background: `radial-gradient(circle at 34% 30%, #fff 0%, ${b.c} 48%, ${b.c} 100%)`,
                filter: 'blur(.4px)',
                opacity: 0.9,
                animationDelay: b.d,
                transform: active ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform .55s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
          <div style={{ position: 'absolute', inset: 0, ...lift(4) }}>
            <Confetti seed="candy" colors={['#ef7fb4', '#8ec9ff', '#c9b0ff']} count={n(14)} />
          </div>
        </>
      );
      break;

    /* ---------- MARBLE: stone veining, museum quiet ---------- */
    case 'marble':
      art = (
        <>
          <svg
            viewBox="0 0 200 150"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(3) }}
            aria-hidden="true"
          >
            <g stroke="#b9b0a3" fill="none" strokeLinecap="round">
              <path d="M-10 40 C 40 24, 78 62, 120 44 S 190 28, 214 52" strokeWidth="1.6" opacity=".75" />
              <path d="M-10 68 C 46 54, 92 92, 140 70 S 196 58, 214 78" strokeWidth="1.1" opacity=".55" />
              <path d="M-10 104 C 52 92, 84 122, 132 106 S 188 96, 214 112" strokeWidth="1.4" opacity=".45" />
              <path d="M20 -10 C 34 40, 12 78, 30 122" strokeWidth=".9" opacity=".4" />
              <path d="M168 -10 C 152 44, 182 84, 162 128" strokeWidth=".9" opacity=".35" />
            </g>
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(62% 50% at 28% 6%, rgba(255,255,255,.8) 0%, transparent 62%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: '50%',
              width: 44,
              height: 44,
              transform: `translate(-50%,-50%) rotate(45deg) scale(${active ? 1.12 : 1})`,
              transition: 'transform .55s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid #8a7c66',
              opacity: 0.6,
            }}
          />
        </>
      );
      break;

    /* ---------- FAIRYTALE: crescent moon, castle silhouette, sparkle dust --- */
    case 'fairytale':
      art = (
        <>
          <div style={{ position: 'absolute', inset: 0, ...lift(2) }}>
            <Starfield seed="fable" count={n(28)} color="#f3ecff" />
          </div>
          <div
            className="sa-float"
            style={{
              position: 'absolute',
              insetInlineEnd: '14%',
              top: '12%',
              width: 40,
              height: 40,
              borderRadius: '999px',
              background: 'radial-gradient(circle at 36% 32%, #fff8e0 0%, #e8c766 55%, #b98f2e 100%)',
              boxShadow: '0 0 30px 8px rgba(232,199,102,.45)',
            }}
          />
          <svg
            viewBox="0 0 200 100"
            style={{ position: 'absolute', insetInline: 0, bottom: 0, width: '100%', height: '46%', ...lift(4) }}
            aria-hidden="true"
          >
            <g fill="#1a0f36" opacity=".92">
              <rect x="30" y="46" width="16" height="54" />
              <polygon points="38,30 30,46 46,46" />
              <rect x="70" y="30" width="22" height="70" />
              <polygon points="81,10 68,30 94,30" />
              <rect x="112" y="50" width="14" height="50" />
              <polygon points="119,36 111,50 127,50" />
              <rect x="150" y="42" width="18" height="58" />
              <polygon points="159,24 149,42 169,42" />
            </g>
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(60% 46% at 74% 16%, rgba(232,199,102,.28) 0%, transparent 66%)',
            }}
          />
        </>
      );
      break;

    /* ---------- SPORTS: diagonal stadium stripes + spotlight beam -------- */
    case 'sports':
      art = (
        <>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                insetInlineStart: `${-10 + i * 30}%`,
                top: '-20%',
                width: '14%',
                height: '150%',
                background: i % 2 === 0 ? 'rgba(255,122,26,.22)' : 'rgba(255,255,255,.07)',
                transform: `rotate(-18deg) translateX(${active ? 6 : 0}px)`,
                transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
          <div
            className="sa-float"
            style={{
              position: 'absolute',
              insetInlineEnd: '16%',
              top: '22%',
              width: 56,
              height: 56,
              borderRadius: '999px',
              background: 'radial-gradient(circle at 34% 30%, #fff 0%, #ffb570 45%, #ff7a1a 100%)',
              boxShadow: '0 0 34px 10px rgba(255,122,26,.5)',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, ...lift(4) }}>
            <Confetti seed="sport" colors={['#ff7a1a', '#ffffff', '#2ecc71']} count={n(16)} />
          </div>
        </>
      );
      break;

    /* ---------- MILITARY: stencilled star + camo blot silhouettes -------- */
    case 'military':
      art = (
        <>
          <svg
            viewBox="0 0 200 140"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            <g fill="#4a5240" opacity=".55">
              <ellipse cx="34" cy="30" rx="30" ry="20" transform="rotate(-12 34 30)" />
              <ellipse cx="150" cy="24" rx="26" ry="17" transform="rotate(10 150 24)" />
              <ellipse cx="168" cy="104" rx="34" ry="22" transform="rotate(-6 168 104)" />
              <ellipse cx="26" cy="112" rx="24" ry="16" transform="rotate(14 26 112)" />
            </g>
          </svg>
          <div
            className="sa-float"
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: '50%',
              transform: `translate(-50%,-50%) scale(${active ? 1.1 : 1})`,
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
              color: '#c2a35e',
              fontSize: 44,
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.4))',
            }}
          >
            ★
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,.28) 0%, transparent 40%, rgba(0,0,0,.24) 100%)',
            }}
          />
        </>
      );
      break;

    /* ---------- SEA: layered waves + rising bubbles ---------------------- */
    case 'sea':
      art = (
        <>
          {[
            { c: 'rgba(14,147,168,.5)', y: '58%', d: '0s' },
            { c: 'rgba(79,168,201,.55)', y: '70%', d: '1.1s' },
            { c: 'rgba(234,247,251,.7)', y: '82%', d: '2.2s' },
          ].map((w, i) => (
            <svg
              key={i}
              className="sa-drift"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                insetInline: 0,
                top: w.y,
                width: '100%',
                height: '30%',
                animationDelay: w.d,
              }}
              aria-hidden="true"
            >
              <path
                d="M0 20 C 30 4, 60 36, 100 20 S 170 4, 200 20 V40 H0 Z"
                fill={w.c}
              />
            </svg>
          ))}
          <div style={{ position: 'absolute', inset: 0, ...lift(3) }}>
            <Confetti seed="sea" colors={['#0e93a8', '#4fa8c9']} count={n(10)} />
          </div>
        </>
      );
      break;

    /* ---------- WORLD: dotted travel route across a paper map ------------ */
    case 'world':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
              opacity: 0.28,
              mixBlendMode: 'multiply',
            }}
          />
          <svg
            viewBox="0 0 200 140"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(4) }}
            aria-hidden="true"
          >
            <path
              d="M22 112 C 60 100, 70 60, 108 58 S 150 34, 178 24"
              stroke="#2b4a6b"
              strokeWidth="1.6"
              strokeDasharray="1 7"
              strokeLinecap="round"
              fill="none"
              opacity=".85"
            />
            <circle cx="22" cy="112" r="4" fill="#2b4a6b" />
            <circle cx="108" cy="58" r="3" fill="#2b4a6b" opacity=".8" />
          </svg>
          <div
            className="sa-float"
            style={{
              position: 'absolute',
              insetInlineEnd: '14%',
              top: '10%',
              fontSize: 26,
              transform: `rotate(${active ? 18 : 8}deg)`,
              transition: 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            ✈️
          </div>
        </>
      );
      break;

    /* ---------- NEWBORN: real cloud silhouettes + a mobile's drifting motes
     * Clouds are drawn as one merged path rather than stacked pill divs —
     * a wide `border-radius: 999px` box reads as a rounded bar, not a
     * cloud, and three of them greyed the whole card out. */
    case 'newborn':
      art = (
        <>
          <svg
            viewBox="0 0 200 150"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(4) }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nb-cloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".95" />
                <stop offset="100%" stopColor="#DCEAF3" stopOpacity=".7" />
              </linearGradient>
            </defs>
            {/* each cloud is a run of overlapping lobes on a flat base */}
            <g fill="url(#nb-cloud)">
              <g className="sa-float">
                <ellipse cx="44" cy="44" rx="20" ry="15" />
                <ellipse cx="62" cy="38" rx="15" ry="14" />
                <ellipse cx="76" cy="46" rx="16" ry="12" />
                <rect x="28" y="44" width="64" height="14" rx="7" />
              </g>
              <g className="sa-float" style={{ animationDelay: '1.8s' }} opacity=".62">
                <ellipse cx="146" cy="92" rx="17" ry="12" />
                <ellipse cx="161" cy="86" rx="13" ry="12" />
                <rect x="132" y="90" width="46" height="12" rx="6" />
              </g>
            </g>
          </svg>
          {/* a nursery mobile's soft dots, warm rather than starlit */}
          <div style={{ position: 'absolute', inset: 0, ...lift(2) }}>
            <Confetti seed="newborn" colors={['#9DBFD4', '#E7C9B4', '#C3D9E4']} count={n(9)} />
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(60% 46% at 22% 2%, rgba(255,244,230,.75) 0%, transparent 62%)',
            }}
          />
        </>
      );
      break;

    /* ---------- WINTER: falling snow + a drawn frost crystal ------------- */
    case 'winter':
      art = (
        <>
          <div style={{ position: 'absolute', inset: 0, ...lift(2) }}>
            <Starfield seed="winter" count={n(30)} color="#ffffff" />
          </div>
          <svg
            viewBox="0 0 200 150"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(5) }}
            aria-hidden="true"
          >
            {/* one six-fold crystal, drawn rather than an emoji */}
            <g
              stroke="#6E9BBE"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              opacity=".65"
              transform="translate(100 74)"
            >
              {[0, 60, 120].map((a) => (
                <g key={a} transform={`rotate(${a})`}>
                  <path d="M0 -34 V34" />
                  <path d="M0 -24 l -8 -8 M0 -24 l 8 -8" />
                  <path d="M0 24 l -8 8 M0 24 l 8 8" />
                </g>
              ))}
            </g>
          </svg>
          {/* frost creeping in from the edges */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(80% 70% at 50% 50%, transparent 44%, rgba(255,255,255,.55) 100%)',
            }}
          />
        </>
      );
      break;

    /* ---------- DESERT: layered dunes under a low, hazy sun -------------- */
    case 'desert':
      art = (
        <>
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '20%',
              top: '16%',
              width: 52,
              height: 52,
              borderRadius: '999px',
              background: 'radial-gradient(circle at 40% 36%, #FFF0D4 0%, #F0C48C 52%, #D89A62 100%)',
              opacity: 0.9,
              ...lift(4),
            }}
          />
          <svg
            viewBox="0 0 200 150"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(6) }}
            aria-hidden="true"
          >
            <path d="M0 96 C 44 74, 78 104, 118 88 S 176 66, 200 82 V150 H0 Z" fill="#D7AE85" opacity=".8" />
            <path d="M0 116 C 38 100, 88 130, 130 112 S 182 98, 200 110 V150 H0 Z" fill="#C08E63" opacity=".85" />
            <path d="M0 136 C 50 124, 96 146, 142 132 S 186 124, 200 132 V150 H0 Z" fill="#9C6B45" opacity=".8" />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(255,238,214,.5) 0%, transparent 42%)',
            }}
          />
        </>
      );
      break;

    /* ---------- BLOOM: overlapping petal forms, no clip-art flower ------- */
    case 'bloom':
      art = (
        <>
          {[
            { c: '#F3AFA6', x: 26, y: 40, s: 92, r: -18, d: '0s' },
            { c: '#E58AA0', x: 62, y: 24, s: 74, r: 26, d: '1.3s' },
            { c: '#F8D3C7', x: 46, y: 66, s: 84, r: 8, d: '2.4s' },
          ].map((b, i) => (
            <div
              key={i}
              className="sa-float"
              style={{
                position: 'absolute',
                insetInlineStart: `${b.x}%`,
                top: `${b.y}%`,
                width: b.s,
                height: b.s * 0.72,
                // A petal, not a circle: one rounded end, one drawn to a point.
                borderRadius: '76% 24% 62% 38% / 68% 58% 42% 32%',
                background: `radial-gradient(70% 80% at 32% 26%, #FFFFFF 0%, ${b.c} 46%, ${b.c} 100%)`,
                opacity: 0.62,
                filter: 'blur(.5px)',
                animationDelay: b.d,
                transform: `translate(-50%,-50%) rotate(${b.r}deg) scale(${active ? 1.07 : 1})`,
                transition: 'transform .6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(56% 46% at 22% 4%, rgba(255,252,250,.72) 0%, transparent 62%)',
            }}
          />
        </>
      );
      break;

    /* ---------- ARCADE: chunky pixel blocks + CRT scanlines -------------- */
    case 'arcade':
      art = (
        <>
          {/* an 8-bit invader, built from real blocks rather than an emoji */}
          <div
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: '50%',
              transform: `translate(-50%,-50%) scale(${active ? 1.1 : 1})`,
              transition: 'transform .35s steps(4)',
              display: 'grid',
              gridTemplateColumns: 'repeat(11, 7px)',
              gridAutoRows: '7px',
            }}
          >
            {[
              '00100000100',
              '00010001000',
              '00111111100',
              '01101110110',
              '11111111111',
              '10111111101',
              '10100000101',
              '00011011000',
            ]
              .join('')
              .split('')
              .map((bit, i) => (
                <span
                  key={i}
                  style={{
                    background: bit === '1' ? '#7CF76F' : 'transparent',
                    boxShadow: bit === '1' ? '0 0 6px rgba(124,247,111,.55)' : 'none',
                  }}
                />
              ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, ...lift(4) }}>
            <Confetti seed="arcade" colors={['#7CF76F', '#F76FC5', '#6A3DF0']} count={n(12)} />
          </div>
          {/* CRT scanlines — a repeating gradient, not 40 elements */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(180deg, rgba(0,0,0,.32) 0px, rgba(0,0,0,.32) 1px, transparent 1px, transparent 4px)',
              opacity: 0.7,
            }}
          />
        </>
      );
      break;

    /* ---------- ZEN: a single sumi enso, brushed and deliberately open --- */
    case 'zen':
      art = (
        <>
          <svg
            viewBox="0 0 200 150"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...lift(3) }}
            aria-hidden="true"
          >
            {/* the ring is left unclosed and unevenly weighted — a closed,
             * even circle would read as a border-radius, not a brushstroke */}
            <path
              d="M132 44 C 154 60, 152 100, 122 114 C 90 129, 54 116, 46 88 C 38 60, 62 36, 96 34"
              stroke="#2B2824"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              opacity=".82"
            />
            <path
              d="M132 44 C 154 60, 152 100, 122 114"
              stroke="#2B2824"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity=".45"
            />
            <circle cx="150" cy="120" r="4.5" fill="#8C3A2E" opacity=".8" />
          </svg>
          {/* rice-paper fibre */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
              opacity: 0.24,
              mixBlendMode: 'multiply',
            }}
          />
        </>
      );
      break;

    default:
      art = null;
  }

  /* The bokeh is atmosphere thrown by the template's OWN particles, so a
   * template that has no particles gets none. Falling back to ink/accent
   * here (as this used to) put out-of-focus grey blobs on exactly the seven
   * precision styles — minimal, bold, blueprint, noir, marble, military,
   * world — whose whole art direction is hard edges and empty space. */
  const bokehColors = template.decor.palette;

  return (
    <div className={`sa-shell ${className}`} style={shell} aria-hidden="true">
      {art}
      {bokehColors.length > 0 && (
        <DepthBokeh seed={`${id}-bokeh`} colors={bokehColors} active={active} count={n(4)} />
      )}
    </div>
  );
}
