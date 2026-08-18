'use client';

import { useState } from 'react';
import { TEMPLATE_LIST, getTemplate } from '@/lib/v2/templates';
import { GreetingContent, MediaItem, TemplateId } from '@/lib/v2/types';
import { PREMIUM_PRICE_ILS, maxImagesFor } from '@/lib/v2/plan';
import MediaUploader from './MediaUploader';
import MusicPicker from './MusicPicker';

type Tab = 'text' | 'images' | 'music' | 'design';

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'text', emoji: '✏️', label: 'טקסט' },
  { id: 'images', emoji: '🖼️', label: 'תמונות' },
  { id: 'music', emoji: '🎵', label: 'מוזיקה' },
  { id: 'design', emoji: '🎨', label: 'עיצוב' },
];

export interface EditorState {
  content: GreetingContent;
  templateId: TemplateId;
  media: MediaItem[];
  musicTrack: string;
  musicEnabled: boolean;
}

interface Props {
  draftId: string;
  state: EditorState;
  premium: boolean;
  onChange: (patch: Partial<EditorState>) => void;
  onPreview: () => void;
  onPublish: () => void;
  publishing: boolean;
  onPremiumClick: () => void;
}

export default function Editor({
  draftId,
  state,
  premium,
  onChange,
  onPreview,
  onPublish,
  publishing,
  onPremiumClick,
}: Props) {
  const [tab, setTab] = useState<Tab>('text');
  const content = state.content;

  const patchContent = (patch: Partial<GreetingContent>) =>
    onChange({ content: { ...content, ...patch } });

  const patchSection = (index: number, body: string) =>
    patchContent({
      sections: content.sections.map((s, i) => (i === index ? { ...s, body } : s)),
    });

  const patchMessage = (index: number, text: string) =>
    patchContent({
      messages: (content.messages ?? []).map((m, i) => (i === index ? text : m)),
    });

  return (
    <div>
      <h1
        className="font-extrabold text-center mb-2"
        style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--v2-ink)' }}
      >
        🎉 ההפתעה מוכנה!
      </h1>
      <p className="text-center mb-6" style={{ color: 'var(--v2-ink-soft)' }}>
        אפשר לשלוח כמו שזה, או לערוך כל דבר
      </p>

      {/* Sticky action bar — the two things that matter are always reachable */}
      <div className="flex gap-3 mb-6">
        <button type="button" onClick={onPreview} className="v2-btn v2-btn-ghost flex-1">
          👀 תצוגה מקדימה
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="v2-btn v2-btn-primary flex-1"
        >
          {publishing ? 'מכינים…' : '🔗 קבלו לינק'}
        </button>
      </div>

      <div
        className="flex gap-1.5 p-1.5 rounded-2xl mb-5 overflow-x-auto"
        style={{ background: 'var(--v2-accent-soft)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="flex-1 min-w-fit px-3 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors"
            style={{
              background: tab === t.id ? 'var(--v2-surface)' : 'transparent',
              color: tab === t.id ? 'var(--v2-ink)' : 'var(--v2-ink-soft)',
              boxShadow: tab === t.id ? '0 4px 14px -8px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- Text ---------------- */}
      {tab === 'text' && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="v2-label" htmlFor="v2-ed-title">
              כותרת
            </label>
            <input
              id="v2-ed-title"
              className="v2-field font-bold"
              value={content.title}
              onChange={(e) => patchContent({ title: e.target.value })}
              maxLength={80}
            />
          </div>

          <div>
            <label className="v2-label" htmlFor="v2-ed-intro">
              פתיחה
            </label>
            <textarea
              id="v2-ed-intro"
              className="v2-field resize-none"
              rows={3}
              value={content.intro}
              onChange={(e) => patchContent({ intro: e.target.value })}
              maxLength={400}
            />
          </div>

          {content.sections.map((section, i) => (
            <div key={i}>
              <label className="v2-label" htmlFor={`v2-ed-sec-${i}`}>
                {section.heading || `פסקה ${i + 1}`}
              </label>
              <textarea
                id={`v2-ed-sec-${i}`}
                className="v2-field resize-none"
                rows={4}
                value={section.body}
                onChange={(e) => patchSection(i, e.target.value)}
                maxLength={600}
              />
            </div>
          ))}

          {(content.messages ?? []).length > 0 && (
            <div>
              <span className="v2-label">משפטים קצרים</span>
              <div className="flex flex-col gap-2">
                {(content.messages ?? []).map((message, i) => (
                  <input
                    key={i}
                    className="v2-field"
                    value={message}
                    onChange={(e) => patchMessage(i, e.target.value)}
                    maxLength={180}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="v2-label" htmlFor="v2-ed-closing">
              סיום
            </label>
            <textarea
              id="v2-ed-closing"
              className="v2-field resize-none"
              rows={3}
              value={content.closing}
              onChange={(e) => patchContent({ closing: e.target.value })}
              maxLength={300}
            />
          </div>

          <div>
            <label className="v2-label" htmlFor="v2-ed-surprise">
              🎁 ההפתעה הנוספת
            </label>
            <p className="v2-hint">מוסתר מאחורי כפתור &quot;יש עוד משהו…&quot;</p>
            <textarea
              id="v2-ed-surprise"
              className="v2-field resize-none"
              rows={3}
              value={content.surprise ?? ''}
              onChange={(e) => patchContent({ surprise: e.target.value })}
              maxLength={400}
            />
          </div>
        </div>
      )}

      {/* ---------------- Images ---------------- */}
      {tab === 'images' && (
        <MediaUploader
          draftId={draftId}
          media={state.media}
          maxImages={maxImagesFor(premium ? 'premium' : 'free')}
          allowVideo={premium}
          onChange={(media) => onChange({ media })}
        />
      )}

      {/* ---------------- Music ---------------- */}
      {tab === 'music' && (
        <MusicPicker
          value={state.musicTrack}
          enabled={state.musicEnabled}
          premium={premium}
          suggestedMood={content.musicMood}
          onChange={(musicTrack) => onChange({ musicTrack })}
          onToggle={(musicEnabled) => onChange({ musicEnabled })}
          onPremiumClick={onPremiumClick}
        />
      )}

      {/* ---------------- Design ---------------- */}
      {tab === 'design' && (
        <div>
          <p className="v2-hint mb-4">
            כל סגנון משנה את כל החוויה — לא רק את הצבעים
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEMPLATE_LIST.map((t) => {
              const locked = t.premium && !premium;
              const selected = state.templateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => (locked ? onPremiumClick() : onChange({ templateId: t.id }))}
                  className="rounded-2xl overflow-hidden text-start transition-transform hover:-translate-y-1"
                  style={{
                    border: selected
                      ? '2.5px solid var(--v2-accent)'
                      : '1.5px solid var(--v2-surface-border)',
                    boxShadow: selected ? '0 0 0 4px var(--v2-accent-soft)' : 'none',
                    opacity: locked ? 0.65 : 1,
                  }}
                >
                  <div
                    className="h-20 flex items-center justify-center text-3xl relative"
                    style={{ background: t.preview.gradient }}
                  >
                    {t.preview.emoji}
                    {locked && (
                      <span
                        className="absolute bottom-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                      >
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <div className="p-2.5" style={{ background: 'var(--v2-surface)' }}>
                    <p className="font-bold text-xs" style={{ color: 'var(--v2-ink)' }}>
                      {t.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {!premium && (
            <button
              type="button"
              onClick={onPremiumClick}
              className="mt-5 w-full rounded-2xl px-5 py-4 text-start"
              style={{
                background: 'linear-gradient(135deg, #e8365d 0%, #b5179e 100%)',
                color: '#fff',
              }}
            >
              <p className="font-extrabold mb-1">✨ שדרגו לפרימיום</p>
              <p className="text-sm opacity-90">
                כל הסגנונות, ללא מיתוג, יותר תמונות, וידאו ומוזיקה נוספת — מ-
                {PREMIUM_PRICE_ILS.toFixed(2)} ₪
              </p>
            </button>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs" style={{ color: 'var(--v2-ink-soft)' }}>
        סגנון נוכחי: {getTemplate(state.templateId).label}
      </p>
    </div>
  );
}
