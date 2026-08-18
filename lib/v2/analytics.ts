/**
 * Funnel instrumentation for V2.
 *
 * Fire-and-forget by design: a failed analytics call must never surface to
 * the user or block the flow, so every helper swallows its own errors.
 */

export const ANALYTICS_EVENTS = [
  'landing_view',
  'started_creating',
  'event_selected',
  'completed_details',
  'generated_greeting',
  'opened_editor',
  'greeting_published',
  'greeting_shared',
  'greeting_opened',
  'greeting_completed',
  'premium_click',
  'purchase',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const SESSION_KEY = 'interagift-v2-session';

/** Stable per-browser id so the funnel can be followed across steps. */
export function sessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function track(
  name: AnalyticsEventName,
  payload: {
    greetingId?: string | null;
    slug?: string | null;
    props?: Record<string, unknown>;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify({
    name,
    greetingId: payload.greetingId ?? null,
    slug: payload.slug ?? null,
    sessionId: sessionId(),
    props: payload.props ?? null,
  });

  try {
    // sendBeacon survives the page being closed mid-navigation, which is
    // exactly when the "shared" and "completed" events tend to fire.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/v2/analytics',
        new Blob([body], { type: 'application/json' })
      );
      return;
    }
  } catch {
    // fall through to fetch
  }

  void fetch('/api/v2/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
