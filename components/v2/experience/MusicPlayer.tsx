'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Floating music control for the recipient page.
 *
 * Playback is only ever started from `startPlaying`, which the experience
 * calls after the recipient taps the gate — that user gesture is what makes
 * autoplay-with-sound legal in every browser. If it's still refused we fall
 * back to muted playback and surface an obvious unmute affordance rather
 * than silently doing nothing.
 */

interface MusicPlayerProps {
  src: string;
  /** Flips true once the gate has been opened. */
  active: boolean;
  accent: string;
  ink: string;
  surface: string;
  border: string;
}

const FADE_MS = 1800;
const TARGET_VOLUME = 0.55;

export default function MusicPlayer({
  src,
  active,
  accent,
  ink,
  surface,
  border,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(TARGET_VOLUME);
  const [showVolume, setShowVolume] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current || !src) return;
    startedRef.current = true;

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        fadeTo(audio, TARGET_VOLUME);
      })
      .catch(() => {
        // Audible autoplay refused — play muted so the track is at least
        // running, and let the button unmute it.
        audio.muted = true;
        audio.volume = TARGET_VOLUME;
        setMuted(true);
        audio
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      });
  }, [active, src]);

  function fadeTo(audio: HTMLAudioElement, target: number) {
    const start = performance.now();
    const from = audio.volume;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (target - from) * t;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      audio.muted = false;
      setMuted(false);
      if (audio.paused) void audio.play().then(() => setPlaying(true)).catch(() => {});
      return;
    }

    if (audio.paused) {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const onVolume = (value: number) => {
    setVolume(value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value;
      if (value > 0 && audio.muted) {
        audio.muted = false;
        setMuted(false);
      }
    }
  };

  if (!src) return null;

  const isOn = playing && !muted;

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />

      <div
        className="fixed z-40 flex items-center gap-2"
        style={{ insetInlineEnd: '1rem', bottom: '1rem' }}
      >
        {showVolume && (
          <div
            className="flex items-center rounded-full px-4 py-2"
            style={{ background: surface, border: `1.5px solid ${border}` }}
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              aria-label="עוצמת המוזיקה"
              style={{ width: 96, accentColor: accent }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={toggle}
          onDoubleClick={() => setShowVolume((v) => !v)}
          aria-label={isOn ? 'כיבוי מוזיקה' : 'הפעלת מוזיקה'}
          title={isOn ? 'כיבוי מוזיקה (לחיצה כפולה — עוצמה)' : 'הפעלת מוזיקה'}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{
            background: isOn ? accent : surface,
            border: `1.5px solid ${isOn ? accent : border}`,
            color: isOn ? '#fff' : ink,
            boxShadow: '0 8px 24px -10px rgba(0,0,0,0.4)',
          }}
        >
          {isOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 5a9 9 0 0 1 0 14" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="m23 9-6 6M17 9l6 6" />
            </svg>
          )}
        </button>
      </div>

      {muted && playing && (
        <button
          type="button"
          onClick={toggle}
          className="fixed z-40 text-xs font-bold px-4 py-2 rounded-full"
          style={{
            insetInlineEnd: '1rem',
            bottom: '4.25rem',
            background: accent,
            color: '#fff',
            boxShadow: '0 8px 24px -10px rgba(0,0,0,0.4)',
          }}
        >
          🔊 הפעילו את הצליל
        </button>
      )}
    </>
  );
}
