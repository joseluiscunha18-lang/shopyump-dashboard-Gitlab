import { NextResponse, type NextRequest } from 'next/server';
import {
  getR2Config,
  isR2UploadEnabled,
  presignPut,
  resolveLojaDoUtilizador,
} from '@/lib/r2/server';
import {
  buildLojaKey,
  buildProdutoKey,
  buildPublicUrl,
  isAllowedType,
  isMediaKind,
  isValidSize,
} from '@/lib/r2/shared';

export const runtime = 'nodejs';

/**
 * POST /dashboard/api/r2/upload-url
 * Corpo: { area?: 'produtos'|'lojas', kind?: 'logo'|'banner'|'image',
 *          contentType: 'image/jpeg'|'image/png'|'image/webp', size: number, lojaId?: string }
 * Resposta: { uploadUrl, publicUrl, key, headers } — o browser faz PUT do ficheiro em `uploadUrl`.
 *
 *  produtos → produtos/<loja>/<uuid>.<ext>           (fotos de produto)
 *  lojas    → lojas/<loja>/<uuid>.<ext>              (banner da loja)
 *           → lojas/<loja>/<kind>-<uuid>.<ext>       (biblioteca do editor de temas)
 *
 * 501 → R2 ainda não está ligado (R2_UPLOADS_ENABLED): o cliente usa o Supabase Storage (transição).
 */
export async function POST(req: NextRequest) {
  const cfg = getR2Config();
  if (!cfg || !isR2UploadEnabled()) {
    return NextResponse.json({ error: 'r2_disabled' }, { status: 501 });
  }

  const body = await req.json().catch(() => null);
  const dono = await resolveLojaDoUtilizador(body?.lojaId);
  if (!dono.ok) return NextResponse.json({ error: dono.error }, { status: dono.status });

  if (!body || !isAllowedType(body.contentType)) {
    return NextResponse.json({ error: 'Formato inválido. Usa JPG, PNG ou WEBP.' }, { status: 415 });
  }
  if (!isValidSize(body.size)) {
    return NextResponse.json({ error: 'Imagem demasiado grande (máx. 10 MB).' }, { status: 413 });
  }

  const fileId = crypto.randomUUID();
  let key: string;
  if (body.area === 'lojas') {
    key = buildLojaKey(dono.lojaId, fileId, body.contentType, isMediaKind(body.kind) ? body.kind : undefined);
  } else {
    key = buildProdutoKey(dono.lojaId, fileId, body.contentType);
  }

  const uploadUrl = await presignPut(cfg, key, body.contentType, body.size);
  return NextResponse.json(
    {
      uploadUrl,
      publicUrl: buildPublicUrl(cfg.publicBase, key),
      key,
      headers: { 'Content-Type': body.contentType },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
