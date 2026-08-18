'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { generateId } from '@/lib/ids';
import { VisualConcept, DEFAULT_VISUAL_CONCEPT, DesignOverrides } from '@/lib/visualStyles';
import Logo from '@/components/brand/Logo';
import Icon from '@/components/ui/Icon';
import Step1Details from './Step1Details';
import Step2Media from './Step2Media';
import Step3Generate from './Step3Generate';
import Step4Visual from './Step4Visual';
import Step5Activation from './Step5Activation';
import Step6Published from './Step6Published';

const STEPS = [
  { id: 1, label: 'פרטים' },
  { id: 2, label: 'מדיה ומוזיקה' },
  { id: 3, label: 'נוסח הברכה' },
  { id: 4, label: 'סגנון עיצוב' },
  { id: 5, label: 'אישור' },
  { id: 6, label: 'שיתוף' },
];

interface WizardState {
  id: string;
  recipientName: string;
  eventType: string;
  theme: string;
  userNotes: string;
  recipientGender: 'male' | 'female' | '';
  /** Sender's relationship to the recipient (e.g. "אמא", "חבר/ה"). */
  relationship: string;
  mediaFiles: string[];
  /** Per-video-file: true/absent = keep the video's own audio, false = play muted. */
  mediaAudioSettings: Record<string, boolean>;
  buyMeLink: string;
  audioTrack: string;
  aiText: {
    fullGreeting: string;
    shareData: {
      whatsappMessage: string;
      gmailSubject: string;
      gmailBody: string;
    };
  } | null;
  giftCard: {
    number: string;
    date: string;
    code: string;
    company: string;
    inputMode: 'manual' | 'image';
    images: string[];
  };
  visualConcept: VisualConcept;
  designPrompt: string;
  designOverrides: DesignOverrides | null;
  status: 'draft' | 'pending' | 'approved';
}

gsap.registerPlugin(useGSAP);

// Keyed per-draft (not one shared key) so two tabs — or two different people
// on the same browser/device — never overwrite each other's in-progress
// greeting. The draft id also lives in the URL (?id=...) so each draft has
// its own resumable link, distinct from every other draft.
const STORAGE_PREFIX = 'interagift-wizard-';
const storageKeyFor = (id: string) => `${STORAGE_PREFIX}${id}`;

function getUrlDraftId(): string | null {
  return new URLSearchParams(window.location.search).get('id');
}

function setUrlDraftId(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('id', id);
  window.history.replaceState(null, '', url.toString());
}

function freshState(): WizardState {
  return {
    id: generateId(),
    recipientName: '',
    eventType: '',
    theme: '',
    userNotes: '',
    recipientGender: '',
    relationship: '',
    mediaFiles: [],
    mediaAudioSettings: {},
    buyMeLink: '',
    audioTrack: '',
    aiText: null,
    giftCard: { number: '', date: '', code: '', company: '', inputMode: 'manual', images: [] },
    visualConcept: DEFAULT_VISUAL_CONCEPT,
    designPrompt: '',
    designOverrides: null,
    status: 'draft',
  };
}

