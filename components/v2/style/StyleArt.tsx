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

export default function StyleArt({ template, active = false, className = '', style }: Props) {
  const p = template.palette;
  const id = template.id;

  const shell: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: p.pageBg,
    ...style,
  };

  const lift = (n: number): CSSProperties => ({
    transform: active ? `translateY(${-n}px) scale(1.03)` : 'none',
    transition: 'transform .55s cubic-bezier(.2,.8,.3,1)',
  });

  let art: React.ReactNode = null;

  switch (id) {
    /* ---------- BIRTHDAY: balloons breaking the frame + confetti ---------- */
    case 'birthday':
      art = (
        <>
          <div style={{ position: 'absolute', inset: 0, ...lift(4) }}>
            <Confetti seed="bday" colors={template.decor.palette} count={26} />
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
              transition: 'transform .5s cubic-bezier(.2,.8,.3,1)',
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
              transition: 'transform .5s ease',
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
              transition: 'transform .5s ease',
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
              transition: 'opacity .5s ease, transform .5s ease',
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
                transition: 'transform .6s ease',
              }}
            />
          ))}
          <div style={{ position: 'absolute', inset: 0, ...lift(5) }}>
            <Confetti seed="party" colors={['#00f5d4', '#9b5de5', '#f15bb5', '#fee440']} count={22} />
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
              transition: 'transform 1.1s cubic-bezier(.2,.8,.3,1)',
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
            <Starfield seed="mid" count={46} color="#eaf0ff" />
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
                background: '#141a38',
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
              transition: 'width .5s cubic-bezier(.2,.8,.3,1)',
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
              transition: 'transform .5s ease',
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
              transition: 'transform .5s ease',
            }}
          >
            BOLD
          </div>
        </>
      );
      break;

    default:
      art = null;
  }

  return (
    <div className={`sa-shell ${className}`} style={shell} aria-hidden="true">
      {art}
    </div>
  );
}
