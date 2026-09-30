import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * redirect() para um caminho FORA do prefixo /dashboard (ex.: /login, /onboarding).
 * O redirect() normal junta o prefixo sozinho e mostraria /dashboard/login;
 * com URL absoluto o Next não mexe, e o visitante vê só /login.
 */
export async function cleanRedirect(path: string): Promise<never> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') || host?.startsWith('127.') ? 'http' : 'https');
  if (!host) redirect(path);
  redirect(`${proto}://${host}${path}`);
}