export default function WizardShell() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>(freshState);
  const [hydrated, setHydrated] = useState(false);
  const stepperRef = useRef<HTMLElement>(null);

  const { contextSafe } = useGSAP({ scope: stepperRef });

  const handleStepHoverIn = contextSafe((e: React.MouseEvent<HTMLSpanElement>) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(e.currentTarget, {
      scale: 1.15,
      y: -3,
      duration: reduceMotion ? 0 : 0.3,
      ease: 'back.out(2.5)',
      overwrite: 'auto',
    });
  });

  const handleStepHoverOut = contextSafe((e: React.MouseEvent<HTMLSpanElement>) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: reduceMotion ? 0 : 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  });

  // Resume this exact draft (by its id in the URL) on mount — or, if this
  // tab has no draft id yet, mint a fresh one and stamp it into the URL so
  // this tab/session never shares storage with any other draft.
  useEffect(() => {
    const urlId = getUrlDraftId();

    try {
      const saved = urlId ? localStorage.getItem(storageKeyFor(urlId)) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.state?.id === urlId) {
          // Merge over fresh defaults so a draft saved before a new field
          // (e.g. recipientGender, giftCard.company) existed doesn't end up
          // with it undefined — giftCard needs its own nested merge since
          // it's an object, not a primitive.
          const fresh = freshState();
          setState({
            ...fresh,
            ...parsed.state,
            id: parsed.state.id,
            giftCard: { ...fresh.giftCard, ...parsed.state.giftCard },
          });
          if (typeof parsed.step === 'number') setCurrentStep(parsed.step);
          setHydrated(true);
          return;
        }
      }
    } catch {
      // Corrupted storage — fall through to a fresh draft
    }

    // No resumable draft for this URL's id (or no id yet) — start a new,
    // independent draft and give it its own URL.
    const fresh = urlId ? { ...freshState(), id: urlId } : freshState();
    setState(fresh);
    setCurrentStep(1);
    setUrlDraftId(fresh.id);
    setHydrated(true);
  }, []);

  // Persist every change so the user never loses their progress
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKeyFor(state.id), JSON.stringify({ state, step: currentStep }));
  }, [state, currentStep, hydrated]);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const startFresh = () => {
    localStorage.removeItem(storageKeyFor(state.id));
    const fresh = freshState();
    setState(fresh);
    setCurrentStep(1);
    setUrlDraftId(fresh.id);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'rgba(255, 253, 251, 0.92)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
            <Logo size={44} />
            <div className="flex items-center gap-4">
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                ברכה אישית ומרגשת, מעוצבת ברמה אחרת — תוך דקות
              </p>
              <button
                onClick={startFresh}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--primary-soft)]"
                style={{ borderColor: 'var(--border)', color: 'var(--ink-soft)' }}
                title="מחיקת הטיוטה הנוכחית והתחלת ברכה חדשה"
              >
                ברכה חדשה
              </button>
              {/* Version switch, for comparing V1 and V2 side by side. */}
              <a
                href="/v2"
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
                style={{ background: 'var(--primary)', color: '#fff' }}
                title="מעבר לגרסה 2 (ניסיונית)"
              >
                ✨ גרסה 2
              </a>
            </div>
          </div>

          {/* Stepper */}
          <nav aria-label="שלבי היצירה" ref={stepperRef}>
            <ol className="flex items-center justify-between overflow-x-auto scrollbar-hide pb-1 gap-1">
              {STEPS.map((step, idx) => {
                const isDone = currentStep > step.id;
                const isActive = currentStep === step.id;
                return (
                  <li key={step.id} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      aria-current={isActive ? 'step' : undefined}
                      className="flex items-center gap-2 group"
                    >
                      <span
                        onMouseEnter={handleStepHoverIn}
                        onMouseLeave={handleStepHoverOut}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                        style={{
                          backgroundColor: isDone || isActive ? 'var(--primary)' : 'var(--surface)',
                          color: isDone || isActive ? '#fff' : 'var(--ink-soft)',
                          border: `1px solid ${isDone || isActive ? 'var(--primary)' : 'var(--border)'}`,
                          boxShadow: isActive ? '0 0 0 4px var(--primary-soft)' : 'none',
                        }}
                      >
                        {isDone ? <Icon name="check" size={16} strokeWidth={2.5} /> : step.id}
                      </span>
                      <span
                        className="hidden sm:block text-xs font-medium transition-colors"
                        style={{ color: isActive ? 'var(--ink)' : 'var(--ink-soft)' }}
                      >
                        {step.label}
                      </span>
                    </button>

                    {idx < STEPS.length - 1 && (
                      <span
                        className="hidden sm:block w-6 h-px mx-2"
                        style={{
                          backgroundColor: currentStep > step.id ? 'var(--primary)' : 'var(--border)',
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="card p-6 sm:p-10">
          {currentStep === 1 && (
            <Step1Details state={state} updateState={updateState} />
          )}
          {currentStep === 2 && (
            <Step2Media state={state} updateState={updateState} />
          )}
          {currentStep === 3 && (
            <Step3Generate state={state} updateState={updateState} />
          )}
          {currentStep === 4 && (
            <Step4Visual state={state} updateState={updateState} />
          )}
          {currentStep === 5 && (
            <Step5Activation state={state} updateState={updateState} />
          )}
          {currentStep === 6 && (
            <Step6Published state={state} />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10 gap-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-ghost"
            >
              <Icon name="chevron-right" size={16} />
              חזרה
            </button>

            {currentStep < STEPS.length && (
              <button onClick={nextStep} className="btn-primary">
                המשך
                <Icon name="chevron-left" size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
