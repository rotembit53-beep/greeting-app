'use client';

import { useEffect, useRef, useState } from 'react';
import { MOODS, TRACKS, Track, trackUrl } from '@/lib/v2/music';
import { MusicMood } from '@/lib/v2/types';

interface Props {
  value: string;
  enabled: boolean;
  premium: boolean;
  suggestedMood?: MusicMood;
  onChange: (url: string) => void;
  onToggle: (enabled: boolean) => void;
  onPremiumClick: () => void;
}

export default function MusicPicker({
  value,
  enabled,
  premium,
  suggestedMood,
  onChange,
  onToggle,
  onPremiumClick,
}: Props) {
  const [mood, setMood] = useState<MusicMood>(suggestedMood ?? 'happy');
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener('ended', () => setPreviewing(null));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const preview = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = trackUrl(track);

    if (previewing === url) {
      audio.pause();
      setPreviewing(null);
      return;
    }
    audio.src = url;
    audio.volume = 0.6;
    void audio.play().catch(() => {});
    setPreviewing(url);
  };

  const tracks = TRACKS.filter((t) => t.mood === mood);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="v2-label !mb-0">מוזיקת רקע</span>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className="text-sm font-bold px-4 py-2 rounded-full transition-colors"
          style={{
            background: enabled ? 'var(--v2-accent)' : 'var(--v2-surface)',
            color: enabled ? 'var(--v2-on-accent, #fff)' : 'var(--v2-ink-soft)',
            border: '1.5px solid var(--v2-surface-border)',
          }}
        >
          {enabled ? '🔊 מוזיקה פועלת' : '🔇 מוזיקה כבויה'}
        </button>
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                data-selected={mood === m.id}
                className="v2-choice !py-2.5"
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[11px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {tracks.map((track) => {
              const url = trackUrl(track);
              const locked = track.premium && !premium;
              const selected = value === url;

              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{
                    background: selected ? 'var(--v2-accent-soft)' : 'var(--v2-surface)',
                    border: `1.5px solid ${selected ? 'var(--v2-accent)' : 'var(--v2-surface-border)'}`,
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => preview(track)}
                    aria-label={previewing === url ? 'עצירה' : `האזנה ל-${track.title}`}
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: previewing === url ? 'var(--v2-accent)' : 'var(--v2-accent-soft)',
                      color: previewing === url ? '#fff' : 'var(--v2-accent)',
                    }}
                  >
                    {previewing === url ? '❚❚' : '▶'}
                  </button>

                  <button
                    type="button"
                    onClick={() => (locked ? onPremiumClick() : onChange(url))}
                    className="flex-1 text-start text-sm font-semibold"
                    style={{ color: 'var(--v2-ink)' }}
                  >
                    {track.title}
                    {locked && (
                      <span
                        className="ms-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--v2-accent)', color: '#fff' }}
                      >
                        PREMIUM
                      </span>
                    )}
                  </button>

                  {selected && <span style={{ color: 'var(--v2-accent)' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
