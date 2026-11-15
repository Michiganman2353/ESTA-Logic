import posthog from 'posthog-js';

let enabled = false;
export function initializeAnalytics() {
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (enabled || !token || !host) return;
  try {
    posthog.init(token, {
      api_host: host,
      defaults: '2026-08-30',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_exceptions: false,
      person_profiles: 'never',
      persistence: 'memory',
      before_send: (event) => {
        if (!event) return null;
        const properties = event.properties;
        event.properties = {
          distinct_id: properties.distinct_id,
          $process_person_profile: false,
          environment: import.meta.env.MODE,
        };
        return event;
      },
    });
    enabled = true;
  } catch {
    enabled = false;
  }
}

export function trackAccountEvent(event: 'login_succeeded' | 'login_failed') {
  if (!enabled) return;
  try {
    posthog.capture(event);
  } catch {
    /* Analytics must not interrupt sign-in. */
  }
}
