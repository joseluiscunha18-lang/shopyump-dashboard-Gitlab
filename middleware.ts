import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const AUTH_PATHS = ['/login', '/registar', '/verificar', '/recuperar', '/nova-senha'];
const ONBOARDING_PATH = '/onboarding';

/**
 * Route protection matrix (architecture doc §5.4):
 *
 *              | no session          | session, no loja     | session + loja
 * (auth)       | allowed             | redirect → /         | redirect → /
 * /onboarding  | redirect → /login   | allowed               | redirect → /
 * (dashboard)  | redirect → /login   | redirect → /onboarding| allowed
 *
 * Admin users (email present in `admins`) are routed straight through
 * regardless of loja state — the seller dashboard isn't their surface,
 * but Phase 1 doesn't have a separate admin app to send them to yet, so
 * we simply don't force them into onboarding.
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isOnboardingPath = pathname.startsWith(ONBOARDING_PATH);
  const isPublic = isAuthPath || pathname.startsWith('/api') || pathname.startsWith('/manifest');

  if (!user) {
    if (isPublic) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Signed in — figure out onboarding state once, reused by every branch.
  const [{ data: adminRow }, { data: loja }] = await Promise.all([
    supabase.from('admins').select('email').eq('email', user.email ?? '').maybeSingle(),
    supabase.from('lojas').select('id').eq('perfil_id', user.id).maybeSingle(),
  ]);
  const hasLoja = Boolean(loja) || Boolean(adminRow);

  if (isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (isOnboardingPath) {
    if (hasLoja) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Everything else is the protected dashboard route group.
  if (!hasLoja) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
