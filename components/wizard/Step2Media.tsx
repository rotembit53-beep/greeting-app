'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import { isVideoFile } from '@/components/greeting/HeroCarousel';

interface StepProps {
  state: any;
  updateState: (updates: any) => void;
}

const AUDIO_CATEGORIES = [
  { id: 'birthday', label: 'יום הולדת' },
  { id: 'party', label: 'שמחה ומסיבה' },
  { id: 'rock', label: 'רוק אנרגטי' },
  { id: 'pop', label: 'פופ מודרני' },
  { id: 'sports', label: 'ספורטיבי' },
  { id: 'epic', label: 'דרמטי' },
  { id: 'gaming', label: 'גיימינג' },
  { id: 'romance', label: 'רומנטי' },
  { id: 'chill', label: 'רגוע ונינוח' },
];

interface AudioFile {
  path: string;
  name: string;
}

/**
 * Groups characters into 4s with dashes as you type, e.g. "9354448222970" ->
 * "9354-4482-2297-0". Different gift card providers use very different card
 * number / code lengths (12 digits, 16 digits, 19 digits...) and some codes
 * are alphanumeric rather than pure digits (Google Play, Steam, iTunes,
 * etc.) — so this only strips separators the user may have typed/pasted
 * (spaces, dashes) rather than assuming digits-only, and doesn't force any
 * particular total length, just regroups whatever was typed into readable 4s.
 */
function formatCardNumber(raw: string): string {
  const chars = raw
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 32);
  return chars.match(/.{1,4}/g)?.join('-') ?? '';
}

