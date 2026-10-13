/**
 * Error reporting (Sentry), errors only: no performance tracing, no session
 * replay, no personal data. Off unless VITE_SENTRY_DSN is set at build time;
 * without it the SDK is never downloaded. Loaded after first paint so it
 * does not weigh on startup.
 */
type SentryModule = typeof import('./monitoringSdk');

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
let sentry: SentryModule | null = null;

export const monitoringEnabled = !!DSN;

export function initMonitoring(): void {
  if (!DSN || import.meta.env.DEV) return;
  void import('./monitoringSdk').then(S => {
    S.init({
      dsn: DSN,
      release: `dr-swipe@${__APP_VERSION__}`,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      // Breadcrumbs from console calls can carry case text; keep the rest.
      integrations: integrations => integrations.filter(i => i.name !== 'Console'),
      tracesSampleRate: 0,
      beforeSend(event) {
        delete event.user;
        return event;
      },
    });
    sentry = S;
  }).catch(() => { /* reporting is best-effort; never break the game */ });
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  sentry?.captureException(error, context ? { extra: context } : undefined);
}
