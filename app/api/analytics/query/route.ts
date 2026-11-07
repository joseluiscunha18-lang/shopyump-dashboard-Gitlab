import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsNotConfiguredError } from '@/lib/analytics/cf';
import { ANALYTICS_RANGES, getStoreAnalytics, type AnalyticsRange } from '@/lib/analytics/service';

/**
 * GET /api/analytics/query?range=today|7d|30d|90d
 *
 * Devolve as análises da loja do utilizador autenticado. A loja é SEMPRE a do utilizador
 * da sessão (nunca um id vindo do pedido) e a chave de leitura da Cloudflare fica no
 * servidor. URL no painel: /dashboard/api/analytics/query (basePath).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('range') ?? '7d';
  const range = (ANALYTICS_RANGES as readonly string[]).includes(raw) ? (raw as AnalyticsRange) : null;
  if (!range) return NextResponse.json({ error: 'range inválido' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: loja } = await supabase.from('lojas').select('id, slug').eq('perfil_id', user.id).maybeSingle();
  if (!loja) return NextResponse.json({ error: 'loja não encontrada' }, { status: 404 });

  try {
    const data = await getStoreAnalytics({ slug: loja.slug, lojaId: loja.id, range, supabase });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (e) {
    // Variáveis da Cloudflare ainda não configuradas: a página mostra "analytics por ligar".
    if (e instanceof AnalyticsNotConfiguredError) return NextResponse.json({ configured: false });
    console.error('[analytics/query]', e);
    return NextResponse.json({ error: 'analytics_unavailable' }, { status: 502 });
  }
}
