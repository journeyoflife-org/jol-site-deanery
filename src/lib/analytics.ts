/**
 * Analytics events for the basilica vertical (page spec 03 SS7).
 *
 * All events are consent-gated. No third-party tracking SDK — events
 * are emitted to the platform's self-hosted analytics endpoint.
 */

export type AnalyticsEvent =
  | { type: 'page_view'; path: string; locale: string }
  | { type: 'mass_times_open'; path: string }
  | { type: 'map_directions_click'; path: string; destination: string }
  | { type: 'contact_form_submit_success'; path: string };

/**
 * Track an analytics event. Consent-gated — caller must verify
 * consent state before invoking.
 *
 * TODO: wire to @jol-hub/observability when packages are published.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  // Consent gate — check for analytics consent cookie/storage
  const consent = typeof localStorage !== 'undefined'
    ? localStorage.getItem('jol-consent-analytics')
    : null;
  if (consent !== 'granted') return;

  // Emit to platform analytics endpoint
  try {
    navigator.sendBeacon('/api/analytics', JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    }));
  } catch {
    // Analytics failure is non-fatal
  }
}
