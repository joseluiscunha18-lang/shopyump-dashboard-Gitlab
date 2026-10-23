'use client';

import { createClient } from '@/lib/supabase/client';
import { DASHBOARD_BASE_PATH } from '@/lib/domains';
import { invalidarUserContext } from '@/lib/auth/getUserContext';

/**
 * Ações de autenticação (corre no navegador). Todas devolvem { ok, error? } com
 * mensagens em português — a interface nunca mostra o texto cru do Supabase.
 */
export type AuthResult = { ok: true } | { ok: false; error: string; /** Limite de envio de e-mails/pedidos do Supabase atingido. */ limite?: boolean };

function traduzir(message: string | undefined, code?: string): string {
  const m = (message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed' || m.includes('email not confirmed')) return 'Confirme o seu e-mail antes de entrar.';
  if (code === 'user_already_exists' || m.includes('already registered') || m.includes('already been registered')) return 'Já existe uma conta com este e-mail.';
  if (code === 'otp_expired' || m.includes('expired')) return 'O código expirou. Peça um novo código.';
  if (code === 'invalid_otp' || m.includes('token has expired or is invalid') || m.includes('invalid')) return 'Código inválido. Verifique e tente novamente.';
  if (code === 'weak_password' || m.includes('password should be')) return 'A senha é demasiado fraca. Use pelo menos 8 caracteres e um número.';
  if (code === 'same_password' || m.includes('different from the old password')) return 'A nova senha tem de ser diferente da atual.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || m.includes('rate limit') || m.includes('security purposes')) return 'Demasiadas tentativas. Aguarde um minuto e tente de novo.';
  if (m.includes('session missing') || m.includes('session_not_found')) return 'O link expirou ou já foi usado. Peça um novo link.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem ligação à internet. Tente novamente.';
  return 'Não foi possível concluir. Tente novamente.';
}

function ehLimite(e: { message?: string; code?: string } | null | undefined): boolean {
  const m = (e?.message ?? '').toLowerCase();
  return e?.code === 'over_email_send_rate_limit' || e?.code === 'over_request_rate_limit' || m.includes('rate limit') || m.includes('security purposes');
}

const fail = (e: { message?: string; code?: string } | null | undefined): AuthResult => ({ ok: false, error: traduzir(e?.message, e?.code), limite: ehLimite(e) });

/** URL (absoluto) do callback que troca o código por sessão: …/dashboard/api/auth/callback */
function callbackUrl(next?: string) {
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return `${window.location.origin}${DASHBOARD_BASE_PATH}/api/auth/callback${q}`;
}

/**
 * Como esta conta entra: 'senha' (e-mail+senha), 'google', 'ambos', 'pendente'
 * (e-mail por confirmar), 'nenhum' (não existe) ou 'desconhecido' (função SQL
 * ainda não instalada / sem ligação — a interface cai no comportamento antigo).
 * Ver supabase/auth_metodo_por_email.sql.
 */
export type MetodoConta = 'senha' | 'google' | 'ambos' | 'pendente' | 'nenhum' | 'desconhecido';

export async function metodoDaConta(email: string): Promise<MetodoConta> {
  try {
    const { data, error } = await createClient().rpc('auth_metodo_por_email', { p_email: email.trim() });
    if (error || typeof data !== 'string') return 'desconhecido';
    return (['senha', 'google', 'ambos', 'pendente', 'nenhum'] as const).includes(data as never) ? (data as MetodoConta) : 'desconhecido';
  } catch {
    return 'desconhecido';
  }
}

export async function entrarComSenha(email: string, password: string): Promise<AuthResult> {
  const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) return fail(error);
  invalidarUserContext();
  return { ok: true };
}

/** Cria a conta. O Supabase envia o e-mail "Confirm signup" com o código de 6 dígitos ({{ .Token }}). */
export async function criarConta(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await createClient().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: callbackUrl('/onboarding') },
  });
  if (error) return fail(error);
  // E-mail já registado: o Supabase devolve um utilizador sem identidades (para não revelar contas).
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: false, error: 'Já existe uma conta com este e-mail.' };
  }
  return { ok: true };
}

export async function confirmarCodigo(email: string, token: string): Promise<AuthResult> {
  const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token, type: 'signup' });
  if (error) return fail(error);
  invalidarUserContext();
  return { ok: true };
}

export async function reenviarCodigo(email: string): Promise<AuthResult> {
  const { error } = await createClient().auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: callbackUrl('/onboarding') },
  });
  return error ? fail(error) : { ok: true };
}

export async function entrarComGoogle(): Promise<AuthResult> {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl('/') },
  });
  return error ? fail(error) : { ok: true };
}

/** Envia o link de redefinição; o link abre /reset-password já com sessão de recuperação. */
export async function enviarLinkRecuperacao(email: string): Promise<AuthResult> {
  const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: callbackUrl('/reset-password'),
  });
  return error ? fail(error) : { ok: true };
}

export async function definirNovaSenha(password: string): Promise<AuthResult> {
  const { error } = await createClient().auth.updateUser({ password });
  return error ? fail(error) : { ok: true };
}

/** Altera a senha de quem já tem sessão, confirmando primeiro a senha atual. */
export async function alterarSenha(email: string, atual: string, nova: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: atual });
  if (e1) return { ok: false, error: 'A senha atual está incorreta.' };
  const { error: e2 } = await supabase.auth.updateUser({ password: nova });
  return e2 ? fail(e2) : { ok: true };
}

/** Pede a mudança de e-mail: o Supabase envia confirmação para o endereço novo (e, conforme a config, para o antigo). */
export async function alterarEmail(novoEmail: string): Promise<AuthResult> {
  const { error } = await createClient().auth.updateUser(
    { email: novoEmail.trim() },
    { emailRedirectTo: callbackUrl('/') },
  );
  return error ? fail(error) : { ok: true };
}

export async function terminarSessao(): Promise<void> {
  await createClient().auth.signOut();
  invalidarUserContext();
}

/** Há sessão neste navegador? (usado só para atalhos de interface; a proteção real é o middleware) */
export async function obterUtilizador() {
  const { data: { user } } = await createClient().auth.getUser();
  return user;
}
