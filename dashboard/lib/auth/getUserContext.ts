import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Loja } from '@/types/database';

export interface UserContext {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  loja: Loja | null;
}

/**
 * Single source of truth for "who is this and what can they see",
 * replacing the sequential admins-then-lojas lookup duplicated across
 * auth-router.js and onboarding.js in the legacy app (see architecture
 * doc §5.3). Wrapped in React's cache() so multiple Server Components
 * in the same request tree share one lookup instead of re-querying.
 */
export const getUserContext = cache(async (): Promise<UserContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, isAdmin: false, loja: null };
  }

  const [{ data: adminRow }, { data: loja }] = await Promise.all([
    supabase.from('admins').select('email').eq('email', user.email ?? '').maybeSingle(),
    supabase.from('lojas').select('*').eq('perfil_id', user.id).maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    isAdmin: Boolean(adminRow),
    loja: (loja as Loja) ?? null,
  };
});
