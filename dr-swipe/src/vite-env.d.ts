/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/** package.json version, injected by vite.config.ts. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Sentry DSN; error reporting stays off when unset. */
  readonly VITE_SENTRY_DSN?: string;
}
