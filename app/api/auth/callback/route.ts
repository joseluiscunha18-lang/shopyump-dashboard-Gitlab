import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DASHBOARD_BASE_PATH } from '@/lib/domains';

/**
 * Regresso do login com Google (OAuth/PKCE).
 *
 * O Supabase devolve o utilizador com `?code=...`. Sem esta rota, o
 * middleware via um pedido sem sessão e mandava para /login, perdendo o
 * `code` — daí o "volta sempre ao login". Aqui o código é trocado por
 * sessão NO SERVIDOR (grava os cookies) e só depois vai para o painel.
 *
 * URL final: https://shopyump.com/dashboard/api/auth/callback
 * (`/api` já é público no middleware, por isso nada mais a alterar.)
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  // Caminho completo (com /dashboard) — em Route Handlers o redirect não junta o basePath sozinho.
  const to = (path: string) => NextResponse.redirect(new URL(`${DASHBOARD_BASE_PATH}${path}`, request.url));

  const login = () => NextResponse.redirect(new URL('/login', request.url)); // URL limpo

  if (!code) return login();

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  return error ? login() : to('/');
}
