import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DASHBOARD_BASE_PATH } from '@/lib/domains';

/**
 * Regresso do login com Google e do link de "recuperar senha" (PKCE).
 *
 * O Supabase devolve o utilizador com `?code=...`. O código é trocado por
 * sessão NO SERVIDOR (grava os cookies) e só depois segue para o destino.
 *
 * `?next=` só aceita caminhos internos conhecidos (nunca um URL externo).
 * URL a registar no Supabase (Redirect URLs):
 *   https://shopyump.com/dashboard/api/auth/callback
 */
const DESTINOS_LIMPOS = ['/reset-password', '/onboarding', '/login'];

function destinoSeguro(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  let caminho = next.split('?')[0]!;
  if (caminho === '/nova-senha') caminho = '/reset-password'; // e-mails antigos
  return DESTINOS_LIMPOS.includes(caminho) || caminho === '/' ? caminho : '/';
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = destinoSeguro(request.nextUrl.searchParams.get('next'));

  // Páginas "de antes de entrar" têm URL limpo (/login); o resto vive sob /dashboard.
  const para = (path: string) =>
    NextResponse.redirect(
      new URL(DESTINOS_LIMPOS.includes(path) ? path : `${DASHBOARD_BASE_PATH}${path === '/' ? '' : path}`, request.url),
    );

  if (!code) return para('/login');

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? para('/login') : para(next);
}
