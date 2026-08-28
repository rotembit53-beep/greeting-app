'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_TEMPLATE, getTemplate } from '@/lib/v2/templates';
import { defaultTrackForMood, trackUrl } from '@/lib/v2/music';
import { track } from '@/lib/v2/analytics';
import { Gift, hasGift } from '@/lib/v2/gifts';
import { OpeningConfig, OpeningPreference } from '@/lib/v2/opening/types';
import {
  EVENT_BY_ID,
  EventType,
  GreetingContent,
  TemplateId,
} from '@/lib/v2/types';
import EventPicker from './EventPicker';
import DetailsForm, { DetailsValue } from './DetailsForm';
import Generating from './Generating';
import Editor, { EditorState } from './Editor';
import SharePanel from './SharePanel';
import GiftStep from './GiftStep';
import OpeningStep from './OpeningStep';
import Stepper, { FlowStage } from './Stepper';
import HomeLink from '@/components/v2/HomeLink';
import BackButton from '@/components/v2/BackButton';

type Stage = FlowStage;

const DRAFT_KEY = 'interagift-v2-draft';

/** Shown when the stepper is used to jump to a step whose own data (text,
 * published link…) doesn't exist yet — a way forward instead of a dead end. */
function EmptyStepPrompt({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2 className="font-extrabold text-xl mb-2" style={{ color: 'var(--v2-ink)' }}>
        {title}
      </h2>
      <p className="mb-7" style={{ color: 'var(--v2-ink-soft)' }}>
        {body}
      </p>
      <button type="button" onClick={onAction} className="v2-btn v2-btn-primary">
        {actionLabel}
      </button>
    </div>
  );
}

/**
 * Bumped whenever the saved shape gains something a restore path depends on.
 * Drafts written by an older version still restore their answers — only the
 * editor half, which is the part that can actually be malformed, is gated on
 * a version match.
 */
const DRAFT_VERSION = 2;

interface SavedDraft {
  v?: number;
  /** `null` while the step hasn't been answered yet — state is written as-is. */
  eventType?: EventType | null;
  details?: Partial<DetailsValue>;
  draftId?: string;
  /** The AI's output plus every edit made on top of it. */
  editor?: EditorState | null;
  gift?: Gift | null;
  openingPref?: OpeningPreference;
  opening?: OpeningConfig | null;
  stage?: FlowStage;
}

/**
 * A restored editor is only worth resuming if the AI content came back
 * intact — the editor renders straight off `content`, so a half-written or
 * hand-mangled draft would take the whole flow down instead of just starting
 * clean.
 */
