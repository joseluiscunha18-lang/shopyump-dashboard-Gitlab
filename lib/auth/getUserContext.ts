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
// A loja mantém um TTL curto de propósito: as definições da loja mudam no dashboard e a página seguinte
// deve ver o valor novo sem depender de cada mutação lembrar-se de invalidar a cache.
let cache: { quando: number; promessa: Promise<UserContext> } | null = null;
const TTL_MS = 5000;

// A flag de admin quase nunca muda durante uma sessão, por isso não vale a pena
// consultá-la à rede em cada navegação. Fica em cache por email durante 10 minutos.
const ADMIN_TTL_MS = 10 * 60 * 1000;
let adminCache: { email: string; quando: number; valor: boolean } | null = null;

/** Esquece o contexto guardado (chamar depois de criar a loja ou terminar a sessão). */
export function invalidarUserContext() {
  cache = null;
  adminCache = null;
}

async function ehAdmin(supabase: ReturnType<typeof createClient>, email: string | null): Promise<boolean> {
  if (!email) return false;
  if (adminCache && adminCache.email === email && Date.now() - adminCache.quando < ADMIN_TTL_MS) {
    return adminCache.valor;
  }
  const { data, error } = await supabase.from('admins').select('email').eq('email', email).maybeSingle();
  // Em caso de erro (rede, etc.) não guardamos o "não" em cache — tenta de novo na próxima navegação.
  if (error) return false;
  const valor = Boolean(data);
  adminCache = { email, quando: Date.now(), valor };
  return valor;
}

async function carregar(): Promise<UserContext> {
  const supabase = createClient();
  // getSession() lê a sessão local (e renova-a se tiver expirado) SEM ir à rede,
  // ao contrário de getUser(), que fazia um pedido ao Supabase Auth em cada navegação.
  // Aqui serve só para mostrar a identidade na interface: a segurança dos dados
  // continua nas políticas RLS e a da navegação no middleware, que validam no servidor.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return VAZIO;

  const [isAdmin, { data: loja }] = await Promise.all([
    ehAdmin(supabase, user.email ?? null),
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
    isAdmin,
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
