import { NextResponse } from 'next/server';
import { getR2Config, listObjects, resolveLojaDoUtilizador } from '@/lib/r2/server';
import { buildPublicUrl, R2_LOJAS_PREFIX, R2_MEDIA_FILE } from '@/lib/r2/shared';

export const runtime = 'nodejs';

/**
 * GET /dashboard/api/r2/list
 * Biblioteca de imagens do editor de temas da loja do utilizador (as mais recentes primeiro).
 * Só devolve ficheiros do editor (`logo-|banner-|image-<uuid>.<ext>`), como o Supabase fazia.
 */
export async function GET() {
  const cfg = getR2Config();
  if (!cfg) return NextResponse.json({ items: [] });

  const dono = await resolveLojaDoUtilizador();
  if (!dono.ok) return NextResponse.json({ error: dono.error }, { status: dono.status });

  const prefix = `${R2_LOJAS_PREFIX}/${dono.lojaId}/`;
  try {
    const objs = await listObjects(cfg, prefix, 200);
    const items = objs
      .map((o: { key: string }) => ({ key: o.key, name: o.key.slice(prefix.length) }))
      .filter((o: { name: string }) => R2_MEDIA_FILE.test(o.name))
      .map((o: { key: string; name: string }) => ({ ...o, url: buildPublicUrl(cfg.publicBase, o.key) }));
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
