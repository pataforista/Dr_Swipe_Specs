// Named imports only, so the bundler keeps just these and drops replay,
// feedback and tracing. Loaded on demand by monitoring.ts.
export { init, captureException } from '@sentry/react';
