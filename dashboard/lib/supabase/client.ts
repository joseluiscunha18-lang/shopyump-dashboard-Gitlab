'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client. Used only where a call genuinely has to
 * run in the browser: Realtime subscriptions, optimistic UI, and file
 * uploads with progress. Everything else goes through the server client
 * (server.ts) inside Server Components / Server Actions — see
 * architecture doc §6.2.
 *
 * Cookie domain is left to @supabase/ssr's defaults in development, and
 * set to NEXT_PUBLIC_AUTH_COOKIE_DOMAIN (".shopyump.com") in production
 * so the session cookie is readable by both shopyump.com and
 * dashboard.shopyump.com — see architecture doc §5.2.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN
        ? { domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN, sameSite: 'lax', secure: true }
        : undefined,
    }
  );
}
