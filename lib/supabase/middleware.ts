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
 *
 * PERFORMANCE NOTE: `hasLoja` só muda no momento em que o onboarding é
 * concluído — no resto da sessão é sempre o mesmo valor. Sem cache, cada
 * navegação (incluindo trocas de página client-side dentro do próprio
 * painel, como router.push) pagava DUAS viagens de rede à base de dados
 * (admins + lojas) por cima da verificação de sessão — em rede móvel
 * lenta isto somava bem mais do que o utilizador esperava entre um clique
 * e a página seguinte aparecer. Guardamos o resultado num cookie curto
 * (`sy_has_loja`) e só voltamos a consultar a base de dados quando ele
 * não existe ou quando a rota é sensível a esse valor mudar (onboarding).
 */
const HAS_LOJA_COOKIE = 'sy_has_loja';

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
  // Rotas fora do painel (login/registar/onboarding) sempre confirmam na
  // base de dados, porque é exatamente aí que `hasLoja` pode ter acabado
  // de mudar. Dentro do painel, um cookie válido poupa as duas queries.
  const cachedHasLoja = request.cookies.get(HAS_LOJA_COOKIE)?.value;
  let hasLoja: boolean;
  if (cachedHasLoja !== undefined && !isOnboardingPath && !isAuthPath) {
    hasLoja = cachedHasLoja === '1';
  } else {
    const [{ data: adminRow }, { data: loja }] = await Promise.all([
      supabase.from('admins').select('email').eq('email', user.email ?? '').maybeSingle(),
      supabase.from('lojas').select('id').eq('perfil_id', user.id).maybeSingle(),
    ]);
    hasLoja = Boolean(loja) || Boolean(adminRow);
    supabaseResponse.cookies.set(HAS_LOJA_COOKIE, hasLoja ? '1' : '0', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 12, // 12h — bem menor que a sessão, para nunca ficar preso a um estado antigo por muito tempo.
      path: '/',
    });
  }

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
