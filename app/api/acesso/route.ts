import { type NextRequest, NextResponse } from 'next/server';
import {
  ACESSO_COOKIE,
  ACESSO_MAX_AGE,
  acessoAtivo,
  iguais,
  tokenAcesso,
  tokenEsperado,
} from '@/lib/acesso';

export const dynamic = 'force-dynamic';

/** Estado do bloqueio: está ligado? Este navegador já tem acesso liberado? */
export async function GET(request: NextRequest) {
  const ativo = acessoAtivo();
  if (!ativo) return NextResponse.json({ ativo: false, liberado: true });
  const atual = request.cookies.get(ACESSO_COOKIE)?.value ?? '';
  const liberado = iguais(atual, await tokenEsperado());
  return NextResponse.json({ ativo: true, liberado });
}

/** Verifica a senha e, se estiver certa, liberta o acesso com um cookie. */
export async function POST(request: NextRequest) {
  if (!acessoAtivo()) return NextResponse.json({ ok: true });

  let senha = '';
  try {
    const body = (await request.json()) as { senha?: unknown };
    senha = typeof body.senha === 'string' ? body.senha.trim() : '';
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const certa = iguais(await tokenAcesso(senha), await tokenEsperado());
  if (!certa) {
    // Pequena pausa nas tentativas falhadas: torna a adivinhação em série bem mais lenta.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACESSO_COOKIE, await tokenEsperado(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACESSO_MAX_AGE,
    path: '/',
  });
  return res;
}
