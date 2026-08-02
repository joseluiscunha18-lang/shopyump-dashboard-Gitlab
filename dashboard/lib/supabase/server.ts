import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for Server Components, Server Actions and
 * Route Handlers. Reads/writes the session via the request's cookies, so
 * RLS is enforced as the logged-in user — see architecture doc §6.1/§6.2.
 *
 * Must be created fresh per request (cookies() is request-scoped); never
 * hoist this into a module-level singleton.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN
        ? { domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN, sameSite: 'lax', secure: true }
        : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies
            // (e.g. during static rendering) — middleware.ts refreshes
            // the session on every request anyway, so this is safe to
            // swallow. See https://supabase.com/docs/guides/auth/server-side/nextjs
          }
        },
      },
    }
  );
}
