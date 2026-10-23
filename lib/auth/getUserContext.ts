import { createClient } from '@/lib/supabase/client';
import type { Loja } from '@/types/database';

export interface UserContext {
  userId: string | null;
  email: string | null;
  nome: string | null;
  /** Fotografia pessoal da conta Google (nunca o logótipo da loja). */
  foto: string | null;
  metodoAcesso: 'password' | 'google';
  isAdmin: boolean;
  loja: Loja | null;
}

const VAZIO: UserContext = { userId: null, email: null, nome: null, foto: null, metodoAcesso: 'password', isAdmin: false, loja: null };

// Várias rotas pedem o contexto na mesma navegação: partilham uma única consulta durante poucos segundos.
let cache: { quando: number; promessa: Promise<UserContext> } | null = null;
const TTL_MS = 5000;

/** Esquece o contexto guardado (chamar depois de criar a loja ou terminar a sessão). */
export function invalidarUserContext() {
  cache = null;
}

async function carregar(): Promise<UserContext> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return VAZIO;

  const [{ data: adminRow }, { data: loja }] = await Promise.all([
    supabase.from('admins').select('email').eq('email', user.email ?? '').maybeSingle(),
    supabase.from('lojas').select('*').eq('perfil_id', user.id).maybeSingle(),
  ]);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nome = [meta.nome_completo, meta.full_name, meta.name].find((v) => typeof v === 'string' && v.trim()) as string | undefined;

  const fotoMeta = [meta.avatar_url, meta.picture].find((v) => typeof v === 'string' && v) as string | undefined;

  return {
    userId: user.id,
    email: user.email ?? null,
    nome: nome ?? null,
    foto: fotoMeta ?? null,
    metodoAcesso: user.app_metadata?.provider === 'google' ? 'google' : 'password',
    isAdmin: Boolean(adminRow),
    loja: (loja as Loja) ?? null,
  };
}

/** Quem é o utilizador e qual é a sua loja (corre no navegador, sob as políticas RLS). */
export function getUserContext(): Promise<UserContext> {
  if (cache && Date.now() - cache.quando < TTL_MS) return cache.promessa;
  const promessa = carregar().catch((e) => {
    cache = null;
    throw e;
  });
  cache = { quando: Date.now(), promessa };
  return promessa;
}
