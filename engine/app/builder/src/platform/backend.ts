/**
 * Backend facade singleton for the Builder UI (Phase 22).
 *
 * The @lumen/backend-supabase facade composes every per-domain hosted
 * binding behind one object; the Builder swaps local ↔ hosted by switching
 * a single factory:
 *
 *   - HOSTED  — both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
 *               AND a real supabase client factory resolves (dynamic import
 *               of '@supabase/supabase-js', wrapped in try/catch so offline
 *               builds never break: the specifier is computed at runtime so
 *               neither Vite nor tsc tries to resolve the optional package).
 *   - OFFLINE — anything missing → createOfflineBackend(), the zero-config
 *               local mode delegating to the @lumen/app-* memory adapters.
 *
 * The facade is ADDITIVE: the existing local service singletons in
 * services.ts stay the source of truth for every panel in this pass; this
 * module exposes `backend` / `backendMode` for status display and the
 * domains where the facade matches cleanly (auth presence).
 */

import {
  createBackend,
  createOfflineBackend,
  type Backend,
} from '@lumen/backend-supabase';

export type BackendMode = 'hosted' | 'offline';

/** The active backend facade. Starts offline; upgraded by backendReady. */
export let backend: Backend = createOfflineBackend();
export let backendMode: BackendMode = 'offline';
/** Supabase project host (e.g. "xyz.supabase.co") when hosted. */
export let backendHost: string | undefined;

const env = import.meta.env as {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

/**
 * Resolves the backend once: hosted when config + client factory are both
 * available, offline otherwise. Never rejects — any failure stays offline.
 */
export const backendReady: Promise<Backend> = (async () => {
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return backend;
  try {
    // Optional dependency: the specifier is built at runtime so Vite does
    // not try to bundle/resolve it and offline builds never break.
    const specifier = '@supabase/supabase-js';
    const mod: unknown = await import(/* @vite-ignore */ specifier);
    const createClient = (mod as { createClient?: unknown } | null)?.createClient;
    if (typeof createClient !== 'function') return backend;
    const client = (createClient as (u: string, k: string) => never)(url, anonKey);
    backend = createBackend(env, { client });
    if (backend.mode === 'hosted') {
      backendMode = 'hosted';
      try {
        backendHost = new URL(url).host;
      } catch {
        backendHost = url;
      }
    }
  } catch {
    /* supabase-js unavailable → stay offline */
  }
  return backend;
})();

/** Best-effort current-user label for the status badge (auth presence). */
export async function backendUserLabel(): Promise<string | undefined> {
  const user = await backend.auth.getUser();
  return user?.email ?? user?.id;
}
