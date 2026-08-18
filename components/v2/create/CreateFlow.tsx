'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_TEMPLATE, getTemplate } from '@/lib/v2/templates';
import { defaultTrackForMood, trackUrl } from '@/lib/v2/music';
import { track } from '@/lib/v2/analytics';
import {
  EVENT_BY_ID,
  EventType,
  GreetingContent,
  MediaItem,
  TemplateId,
  toPublicGreeting,
} from '@/lib/v2/types';
import GreetingExperience from '@/components/v2/experience/GreetingExperience';
import EventPicker from './EventPicker';
import DetailsForm, { DetailsValue } from './DetailsForm';
import Generating from './Generating';
import Editor, { EditorState } from './Editor';
import SharePanel from './SharePanel';

type Stage = 'event' | 'details' | 'generating' | 'editor' | 'preview' | 'share';

const DRAFT_KEY = 'interagift-v2-draft';

const ERROR_MESSAGES: Record<string, string> = {
  AI_UNAVAILABLE: 'השירות עמוס כרגע — נסו שוב בעוד רגע',
  AI_NOT_CONFIGURED: 'שירות היצירה אינו זמין כרגע',
  AI_INVALID_RESPONSE: 'משהו יצא לא תקין — נסו שוב',
  VALIDATION_ERROR: 'חסרים פרטים — בדקו ונסו שוב',
};

const emptyDetails: DetailsValue = {
  recipientName: '',
  relationship: '',
  recipientAge: '',
  aboutThem: '',
  sharedMemory: '',
  senderName: '',
  tone: 'warm',
};

