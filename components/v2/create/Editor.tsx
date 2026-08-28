'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getTemplate } from '@/lib/v2/templates';
import {
  GreetingContent,
  MediaItem,
  OptionalPart,
  TemplateId,
} from '@/lib/v2/types';
import { maxImagesFor } from '@/lib/v2/plan';
import MediaUploader from './MediaUploader';
import MusicPicker from './MusicPicker';
import StyleGallery from '@/components/v2/style/StyleGallery';
import PartToggle from './PartToggle';
import BackButton from '@/components/v2/BackButton';

gsap.registerPlugin(useGSAP);

type Tab = 'text' | 'images' | 'music' | 'design';

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'text', emoji: '✏️', label: 'טקסט' },
  { id: 'images', emoji: '🖼️', label: 'תמונות' },
  { id: 'music', emoji: '🎵', label: 'מוזיקה' },
  { id: 'design', emoji: '🎨', label: 'עיצוב' },
];

/**
 * What each tab is for, and which control to actually press inside it.
 *
 * The tab bar on its own named four nouns and promised nothing — a sender
 * landing here couldn't tell what waited behind a tab, whether any of it was
 * required, or how to move on. Each panel now opens with its own short
 * "what to do here" list, keyed to the open tab.
 */
const TAB_GUIDE: Record<Tab, { title: string; steps: string[] }> = {
  text: {
    title: 'מה עושים כאן?',
    steps: [
      'לוחצים על כל תיבת טקסט ומשנים מה שרוצים — הכול נשמר לבד.',
      'מבטלים את הסימון ✓ שליד חלק כדי שלא יופיע בברכה.',
      'רוצים נוסח אחר לגמרי? לוחצים על “🔄 טקסט חדש עם AI”.',
    ],
  },
  images: {
    title: 'מה עושים כאן?',
    steps: [
      'לוחצים על “הוסיפו תמונות” או גוררים לשם קבצים — אפשר גם סרטון.',
      'בנייד אפשר ללחוץ על “📷 צלמו עכשיו”.',
      'בוחרים תמונת פתיחה — התמונה שתופיע ראשונה, לפני הטקסט.',
      'אפשר גם לדלג — ברכה בלי תמונות עובדת בדיוק אותו דבר.',
    ],
  },
  music: {
    title: 'מה עושים כאן?',
    steps: [
      'הכפתור העליון — “🔊 מוזיקה פועלת” — מדליק ומכבה את המוזיקה.',
      'בוחרים אווירה, ולוחצים ▶ כדי לשמוע שיר.',
      'לחיצה על שם השיר בוחרת אותו — השיר המסומן יתנגן כשהברכה נפתחת.',
    ],
  },
  design: {
    title: 'מה עושים כאן?',
    steps: [
      'לוחצים על סגנון כדי לבחור אותו — הבחירה נשמרת מיד.',
      'כל סגנון משנה צבעים, גופנים ותנועה — לא רק את הצבעים.',
    ],
  },
};

export interface EditorState {
  content: GreetingContent;
  templateId: TemplateId;
  media: MediaItem[];
  /** id of the media item used as the opening image. */
  coverMediaId: string;
  musicTrack: string;
  musicEnabled: boolean;
}

interface Props {
  draftId: string;
  state: EditorState;
  onChange: (patch: Partial<EditorState>) => void;
  onBack: () => void;
  onContinue: () => void;
  onRegenerate: () => void;
  publishing: boolean;
}

