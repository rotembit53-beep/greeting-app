'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_TEMPLATE, getTemplate } from '@/lib/v2/templates';
import { defaultTrackForMood, trackUrl } from '@/lib/v2/music';
import { track } from '@/lib/v2/analytics';
import { Gift } from '@/lib/v2/gifts';
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
import GiftStep from './GiftStep';
import Stepper, { FlowStage } from './Stepper';

type Stage = FlowStage;

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
  const [gift, setGift] = useState<Gift | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ slug: string; id?: string } | null>(null);

  // A stable id for this draft, used as the R2 upload folder before the
  // greeting itself exists. Held in state, not a ref: it is read during
  // render (passed to the editor), and lazily mutating a ref mid-render can
  // leave the tree rendering a stale value.
  const [draftId, setDraftId] = useState<string>(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : ''
  );

  // Premium is scaffolding only for now — no payment provider is wired up
  // yet, so every draft is on the free plan and the gates simply prompt.
  const premium = false;

  useEffect(() => {
    track('started_creating');
  }, []);

  /* -------- Restore an in-progress draft (survives a refresh) --------
   * This has to be an effect: localStorage doesn't exist during SSR, so
   * restoring in a lazy useState initialiser would make the server and
   * client render different trees and break hydration. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      /* eslint-disable react-hooks/set-state-in-effect --
         These run once on mount and React batches them into a single
         re-render, so there is no cascade. The rule's suggested fix (a lazy
         initialiser) is not available here: localStorage doesn't exist
         during SSR, so seeding state from it would desync hydration. */
      if (parsed?.eventType) setEventType(parsed.eventType);
      if (parsed?.details) setDetails({ ...emptyDetails, ...parsed.details });
      if (parsed?.draftId) setDraftId(parsed.draftId);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // Corrupt draft — start clean.
    }
  }, []);

  useEffect(() => {
    if (stage === 'share') return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ eventType, details, draftId })
      );
    } catch {
      // Storage full / disabled — the flow still works, just not resumable.
    }
  }, [eventType, details, stage, draftId]);

  /** Jumps back to an earlier, already-completed step. Never skips ahead —
   * the Stepper only makes past steps clickable in the first place, but this
   * guard makes that a real invariant rather than trusting the caller. */
  const goToStage = (target: FlowStage) => {
    const reachedEditor = Boolean(editor);
    if (target === 'editor' && !reachedEditor) return;
    if (target === 'gift' && !reachedEditor) return;
    setGenError(null);
    setStage(target);
  };

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
        coverMediaId: '',
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
          coverMediaId: editor.coverMediaId,
          gift,
          giftInterests: [],
          giftBudget: '',
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
      coverMediaId: editor.coverMediaId,
      gift,
      plan: premium ? 'premium' : 'free',
      status: 'draft',
      allowContributions: false,
      viewCount: 0,
      openCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }, [editor, eventType, details, premium, gift]);

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
    <div className="v2-scope v2-studio v2-shell">
      <header className="v2-container pt-6 pb-3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="v2-display"
            style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--v2-ink)', direction: 'ltr' }}
          >
            Intera<span className="v2-logo-gi">gift</span>
          </Link>
          {details.recipientName && stage !== 'event' && stage !== 'share' && (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full hidden sm:inline-block"
              style={{ background: 'var(--v2-surface)', border: '1px solid var(--v2-surface-border)', color: 'var(--v2-ink-soft)' }}
            >
              {eventType ? `${EVENT_BY_ID[eventType]?.emoji} ` : ''}
              עבור {details.recipientName}
            </span>
          )}
        </div>

        <Stepper stage={stage} onGoTo={goToStage} />
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
              draftId={draftId}
              state={editor}
              premium={premium}
              onChange={(patch) => setEditor((s) => (s ? { ...s, ...patch } : s))}
              onPreview={() => setStage('preview')}
              onPublish={() => setStage('gift')}
              publishing={publishing}
              onPremiumClick={() => track('premium_click', { props: { from: 'editor' } })}
            />
          </>
        )}

        {stage === 'gift' && (
          <GiftStep
            recipientName={details.recipientName}
            aboutThem={details.aboutThem}
            sharedMemory={details.sharedMemory}
            gift={gift}
            onChange={setGift}
            onDone={() => void publish()}
            onSkip={() => {
              setGift(null);
              void publish();
            }}
          />
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
