/**
 * Bloqueio de acesso enquanto o Shopyump está em desenvolvimento.
 *
 * A senha vem da variável de ambiente ACESSO_SENHA (Vercel → Settings → Environment Variables).
 * - Se a variável não existir, usa a senha por omissão abaixo (para o bloqueio funcionar já).
 *   IMPORTANTE: defina ACESSO_SENHA na Vercel e depois apague a senha por omissão deste ficheiro,
 *   para a senha não ficar escrita no repositório.
 * - Se ACESSO_SENHA existir mas estiver VAZIA, o bloqueio fica desligado (site aberto).
 *
 * O cookie guarda um hash da senha (nunca a senha) e é httpOnly: o JavaScript do navegador não o lê.
 * Usa só APIs disponíveis no middleware (Edge) e no Node: crypto.subtle e TextEncoder.
 */

export const ACESSO_COOKIE = 'sy_acesso';
export const ACESSO_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

const SENHA_POR_OMISSAO = '121314';

export function senhaAcesso(): string {
  return (process.env.ACESSO_SENHA ?? SENHA_POR_OMISSAO).trim();
}

/** O bloqueio está ligado quando existe uma senha (ACESSO_SENHA vazia desliga-o). */
export function acessoAtivo(): boolean {
  return senhaAcesso().length > 0;
}

export async function tokenAcesso(senha: string): Promise<string> {
  const dados = new TextEncoder().encode(`shopyump-acesso:${senha}`);
  const hash = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

let cache: { senha: string; token: string } | null = null;

/** Token que o cookie tem de ter para o acesso estar liberado (calculado uma vez por senha). */
export async function tokenEsperado(): Promise<string> {
  const senha = senhaAcesso();
  if (cache && cache.senha === senha) return cache.token;
  const token = await tokenAcesso(senha);
  cache = { senha, token };
  return token;
}

/** Comparação em tempo constante (evita descobrir o hash por diferenças de tempo). */
export function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