export default function Editor({
  draftId,
  state,
  onChange,
  onBack,
  onContinue,
  onRegenerate,
  publishing,
}: Props) {
  const [tab, setTab] = useState<Tab>('text');
  const content = state.content;
  const actionsRef = useRef<HTMLDivElement>(null);

  // A tactile lift on hover for the button that moves the flow forward, with
  // the arrow stepping ahead of it — GSAP-driven (per project convention)
  // rather than a CSS :hover, so it can be killed cleanly and skipped for
  // reduced motion.
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const buttons =
        actionsRef.current?.querySelectorAll<HTMLButtonElement>('[data-hover-lift]');
      if (!buttons?.length) return;

      const cleanups: (() => void)[] = [];
      buttons.forEach((btn) => {
        const arrow = btn.querySelector('.ed-next-arrow');
        const enter = () => {
          if (btn.disabled) return;
          gsap.to(btn, { y: -3, scale: 1.035, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
          // Forward is leftwards in RTL.
          if (arrow) gsap.to(arrow, { x: -5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        };
        const leave = () => {
          gsap.to(btn, { y: 0, scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
          if (arrow) gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        };
        btn.addEventListener('pointerenter', enter);
        btn.addEventListener('pointerleave', leave);
        cleanups.push(() => {
          btn.removeEventListener('pointerenter', enter);
          btn.removeEventListener('pointerleave', leave);
        });
      });

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: actionsRef }
  );

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

  /* Which parts make it into the greeting. Stored as the list of parts left
   * OUT, so anything written before this existed — and anything the AI adds
   * later — is included by default. */
  const hiddenParts = content.hiddenParts ?? [];
  const includes = (part: OptionalPart) => !hiddenParts.includes(part);
  const setIncluded = (part: OptionalPart, included: boolean) =>
    patchContent({
      hiddenParts: included
        ? hiddenParts.filter((p) => p !== part)
        : [...hiddenParts, part],
    });

  const setSectionIncluded = (index: number, included: boolean) =>
    patchContent({
      sections: content.sections.map((section, i) =>
        i === index ? { ...section, hidden: !included } : section
      ),
    });

  const includedCount =
    1 + // the title always ships
    content.sections.filter((section) => !section.hidden).length +
    (['intro', 'messages', 'closing', 'surprise'] as OptionalPart[]).filter(
      (part) =>
        includes(part) &&
        (part === 'messages'
          ? (content.messages ?? []).length > 0
          : Boolean(content[part]))
    ).length;

  return (
    <div>
      <h1
        className="font-extrabold text-center mb-2"
        style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--v2-ink)' }}
      >
        🎉 ההפתעה מוכנה!
      </h1>
      <p className="ed-lede">
        ה-AI כתב לכם את הברכה. אפשר להמשיך כמו שהיא — או לערוך כל דבר בארבע
        הלשוניות שלמטה: <strong>טקסט, תמונות, מוזיקה ועיצוב</strong>. כשמסיימים,
        לוחצים על <strong>“הבא”</strong> בתחתית העמוד.
      </p>

      <p className="ed-tabs-lead">בחרו מה לערוך:</p>
      <div
        role="tablist"
        aria-label="מה לערוך בברכה"
        className="flex gap-1.5 p-1.5 rounded-2xl mb-4 overflow-x-auto"
        style={{ background: 'var(--v2-accent-soft)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`v2-ed-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="v2-ed-panel"
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

      {/* The open tab's own instructions — what this panel is for and which
        * control to press in it. */}
      <div className="ed-guide">
        <p className="ed-guide-title">
          {TABS.find((t) => t.id === tab)?.emoji} {TAB_GUIDE[tab].title}
        </p>
        <ul className="ed-guide-list">
          {TAB_GUIDE[tab].steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <div id="v2-ed-panel" role="tabpanel" aria-labelledby={`v2-ed-tab-${tab}`}>
      {/* ---------------- Text ----------------
        * Every block is opt-out. The AI writes the full set, and a sender who
        * only wants a title and one paragraph unchecks the rest instead of
        * emptying fields — which would have failed validation anyway, since
        * intro and closing are required strings in the schema. */}
      {tab === 'text' && (
        <div className="flex flex-col gap-5">
          <p className="ed-parts-note">
            נכון לעכשיו{' '}
            <strong style={{ color: 'var(--v2-ink)' }}>
              {includedCount === 1 ? 'חלק אחד ייכלל' : `${includedCount} חלקים ייכללו`}
            </strong>{' '}
            בברכה. מה שלא מסומן פשוט לא יופיע — והטקסט נשמר למקרה שתתחרטו.
          </p>

          <div className="flex justify-start">
            <button
              type="button"
              className="v2-btn v2-btn-ghost text-sm"
              onClick={() => {
                if (
                  window.confirm(
                    'זה יכתוב טקסט חדש לגמרי ויחליף את מה שיש כאן עכשיו, כולל עריכות שעשיתם. להמשיך?'
                  )
                ) {
                  onRegenerate();
                }
              }}
            >
              🔄 טקסט חדש עם AI
            </button>
          </div>

          <div>
            <label className="v2-label" htmlFor="v2-ed-title">
              כותרת <span className="ed-part-required">תמיד נכללת</span>
            </label>
            <input
              id="v2-ed-title"
              className="v2-field font-bold"
              dir="rtl"
              value={content.title}
              onChange={(e) => patchContent({ title: e.target.value })}
              maxLength={80}
            />
          </div>

          <PartToggle
            id="v2-ed-inc-intro"
            label="פתיחה"
            included={includes('intro')}
            onToggle={(on) => setIncluded('intro', on)}
          >
            <textarea
              id="v2-ed-intro"
              className="v2-field resize-none"
              dir="rtl"
              rows={3}
              value={content.intro}
              disabled={!includes('intro')}
              onChange={(e) => patchContent({ intro: e.target.value })}
              maxLength={400}
            />
          </PartToggle>

          {content.sections.map((section, i) => (
            <PartToggle
              key={i}
              id={`v2-ed-inc-sec-${i}`}
              label={section.heading || `פסקה ${i + 1}`}
              included={!section.hidden}
              onToggle={(on) => setSectionIncluded(i, on)}
            >
              <textarea
                id={`v2-ed-sec-${i}`}
                className="v2-field resize-none"
                dir="rtl"
                rows={4}
                value={section.body}
                disabled={Boolean(section.hidden)}
                onChange={(e) => patchSection(i, e.target.value)}
                maxLength={600}
              />
            </PartToggle>
          ))}

          {(content.messages ?? []).length > 0 && (
            <PartToggle
              id="v2-ed-inc-messages"
              label="משפטים קצרים"
              included={includes('messages')}
              onToggle={(on) => setIncluded('messages', on)}
            >
              <div className="flex flex-col gap-2">
                {(content.messages ?? []).map((message, i) => (
                  <input
                    key={i}
                    className="v2-field"
                    dir="rtl"
                    value={message}
                    disabled={!includes('messages')}
                    onChange={(e) => patchMessage(i, e.target.value)}
                    maxLength={180}
                  />
                ))}
              </div>
            </PartToggle>
          )}

          <PartToggle
            id="v2-ed-inc-closing"
            label="סיום"
            included={includes('closing')}
            onToggle={(on) => setIncluded('closing', on)}
          >
            <textarea
              id="v2-ed-closing"
              className="v2-field resize-none"
              dir="rtl"
              rows={3}
              value={content.closing}
              disabled={!includes('closing')}
              onChange={(e) => patchContent({ closing: e.target.value })}
              maxLength={300}
            />
          </PartToggle>

          <PartToggle
            id="v2-ed-inc-surprise"
            label="🎁 ההפתעה הנוספת"
            hint={'מוסתר מאחורי כפתור "יש עוד משהו…"'}
            included={includes('surprise')}
            onToggle={(on) => setIncluded('surprise', on)}
          >
            <textarea
              id="v2-ed-surprise"
              className="v2-field resize-none"
              dir="rtl"
              rows={3}
              value={content.surprise ?? ''}
              disabled={!includes('surprise')}
              onChange={(e) => patchContent({ surprise: e.target.value })}
              maxLength={400}
            />
          </PartToggle>
        </div>
      )}

      {/* ---------------- Images ---------------- */}
      {tab === 'images' && (
        <>
          <MediaUploader
            draftId={draftId}
            media={state.media}
            maxImages={maxImagesFor('free')}
            allowVideo
            onChange={(media) => onChange({ media })}
          />

          {state.media.some((m) => m.type === 'image') && (
            <div className="mt-7">
              <span className="v2-label">תמונת פתיחה</span>
              <p className="v2-hint">התמונה שתופיע ראשונה, לפני הטקסט</p>
              <div className="grid grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => onChange({ coverMediaId: '' })}
                  data-selected={!state.coverMediaId}
                  className="v2-choice !py-4 text-xs font-semibold"
                >
                  ללא
                </button>
                {state.media
                  .filter((m) => m.type === 'image')
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onChange({ coverMediaId: m.id })}
                      className="relative aspect-square rounded-xl overflow-hidden"
                      style={{
                        border:
                          state.coverMediaId === m.id
                            ? '2.5px solid var(--v2-accent)'
                            : '1.5px solid var(--v2-surface-border)',
                      }}
                    >
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------------- Music ---------------- */}
      {tab === 'music' && (
        <MusicPicker
          value={state.musicTrack}
          enabled={state.musicEnabled}
          suggestedMood={content.musicMood}
          onChange={(musicTrack) => onChange({ musicTrack })}
          onToggle={(musicEnabled) => onChange({ musicEnabled })}
        />
      )}

      {/* ---------------- Design ---------------- */}
      {tab === 'design' && (
        <StyleGallery
          value={state.templateId}
          onSelect={(templateId) => onChange({ templateId })}
        />
      )}
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: 'var(--v2-ink-soft)' }}>
        סגנון נוכחי: {getTemplate(state.templateId).label}
      </p>

      {/* The single way forward, at the end of the step rather than above the
        * content it belongs after — a sender scrolls through the tabs and
        * finds it exactly where they finish. */}
      <div ref={actionsRef} className="ed-next">
        <p className="ed-next-note">
          סיימתם לערוך? השלב הבא הוא חוויית הפתיחה, ואחריה המתנה. תמיד אפשר
          לחזור לכאן ולשנות.
        </p>
        <div className="ed-next-row">
          <BackButton onClick={onBack} label="חזרה" />
          <button
            type="button"
            data-hover-lift
            onClick={onContinue}
            disabled={publishing}
            className="v2-btn v2-btn-primary ed-next-btn"
          >
            <span>{publishing ? 'מכינים…' : 'הבא'}</span>
            <span className="ed-next-arrow" aria-hidden="true">
              ←
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