function isUsableEditor(value: unknown): value is EditorState {
  if (!value || typeof value !== 'object') return false;
  const editor = value as Partial<EditorState>;
  return (
    typeof editor.templateId === 'string' &&
    Boolean(editor.content) &&
    typeof editor.content === 'object' &&
    Array.isArray(editor.media)
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  AI_UNAVAILABLE: 'השירות עמוס כרגע — נסו שוב בעוד רגע',
  AI_NOT_CONFIGURED: 'שירות היצירה אינו זמין כרגע',
  AI_INVALID_RESPONSE: 'משהו יצא לא תקין — נסו שוב',
  VALIDATION_ERROR: 'חסרים פרטים — בדקו ונסו שוב',
};

const emptyDetails: DetailsValue = {
  recipientName: '',
  recipientGender: '',
  relationship: '',
  recipientAge: '',
  aboutThem: '',
  sharedMemory: '',
  senderName: '',
  senderGender: '',
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

  /* The opening experience. `openingPref` is what the creator asked for and
   * `opening` is what the model built from it — kept apart so switching the
   * preference can re-run generation without losing the choice. */
  const [openingPref, setOpeningPref] = useState<OpeningPreference>('surprise');
  const [opening, setOpening] = useState<OpeningConfig | null>(null);
  const [openingLoading, setOpeningLoading] = useState(false);
  const [openingError, setOpeningError] = useState<string | null>(null);
  /** "No gift" is a real answer, not an unanswered step — tracked separately
   * so the stepper can tick step 4 off for someone who chose to skip it. */
  const [giftSkipped, setGiftSkipped] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ slug: string; id?: string } | null>(null);

  // A stable id for this draft, used as the R2 upload folder before the
  // greeting itself exists. Held in state, not a ref: it is read during
  // render (passed to the editor), and lazily mutating a ref mid-render can
  // leave the tree rendering a stale value.
  const [draftId, setDraftId] = useState<string>(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : ''
  );

  /* Gate on the restore having run at least once. Without it the save effect
   * fires on the very first commit — with the empty initial state, since it
   * closes over the same render as the restore beside it — and overwrites the
   * draft it was about to read. That was survivable when a draft held only
   * the answers; now that it holds the generated greeting, the same race
   * would throw away the AI call. */
  const [hydrated, setHydrated] = useState(false);

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
      const parsed = JSON.parse(saved) as SavedDraft;
      /* eslint-disable react-hooks/set-state-in-effect --
         These run once on mount and React batches them into a single
         re-render, so there is no cascade. The rule's suggested fix (a lazy
         initialiser) is not available here: localStorage doesn't exist
         during SSR, so seeding state from it would desync hydration. */
      if (parsed?.eventType) setEventType(parsed.eventType);
      if (parsed?.details) setDetails({ ...emptyDetails, ...parsed.details });
      if (parsed?.draftId) setDraftId(parsed.draftId);

      /* The generated greeting costs an AI call and several seconds of the
       * user's attention, so leaving the page must not throw it away. It is
       * restored together with the step it was left on: dropping someone
       * back on the event picker while their finished text sits in storage
       * would just make them generate it a second time. Going back to an
       * earlier step is still one click away in the stepper, and running
       * generation again replaces this wholesale. */
      if (
        parsed?.v === DRAFT_VERSION &&
        parsed.eventType &&
        isUsableEditor(parsed.editor)
      ) {
        setEditor(parsed.editor);
        setGenerated(parsed.editor.content);
        if (parsed.gift) setGift(parsed.gift);
        if (parsed.openingPref) setOpeningPref(parsed.openingPref);
        if (parsed.opening) setOpening(parsed.opening);
        // Resume where they actually were. Someone who stepped back to the
        // event picker before leaving meant to start over, and shoving them
        // forward into the old editor would undo that decision for them.
        // (The stepper won't jump forward either — it only makes completed
        // steps clickable — so from there the flow runs again and the next
        // generation replaces what's held here.)
        if (
          parsed.stage === 'editor' ||
          parsed.stage === 'opening' ||
          parsed.stage === 'gift'
        ) {
          setStage(parsed.stage);
        }
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // Corrupt draft — start clean.
    } finally {
      // Even a corrupt draft counts as restored: saving has to start
      // eventually, or nothing the user does from here would be kept.
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || stage === 'share') return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          v: DRAFT_VERSION,
          eventType,
          details,
          draftId,
          editor,
          gift,
          openingPref,
          opening,
          /* `generating` is a transient view of the editor step — recording
           * it verbatim would resume a reload into a spinner that never
           * resolves. */
          stage: stage === 'generating' ? 'editor' : stage,
        } satisfies SavedDraft)
      );
    } catch {
      // Storage full / disabled — the flow still works, just not resumable.
    }
  }, [hydrated, eventType, details, stage, draftId, editor, gift, openingPref, opening]);

  /** Jumps to any step, forward or back. A step whose own data isn't ready
   * yet (no generated text, no published link) renders its own empty-state
   * prompt rather than being blocked here. */
  const goToStage = (target: FlowStage) => {
    setGenError(null);
    setStage(target);
    if (target === 'opening') enterOpeningStep();
  };

  /**
   * Arriving at the opening step starts building the experience straight away.
   *
   * "Surprise Me" is the default *and* the recommendation, so making the
   * creator click it to make anything happen would leave the recommended path
   * looking broken. Only ever fires when there's nothing to show yet, so
   * revisiting the step doesn't burn another model call or replace a game the
   * creator already accepted.
   */
  const enterOpeningStep = () => {
    if (!editor || opening || openingLoading) return;
    if (openingPref === 'classic') return;
    void runOpeningGeneration(openingPref);
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
          recipientGender: details.recipientGender,
          relationship: details.relationship,
          recipientAge: details.recipientAge,
          aboutThem: details.aboutThem,
          sharedMemory: details.sharedMemory,
          senderName: details.senderName,
          senderGender: details.senderGender,
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

  /* ---------------- Opening experience ---------------- */

  /**
   * Asks the model to design the unlock challenge.
   *
   * Failure is never fatal and never blocks the flow: the creator sees a
   * retry, and publishing without a config simply means the recipient gets
   * the classic gate. That is why nothing here throws upward.
   */
  const runOpeningGeneration = async (preference: OpeningPreference) => {
    if (!eventType || !editor) return;

    if (preference === 'classic') {
      setOpening(null);
      setOpeningError(null);
      return;
    }

    setOpeningLoading(true);
    setOpeningError(null);

    // The greeting copy is a second, richer source of personal detail than
    // the form fields — the model already distilled the free text into it.
    const greetingText = [
      editor.content.title,
      editor.content.intro,
      ...editor.content.sections.map((section) => section.body),
      ...(editor.content.messages ?? []),
      editor.content.closing,
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 4000);

    try {
      const res = await fetch('/api/v2/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          recipientName: details.recipientName,
          recipientGender: details.recipientGender,
          relationship: details.relationship,
          recipientAge: details.recipientAge,
          aboutThem: details.aboutThem,
          sharedMemory: details.sharedMemory,
          senderName: details.senderName,
          senderGender: details.senderGender,
          tone: details.tone,
          greetingText,
          photoCount: editor.media.filter((m) => m.type === 'image').length,
          videoCount: editor.media.filter((m) => m.type === 'video').length,
          preference,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        opening?: OpeningConfig | null;
      } | null;

      if (!res.ok || !data?.opening) throw new Error('failed');

      setOpening(data.opening);
      track('opening_generated', {
        props: { mechanic: data.opening.mechanic, preference },
      });
    } catch {
      setOpening(null);
      setOpeningError('לא הצלחנו לבנות משחק הפעם — אפשר לנסות שוב, או להמשיך עם פתיחה קלאסית');
    } finally {
      setOpeningLoading(false);
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
          recipientGender: details.recipientGender,
          relationship: details.relationship,
          recipientAge: details.recipientAge,
          aboutThem: details.aboutThem,
          sharedMemory: details.sharedMemory,
          senderName: details.senderName,
          senderGender: details.senderGender,
          tone: details.tone,
          content: editor.content,
          templateId: editor.templateId,
          musicTrack: editor.musicTrack,
          musicEnabled: editor.musicEnabled,
          media: editor.media,
          coverMediaId: editor.coverMediaId,
          gift,
          opening,
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

  /* ---------------- Shell ---------------- */

  const canContinueFromDetails = details.recipientName.trim().length > 0;

  /* Real answers, not "the cursor went past here" — and not "a choice was
   * started", either. Picking a gift *type* writes a stub gift straight
   * away, so the gift step only counts once that stub carries something the
   * recipient can actually redeem (or the sender chose to send none). */
  const completedSteps: Partial<Record<FlowStage, boolean>> = {
    event: Boolean(eventType),
    details: canContinueFromDetails,
    editor: Boolean(editor),
    opening: Boolean(opening) || openingPref === 'classic',
    gift: hasGift(gift) || giftSkipped,
    share: Boolean(published),
  };

  return (
    <div className="v2-scope v2-studio v2-shell">
      <header className="v2-container pt-6 pb-3 flex flex-col gap-4">
        {/* Three tracks rather than a flex row: the wordmark is centred on the
          * line itself, so it stays put whether or not the "עבור X" chip is
          * showing — a flexbox `justify-between` would shift it every time
          * the chip appears. */}
        <div
          className="grid items-center gap-2"
          style={{ gridTemplateColumns: '1fr auto 1fr' }}
        >
          <span aria-hidden="true" />
          <HomeLink />
          <span className="justify-self-end">
            {details.recipientName && stage !== 'event' && stage !== 'share' && (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full hidden sm:inline-block"
                style={{ background: 'var(--v2-surface)', border: '1px solid var(--v2-surface-border)', color: 'var(--v2-ink-soft)' }}
              >
                {eventType ? `${EVENT_BY_ID[eventType]?.emoji} ` : ''}
                עבור {details.recipientName}
              </span>
            )}
          </span>
        </div>

        <Stepper stage={stage} onGoTo={goToStage} completed={completedSteps} />
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

            <div className="flex mt-10">
              <BackButton href="/" />
            </div>
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

            <div className="flex items-center gap-3 mt-10">
              <BackButton onClick={() => setStage('event')} />
              <button
                type="button"
                className="v2-btn v2-btn-primary flex-1 text-lg"
                onClick={() => {
                  if (!canContinueFromDetails) {
                    setFormError('צריך לפחות שם — למי ההפתעה?');
                    return;
                  }
                  track('completed_details');
                  // Already generated once — going back here was just to
                  // review or tweak an answer, not to throw away the AI
                  // text. Resume the existing draft; regenerating is a
                  // separate, explicit choice below.
                  if (editor) {
                    setStage('editor');
                    return;
                  }
                  void runGeneration();
                }}
              >
                {editor ? 'המשך לטקסט הקיים ←' : '✨ צור לי את ההפתעה'}
              </button>
            </div>

            {editor && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  className="v2-btn v2-btn-ghost text-sm"
                  onClick={() => {
                    if (!canContinueFromDetails) {
                      setFormError('צריך לפחות שם — למי ההפתעה?');
                      return;
                    }
                    track('completed_details');
                    void runGeneration();
                  }}
                >
                  🔄 לא, תכתבו לי טקסט חדש עם AI
                </button>
              </div>
            )}
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
              onChange={(patch) => setEditor((s) => (s ? { ...s, ...patch } : s))}
              onBack={() => setStage('details')}
              onContinue={() => {
                setStage('opening');
                enterOpeningStep();
              }}
              onRegenerate={() => void runGeneration()}
              publishing={publishing}
            />
          </>
        )}

        {/* Jumped here straight from the stepper before any text was
         * generated — nothing to edit yet, so send them to fill in what's
         * missing instead of rendering a blank editor. */}
        {stage === 'editor' && !editor && (
          <EmptyStepPrompt
            title="עדיין אין טקסט לערוך"
            body="קודם בוחרים אירוע וממלאים כמה פרטים, ואז ה-AI כותב את הטקסט."
            actionLabel={eventType ? 'למלא פרטים' : 'לבחור אירוע'}
            onAction={() => setStage(eventType ? 'details' : 'event')}
          />
        )}

        {stage === 'opening' && editor && (
          <OpeningStep
            preference={openingPref}
            config={opening}
            loading={openingLoading}
            error={openingError}
            onPreferenceChange={(preference) => {
              setOpeningPref(preference);
              // Picking a different kind is a request for a different game,
              // so it regenerates rather than leaving the previous one on
              // screen looking like the answer.
              void runOpeningGeneration(preference);
            }}
            onRegenerate={() => void runOpeningGeneration(openingPref)}
            onBack={() => setStage('editor')}
            onContinue={() => setStage('gift')}
          />
        )}

        {/* Jumped here before there is any greeting to attach an opening to. */}
        {stage === 'opening' && !editor && (
          <EmptyStepPrompt
            title="עדיין אין ברכה"
            body="קודם יוצרים את הטקסט, ואז בונים את חוויית הפתיחה סביב מי שחוגגים."
            actionLabel={eventType ? 'למלא פרטים' : 'לבחור אירוע'}
            onAction={() => setStage(eventType ? 'details' : 'event')}
          />
        )}

        {stage === 'gift' && (
          <GiftStep
            draftId={draftId}
            recipientName={details.recipientName}
            aboutThem={details.aboutThem}
            sharedMemory={details.sharedMemory}
            gift={gift}
            onChange={(g) => {
              setGift(g);
              setGiftSkipped(false);
            }}
            onDone={() => {
              if (!editor || !eventType) {
                setGenError('קודם צריך טקסט מוכן — נחזור לשלב העריכה');
                setStage('editor');
                return;
              }
              void publish();
            }}
            onSkip={() => {
              setGift(null);
              setGiftSkipped(true);
              if (!editor || !eventType) {
                setGenError('קודם צריך טקסט מוכן — נחזור לשלב העריכה');
                setStage('editor');
                return;
              }
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

        {stage === 'share' && !published && (
          <EmptyStepPrompt
            title="עדיין לא פרסמתם"
            body="אחרי שהטקסט מוכן ומוסיפים (או מדלגים על) מתנה, יופיע כאן קישור לשיתוף."
            actionLabel="לשלב המתנה"
            onAction={() => setStage('gift')}
          />
        )}
      </main>
    </div>
  );
}