export default function CreateFlow() {
  const [stage, setStage] = useState<Stage>('event');
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [details, setDetails] = useState<DetailsValue>(emptyDetails);
  const [formError, setFormError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GreetingContent | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ slug: string; id?: string } | null>(null);

  // A stable id for this draft, used as the R2 upload folder before the
  // greeting itself exists.
  const draftIdRef = useRef<string>('');
  if (!draftIdRef.current && typeof crypto !== 'undefined') {
    draftIdRef.current = crypto.randomUUID();
  }

  // Premium is scaffolding only for now — no payment provider is wired up
  // yet, so every draft is on the free plan and the gates simply prompt.
  const premium = false;

  useEffect(() => {
    track('started_creating');
  }, []);

  /* -------- Restore an in-progress draft (survives a refresh) -------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.eventType) setEventType(parsed.eventType);
      if (parsed?.details) setDetails({ ...emptyDetails, ...parsed.details });
      if (parsed?.draftId) draftIdRef.current = parsed.draftId;
    } catch {
      // Corrupt draft — start clean.
    }
  }, []);

  useEffect(() => {
    if (stage === 'share') return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ eventType, details, draftId: draftIdRef.current })
      );
    } catch {
      // Storage full / disabled — the flow still works, just not resumable.
    }
  }, [eventType, details, stage]);

  /* ---------------- Generation ---------------- */

  const runGeneration = async () => {
    if (!eventType) return;
    setGenError(null);
    setStage('generating');
    setGenerated(null);

    const startedAt = Date.now();

    try {
      const res = await fetch('/api/v2/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          recipientName: details.recipientName,
          relationship: details.relationship,
          recipientAge: details.recipientAge,
          aboutThem: details.aboutThem,
          sharedMemory: details.sharedMemory,
          senderName: details.senderName,
          tone: details.tone,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        content?: GreetingContent;
        errorCode?: string;
      } | null;

      if (!res.ok || !data?.content) {
        throw new Error(
          (data?.errorCode && ERROR_MESSAGES[data.errorCode]) ?? 'משהו השתבש — נסו שוב'
        );
      }

      const content = data.content;

      // Let the "building your surprise" animation breathe — cutting it off
      // after 400ms makes the product feel cheaper than it is.
      const elapsed = Date.now() - startedAt;
      if (elapsed < 3800) {
        await new Promise((r) => setTimeout(r, 3800 - elapsed));
      }

      const templateId: TemplateId =
        content.template ?? EVENT_BY_ID[eventType]?.defaultTemplate ?? DEFAULT_TEMPLATE;
      const suggested = defaultTrackForMood(
        content.musicMood ?? getTemplate(templateId).musicMood
      );

      setGenerated(content);
      setEditor({
        content,
        templateId,
        media: [],
        musicTrack: suggested ? trackUrl(suggested) : '',
        musicEnabled: true,
      });

      track('generated_greeting', { props: { eventType, templateId } });

      // Brief beat on "ההפתעה מוכנה!" before the editor appears.
      await new Promise((r) => setTimeout(r, 700));
      setStage('editor');
      track('opened_editor');
    } catch (error) {
      setGenError(error instanceof Error ? error.message : 'משהו השתבש — נסו שוב');
    }
  };

  /* ---------------- Publish ---------------- */

  const publish = async () => {
    if (!editor || !eventType) return;
    setPublishing(true);

    try {
      const res = await fetch('/api/v2/greetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          recipientName: details.recipientName,
          relationship: details.relationship,
          recipientAge: details.recipientAge,
          aboutThem: details.aboutThem,
          sharedMemory: details.sharedMemory,
          senderName: details.senderName,
          tone: details.tone,
          content: editor.content,
          templateId: editor.templateId,
          musicTrack: editor.musicTrack,
          musicEnabled: editor.musicEnabled,
          media: editor.media,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        slug?: string;
        ownerToken?: string;
      } | null;
      if (!res.ok || !data?.slug) throw new Error('failed');

      // Kept so the creator can re-open their own editor later without login.
      try {
        localStorage.setItem(`interagift-v2-owner-${data.slug}`, data.ownerToken ?? '');
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Non-fatal.
      }

      setPublished({ slug: data.slug });
      setStage('share');
      track('greeting_published', { slug: data.slug });
    } catch {
      setGenError('לא הצלחנו לשמור את ההפתעה — נסו שוב');
    } finally {
      setPublishing(false);
    }
  };

  /* ---------------- Preview ---------------- */

  const previewGreeting = useMemo(() => {
    if (!editor || !eventType) return null;
    const now = new Date().toISOString();
    return toPublicGreeting({
      id: 'preview',
      slug: 'preview',
      ownerToken: '',
      eventType,
      recipientName: details.recipientName || 'שם',
      relationship: details.relationship,
      recipientAge: details.recipientAge,
      aboutThem: details.aboutThem,
      sharedMemory: details.sharedMemory,
      senderName: details.senderName,
      tone: details.tone,
      content: editor.content,
      templateId: editor.templateId,
      musicTrack: editor.musicTrack,
      musicEnabled: editor.musicEnabled,
      media: editor.media,
      plan: premium ? 'premium' : 'free',
      status: 'draft',
      allowContributions: false,
      viewCount: 0,
      openCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }, [editor, eventType, details, premium]);

  /* ---------------- Preview takes over the screen ---------------- */

  if (stage === 'preview' && previewGreeting) {
    return (
      <div className="relative">
        <GreetingExperience greeting={previewGreeting} preview />
        <button
          type="button"
          onClick={() => setStage('editor')}
          className="fixed z-[60] v2-btn"
          style={{
            top: '1rem',
            insetInlineStart: '1rem',
            background: '#fff',
            color: '#111',
            padding: '0.65rem 1.1rem',
            boxShadow: '0 10px 30px -12px rgba(0,0,0,0.6)',
          }}
        >
          ← חזרה לעריכה
        </button>
      </div>
    );
  }

  /* ---------------- Shell ---------------- */

  const canContinueFromDetails = details.recipientName.trim().length > 0;

  return (
    <div
      className="v2-scope v2-shell"
      style={{
        background:
          'radial-gradient(circle at 12% -5%, #ffe9d6 0%, #ffe2ea 40%, #f3e8ff 100%)',
        ['--v2-ink' as string]: '#241019',
        ['--v2-ink-soft' as string]: '#6d5560',
        ['--v2-accent' as string]: '#e8365d',
        ['--v2-accent-soft' as string]: 'rgba(232, 54, 93, 0.12)',
        ['--v2-surface' as string]: '#ffffff',
        ['--v2-surface-border' as string]: 'rgba(36, 16, 25, 0.1)',
        ['--v2-glow' as string]: 'rgba(232, 54, 93, 0.35)',
        ['--v2-on-accent' as string]: '#ffffff',
      }}
    >
      <header className="v2-container pt-7 pb-2 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-lg" style={{ color: 'var(--v2-ink)' }}>
          Intera<span style={{ color: 'var(--v2-accent)' }}>gift</span>
        </Link>

        {stage !== 'share' && (
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {(['event', 'details', 'editor'] as const).map((s, i) => {
              const order = { event: 0, details: 1, generating: 2, editor: 2, preview: 2, share: 3 };
              const active = order[stage] >= i;
              return (
                <span
                  key={s}
                  className="rounded-full transition-all"
                  style={{
                    width: active ? 26 : 8,
                    height: 8,
                    background: active ? 'var(--v2-accent)' : 'var(--v2-surface-border)',
                  }}
                />
              );
            })}
          </div>
        )}
      </header>

      <main className="v2-container py-8 pb-24">
        {stage === 'event' && (
          <>
            <EventPicker
              value={eventType}
              onSelect={(e) => {
                setEventType(e);
                track('event_selected', { props: { eventType: e } });
                setStage('details');
              }}
            />
          </>
        )}

        {stage === 'details' && (
          <>
            <DetailsForm
              value={details}
              onChange={(patch) => {
                setDetails((d) => ({ ...d, ...patch }));
                setFormError(null);
              }}
              error={formError}
            />

            <div className="flex gap-3 mt-10">
              <button
                type="button"
                onClick={() => setStage('event')}
                className="v2-btn v2-btn-ghost"
              >
                חזרה
              </button>
              <button
                type="button"
                className="v2-btn v2-btn-primary flex-1 text-lg"
                onClick={() => {
                  if (!canContinueFromDetails) {
                    setFormError('צריך לפחות שם — למי ההפתעה?');
                    return;
                  }
                  track('completed_details');
                  void runGeneration();
                }}
              >
                ✨ צור לי את ההפתעה
              </button>
            </div>
          </>
        )}

        {stage === 'generating' && (
          <Generating
            done={Boolean(generated)}
            error={genError}
            onRetry={() => void runGeneration()}
          />
        )}

        {stage === 'editor' && editor && (
          <>
            {genError && (
              <div
                className="mb-5 rounded-2xl px-4 py-3 text-sm font-semibold text-center"
                style={{ background: 'rgba(214,58,46,0.1)', color: '#c62828' }}
                role="alert"
              >
                {genError}
              </div>
            )}
            <Editor
              draftId={draftIdRef.current}
              state={editor}
              premium={premium}
              onChange={(patch) => setEditor((s) => (s ? { ...s, ...patch } : s))}
              onPreview={() => setStage('preview')}
              onPublish={() => void publish()}
              publishing={publishing}
              onPremiumClick={() => track('premium_click', { props: { from: 'editor' } })}
            />
          </>
        )}

        {stage === 'share' && published && (
          <SharePanel
            slug={published.slug}
            recipientName={details.recipientName}
            greetingId={published.id}
          />
        )}
      </main>
    </div>
  );
}
