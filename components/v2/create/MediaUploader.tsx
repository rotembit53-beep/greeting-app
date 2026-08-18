'use client';

import { useState } from 'react';
import { MediaItem } from '@/lib/v2/types';

/**
 * Uploads through the existing /api/upload-media endpoint (shared with V1,
 * read-only from here — the route itself is untouched), so both versions
 * write to the same R2 bucket without any duplicated storage plumbing.
 */

const ERRORS: Record<string, string> = {
  'Invalid file type': 'סוג הקובץ אינו נתמך — JPG, PNG, WebP או וידאו MP4/WebM',
  'File too large': 'הקובץ גדול מדי — עד 50MB',
};

interface Props {
  draftId: string;
  media: MediaItem[];
  maxImages: number;
  allowVideo: boolean;
  onChange: (media: MediaItem[]) => void;
}

export default function MediaUploader({
  draftId,
  media,
  maxImages,
  allowVideo,
  onChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const atLimit = media.length >= maxImages;

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setError(null);

    const room = maxImages - media.length;
    if (room <= 0) {
      setError(`הגעתם למקסימום ${maxImages} קבצים`);
      return;
    }

    setUploading(true);
    const added: MediaItem[] = [];

    for (const file of files.slice(0, room)) {
      if (!allowVideo && file.type.startsWith('video/')) {
        setError('העלאת וידאו זמינה בפרימיום');
        continue;
      }

      const form = new FormData();
      form.append('file', file);
      form.append('greetingId', draftId);

      try {
        const res = await fetch('/api/upload-media', { method: 'POST', body: form });
        const data = (await res.json().catch(() => ({}))) as {
          path?: string;
          error?: string;
        };

        if (res.ok && data.path) {
          added.push({
            url: data.path,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            caption: '',
          });
        } else {
          setError((data.error && ERRORS[data.error]) || 'ההעלאה נכשלה — נסו שוב');
        }
      } catch {
        setError('ההעלאה נכשלה — בדקו את החיבור לאינטרנט');
      }
    }

    if (added.length) onChange([...media, ...added]);
    setUploading(false);
  };

  const remove = (index: number) => {
    onChange(media.filter((_, i) => i !== index));
  };

  const setCaption = (index: number, caption: string) => {
    onChange(media.map((m, i) => (i === index ? { ...m, caption } : m)));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= media.length || from === to) return;
    const next = [...media];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className="rounded-2xl p-6 text-center transition-colors"
        style={{
          border: `2px dashed ${dragOver ? 'var(--v2-accent)' : 'var(--v2-surface-border)'}`,
          background: dragOver ? 'var(--v2-accent-soft)' : 'var(--v2-surface)',
        }}
      >
        <input
          type="file"
          id="v2-media-input"
          className="hidden"
          accept={allowVideo ? 'image/*,video/*' : 'image/*'}
          multiple
          disabled={uploading || atLimit}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            void uploadFiles(files);
          }}
        />
        <label
          htmlFor="v2-media-input"
          className={atLimit ? 'block opacity-50' : 'block cursor-pointer'}
        >
          <div className="text-3xl mb-2">{uploading ? '⏳' : '🖼️'}</div>
          <p className="font-bold" style={{ color: 'var(--v2-ink)' }}>
            {uploading
              ? 'מעלים…'
              : atLimit
                ? `הגעתם למקסימום ${maxImages}`
                : 'הוסיפו תמונות'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--v2-ink-soft)' }}>
            גררו לכאן או לחצו · {media.length}/{maxImages}
          </p>
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm text-center font-semibold" style={{ color: '#c62828' }}>
          {error}
        </p>
      )}

      {media.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {media.map((item, i) => (
            <div
              key={`${item.url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className="flex gap-3 items-center rounded-2xl p-2.5"
              style={{
                background: 'var(--v2-surface)',
                border: '1.5px solid var(--v2-surface-border)',
                opacity: dragIndex === i ? 0.45 : 1,
              }}
            >
              <div
                className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: 'var(--v2-accent-soft)' }}
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              <input
                className="v2-field !py-2 flex-1 text-sm"
                value={item.caption ?? ''}
                onChange={(e) => setCaption(i, e.target.value)}
                placeholder="כיתוב (לא חובה)"
                maxLength={200}
              />

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="הזיזו למעלה"
                  className="w-7 h-7 rounded-lg text-xs disabled:opacity-30"
                  style={{ border: '1px solid var(--v2-surface-border)', color: 'var(--v2-ink)' }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === media.length - 1}
                  aria-label="הזיזו למטה"
                  className="w-7 h-7 rounded-lg text-xs disabled:opacity-30"
                  style={{ border: '1px solid var(--v2-surface-border)', color: 'var(--v2-ink)' }}
                >
                  ↓
                </button>
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="מחיקה"
                className="w-8 h-8 rounded-lg flex-shrink-0"
                style={{ border: '1px solid #e5989b', color: '#c62828' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