/** Auto-inserts the slash after the month, e.g. "122027" -> "12/2027". */
function formatCardDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function Step2Media({ state, updateState }: StepProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('party');
  const [audioFiles, setAudioFiles] = useState<Record<string, AudioFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewingPath, setPreviewingPath] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingGiftCard, setUploadingGiftCard] = useState(false);
  const [giftCardUploadError, setGiftCardUploadError] = useState<string | null>(null);

  const removeMedia = async (file: string) => {
    setDeletingFile(file);
    try {
      const key = file.replace(/^\/api\/media\//, '');
      await fetch('/api/upload-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
    } catch (err) {
      console.error('Delete media error:', err);
    } finally {
      const { [file]: _removed, ...restAudioSettings } = state.mediaAudioSettings || {};
      updateState({
        mediaFiles: state.mediaFiles.filter((f: string) => f !== file),
        mediaAudioSettings: restAudioSettings,
      });
      setDeletingFile(null);
    }
  };

  const setVideoAudioEnabled = (file: string, enabled: boolean) => {
    updateState({
      mediaAudioSettings: { ...state.mediaAudioSettings, [file]: enabled },
    });
  };

  const moveMedia = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= state.mediaFiles.length || fromIdx === toIdx) return;
    const next = [...state.mediaFiles];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    updateState({ mediaFiles: next });
  };

  const handleDrop = (dropIdx: number) => {
    if (dragIndex !== null && dragIndex !== dropIdx) {
      moveMedia(dragIndex, dropIdx);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener('ended', () => setPreviewingPath(null));
    previewAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const togglePreview = (path: string) => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (previewingPath === path) {
      audio.pause();
      setPreviewingPath(null);
      return;
    }

    audio.src = path;
    audio.play();
    setPreviewingPath(path);
  };

  // Scan audio on mount
  useEffect(() => {
    const scanAudio = async () => {
      try {
        const res = await fetch('/api/scan-audio');
        const data: any = await res.json();
        if (data.success) {
          setAudioFiles(data.categorized);
        } else {
          setError('לא הצלחנו לטעון את ספריית המוזיקה');
        }
      } catch (err) {
        setError('שגיאה בטעינת ספריית המוזיקה');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    scanAudio();
  }, []);

  const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
    'Invalid file type': 'סוג הקובץ אינו נתמך — ניתן להעלות תמונות JPG, PNG, WebP או וידאו MP4/WebM בלבד',
    'File too large': 'הקובץ גדול מדי — הגודל המרבי הוא 50MB',
    'Missing file or greeting ID': 'שגיאה פנימית — נסו לרענן את הדף ולנסות שוב',
    'Invalid greeting ID': 'שגיאה פנימית — נסו לרענן את הדף ולנסות שוב',
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    e.target.value = '';
    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('greetingId', state.id);

    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData,
      });

      const data: any = await res.json().catch(() => null);

      if (res.ok && data?.path) {
        updateState({
          mediaFiles: [...state.mediaFiles, data.path],
        });
      } else {
        const serverError = data?.error as string | undefined;
        setUploadError(
          (serverError && UPLOAD_ERROR_MESSAGES[serverError]) ||
            'העלאת הקובץ נכשלה — נסו שוב'
        );
        console.error('Upload failed:', res.status, serverError);
      }
    } catch (err) {
      setUploadError('העלאת הקובץ נכשלה — בדקו את החיבור לאינטרנט ונסו שוב');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleGiftCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    e.target.value = '';
    setGiftCardUploadError(null);
    setUploadingGiftCard(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('greetingId', state.id);

    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData,
      });

      const data: any = await res.json().catch(() => null);

      if (res.ok && data?.path) {
        updateState({
          giftCard: {
            ...state.giftCard,
            images: [...(state.giftCard?.images || []), data.path],
          },
        });
      } else {
        const serverError = data?.error as string | undefined;
        setGiftCardUploadError(
          (serverError && UPLOAD_ERROR_MESSAGES[serverError]) ||
            'העלאת התמונה נכשלה — נסו שוב'
        );
      }
    } catch (err) {
      setGiftCardUploadError('העלאת התמונה נכשלה — בדקו את החיבור לאינטרנט ונסו שוב');
      console.error('Gift card image upload error:', err);
    } finally {
      setUploadingGiftCard(false);
    }
  };

  const removeGiftCardImage = async (file: string) => {
    try {
      const key = file.replace(/^\/api\/media\//, '');
      await fetch('/api/upload-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
    } catch (err) {
      console.error('Delete gift card image error:', err);
    } finally {
      updateState({
        giftCard: {
          ...state.giftCard,
          images: (state.giftCard?.images || []).filter((f: string) => f !== file),
        },
      });
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (!file.type.includes('audio')) {
      alert('אנא בחרו קובץ אודיו בפורמט MP3');
      return;
    }

    // For custom MP3, we'll store it locally
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Save to state directly as a data URL for now
      // In production, this would be uploaded to /public/audio/custom/
      updateState({ audioTrack: `/audio/custom/${file.name}` });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">מדיה ומוזיקה</h2>
        <p className="section-subtitle">
          הוסיפו תמונות או וידאו, ובחרו פסקול שילווה את הברכה
        </p>
      </div>

      {/* Media Upload */}
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center transition-colors hover:border-[var(--primary)]"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaUpload}
          disabled={uploading}
          className="hidden"
          id="media-upload"
        />
        <label
          htmlFor="media-upload"
          className={uploading ? 'block cursor-wait' : 'cursor-pointer block'}
        >
          <span
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Icon name={uploading ? 'refresh' : 'image'} size={26} className={uploading ? 'animate-spin' : ''} />
          </span>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>
            {uploading ? 'מעלים...' : 'הוסיפו תמונה או וידאו'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            לחצו לבחירת קובץ או גררו אותו לכאן
          </p>
        </label>
      </div>

      {uploadError && (
        <div
          className="p-3 rounded-xl border text-sm text-center"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'var(--danger-soft, rgba(220,38,38,0.06))' }}
          role="alert"
        >
          {uploadError}
        </div>
      )}

      {state.mediaFiles.length > 0 && (
        <div>
          <p className="field-label">קבצים שהועלו</p>
          <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)' }}>
            גררו לשינוי סדר ההופעה בברכה — הראשון יוצג ראשון, השני מיד אחריו וכך הלאה
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {state.mediaFiles.map((file: string, idx: number) => {
              const isVideo = isVideoFile(file);
              const isDragging = dragIndex === idx;
              const isDragOver = dragOverIndex === idx && dragIndex !== null && dragIndex !== idx;
              const videoHasAudio = state.mediaAudioSettings?.[file] !== false;

              return (
                <div key={file} className="space-y-1.5">
                <div
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragEnter={() => setDragOverIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className="relative aspect-square rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing transition-opacity"
                  style={{
                    borderColor: isDragOver ? 'var(--primary)' : 'var(--border)',
                    background: 'var(--background)',
                    opacity: isDragging ? 0.4 : 1,
                    boxShadow: isDragOver ? '0 0 0 2px var(--primary)' : 'none',
                  }}
                >
                  {isVideo ? (
                    <>
                      <video
                        src={file}
                        muted
                        playsInline
                        preload="metadata"
                        // Browsers don't paint a frame from preload="metadata" alone —
                        // nudging currentTime forces one to decode and render as a poster.
                        onLoadedMetadata={(e) => {
                          e.currentTarget.currentTime = Math.min(0.1, e.currentTarget.duration || 0.1);
                        }}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <span
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                        title="סרטון"
                      >
                        <Icon name="video" size={13} />
                      </span>
                    </>
                  ) : (
                    <img
                      src={file}
                      alt={`קובץ שהועלה ${idx + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )}

                  <span
                    className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {idx + 1}
                  </span>

                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => moveMedia(idx, idx - 1)}
                      disabled={idx === 0}
                      title="הזיזו קודם בסדר"
                      aria-label="הזיזו קודם בסדר"
                      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--ink)' }}
                    >
                      <Icon name="chevron-right" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMedia(file)}
                      disabled={deletingFile === file}
                      title="מחיקת הקובץ"
                      aria-label="מחיקת הקובץ"
                      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--danger)' }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(idx, idx + 1)}
                      disabled={idx === state.mediaFiles.length - 1}
                      title="הזיזו אחרי בסדר"
                      aria-label="הזיזו אחרי בסדר"
                      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--ink)' }}
                    >
                      <Icon name="chevron-left" size={14} />
                    </button>
                  </div>
                </div>

                {isVideo && (
                  <div
                    className="flex rounded-lg overflow-hidden border"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setVideoAudioEnabled(file, true)}
                      className="flex-1 text-xs font-medium py-1.5 transition-colors"
                      style={{
                        background: videoHasAudio ? 'var(--primary)' : 'var(--surface)',
                        color: videoHasAudio ? '#fff' : 'var(--ink-soft)',
                      }}
                    >
                      עם קול
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoAudioEnabled(file, false)}
                      className="flex-1 text-xs font-medium py-1.5 transition-colors"
                      style={{
                        background: !videoHasAudio ? 'var(--primary)' : 'var(--surface)',
                        color: !videoHasAudio ? '#fff' : 'var(--ink-soft)',
                      }}
                    >
                      בלי קול
                    </button>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gift: BuyMe link + gift card details */}
      <div
        className="p-6 rounded-xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
      >
        <div className="flex items-start gap-2 mb-4">
          <span style={{ color: 'var(--primary)' }}>
            <Icon name="gift" size={18} />
          </span>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--ink)' }}>
              המתנה עצמה (לא חובה)
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
              הפרטים שתמלאו כאן יוסתרו מאחורי כרטיס גירוד — הנמען יגרד ויגלה
              אותם בעצמו, בדיוק כמו בלוטו
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="buyme-link" className="field-label">
              קישור למתנה ב־BuyMe
            </label>
            <input
              id="buyme-link"
              type="url"
              value={state.buyMeLink}
              onChange={(e) => updateState({ buyMeLink: e.target.value })}
              placeholder="https://buyme.co.il/..."
              className="input-field"
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>

          <div>
            <label htmlFor="gc-company" className="field-label">
              איזה כרטיס מתנה (שם / חברה)
            </label>
            <input
              id="gc-company"
              type="text"
              value={state.giftCard?.company || ''}
              onChange={(e) =>
                updateState({ giftCard: { ...state.giftCard, company: e.target.value } })
              }
              placeholder="לדוגמה: BuyMe, Google Play, Zara"
              className="input-field"
            />
          </div>

          <div>
            <p className="field-label">איך תרצו למלא את פרטי הכרטיס</p>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {[
                { value: 'manual', label: 'הקלדת הפרטים' },
                { value: 'image', label: 'העלאת תמונת הכרטיס' },
              ].map((opt) => {
                const isSelected = (state.giftCard?.inputMode || 'manual') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      updateState({ giftCard: { ...state.giftCard, inputMode: opt.value } })
                    }
                    className="flex-1 text-sm font-medium py-2.5 transition-colors"
                    style={{
                      background: isSelected ? 'var(--primary)' : 'var(--surface)',
                      color: isSelected ? '#fff' : 'var(--ink-soft)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(state.giftCard?.inputMode || 'manual') === 'manual' ? (
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="gc-number" className="field-label">
                  מספר כרטיס
                </label>
                <input
                  id="gc-number"
                  type="text"
                  value={state.giftCard?.number || ''}
                  onChange={(e) =>
                    updateState({
                      giftCard: { ...state.giftCard, number: formatCardNumber(e.target.value) },
                    })
                  }
                  placeholder="9354-4482-2297"
                  className="input-field"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>

              <div>
                <label htmlFor="gc-date" className="field-label">
                  תוקף
                </label>
                <input
                  id="gc-date"
                  type="text"
                  inputMode="numeric"
                  value={state.giftCard?.date || ''}
                  onChange={(e) =>
                    updateState({
                      giftCard: { ...state.giftCard, date: formatCardDate(e.target.value) },
                    })
                  }
                  placeholder="12/2027"
                  className="input-field"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  maxLength={7}
                />
              </div>

              <div>
                <label htmlFor="gc-code" className="field-label">
                  קוד מימוש
                </label>
                <input
                  id="gc-code"
                  type="text"
                  value={state.giftCard?.code || ''}
                  onChange={(e) =>
                    updateState({ giftCard: { ...state.giftCard, code: e.target.value } })
                  }
                  placeholder="ABC-123"
                  className="input-field"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>
          ) : (
            <div>
              <div
                className="border-2 border-dashed rounded-xl p-6 text-center transition-colors hover:border-[var(--primary)]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGiftCardImageUpload}
                  disabled={uploadingGiftCard}
                  className="hidden"
                  id="gift-card-upload"
                />
                <label
                  htmlFor="gift-card-upload"
                  className={uploadingGiftCard ? 'block cursor-wait' : 'cursor-pointer block'}
                >
                  <span
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full mb-2"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    <Icon name={uploadingGiftCard ? 'refresh' : 'camera'} size={20} className={uploadingGiftCard ? 'animate-spin' : ''} />
                  </span>
                  <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                    {uploadingGiftCard ? 'מעלים...' : 'העלו תמונה של הכרטיס'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
                    אפשר להוסיף כמה תמונות (למשל צד קדמי וצד אחורי)
                  </p>
                </label>
              </div>

              {giftCardUploadError && (
                <div
                  className="mt-3 p-3 rounded-xl border text-sm text-center"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  role="alert"
                >
                  {giftCardUploadError}
                </div>
              )}

              {(state.giftCard?.images || []).length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {state.giftCard.images.map((img: string) => (
                    <div
                      key={img}
                      className="relative aspect-square rounded-xl overflow-hidden border"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <img src={img} alt="תמונת כרטיס המתנה" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGiftCardImage(img)}
                        title="מחיקת התמונה"
                        aria-label="מחיקת התמונה"
                        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--danger)' }}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio Selection */}
      <div>
        <h3 className="field-label flex items-center gap-2 text-base">
          <Icon name="music" size={18} />
          בחרו מוזיקת רקע
        </h3>

        {loading ? (
          <p style={{ color: 'var(--ink-soft)' }}>טוענים את ספריית המוזיקה...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        ) : (
          <>
            {/* Category Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {AUDIO_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    previewAudioRef.current?.pause();
                    setPreviewingPath(null);
                    setSelectedCategory(cat.id);
                  }}
                  className={`chip text-sm !py-2 ${selectedCategory === cat.id ? 'chip-selected' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Audio Files List */}
            {audioFiles[selectedCategory]?.length ? (
              <div className="space-y-2">
                {audioFiles[selectedCategory].map((file: AudioFile) => {
                  const isSelected = state.audioTrack === file.path;
                  const isPreviewing = previewingPath === file.path;
                  return (
                    <div
                      key={file.path}
                      className="w-full p-2 rounded-xl border transition-all flex items-center gap-2"
                      style={{
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        background: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
                      }}
                    >
                      <button
                        onClick={() => togglePreview(file.path)}
                        aria-label={isPreviewing ? `עצירת האזנה ל-${file.name}` : `האזנה ל-${file.name}`}
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          background: isPreviewing ? 'var(--primary)' : 'var(--primary-soft)',
                          color: isPreviewing ? '#fff' : 'var(--primary)',
                        }}
                      >
                        <Icon name={isPreviewing ? 'pause' : 'play'} size={16} />
                      </button>

                      <button
                        onClick={() => updateState({ audioTrack: file.path })}
                        className="flex-1 text-right p-1 flex items-center gap-3"
                      >
                        <span className="font-medium" style={{ color: 'var(--ink)' }}>
                          {file.name}
                        </span>
                      </button>

                      {isSelected && (
                        <span className="flex-shrink-0 pl-1" style={{ color: 'var(--primary)' }}>
                          <Icon name="check-circle" size={18} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--ink-soft)' }}>
                אין כרגע שירים בקטגוריה הזו
              </p>
            )}
          </>
        )}

        {/* Custom Upload */}
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="field-label">רוצים שיר משלכם? העלו קובץ MP3</p>
          <input
            type="file"
            accept="audio/mpeg"
            onChange={handleAudioUpload}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="cursor-pointer inline-block">
            <span className="btn-ghost !py-2 !px-4 text-sm">
              <Icon name="upload" size={16} />
              העלאת MP3
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
