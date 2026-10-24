'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Uploads de imagens da loja num só sítio.
 *
 * Com `R2_UPLOADS_ENABLED=true` no servidor, TUDO o que é novo vai para o Cloudflare R2
 * (https://img.shopyump.com) e o Supabase Storage deixa de receber ficheiros — se o R2
 * falhar, o utilizador vê o erro (não há desvio silencioso para o Supabase).
 * Enquanto o R2 não estiver ligado (o servidor responde 501), mantém-se o comportamento
 * antigo (Supabase), só como transição até ao go-live.
 * As imagens antigas continuam nos seus URLs do Supabase.
 */
import { BUCKETS } from '@/lib/storageBuckets';
import { asset } from '@/lib/domains';
import { optimizeImage } from '@/lib/imageOptimize';
import { R2_MAX_BYTES, sniffImageType, type R2MediaKind } from '@/lib/r2/shared';
export { BUCKETS };

type R2Result =
  | { ok: true; url: string; key: string }
  | { ok: false; disabled: boolean; error: string };

/**
 * Envia uma imagem para o R2 (URL pré-assinado). `area`: fotos de produto ou imagens da loja.
 * `disabled: true` = o R2 ainda não está ligado no servidor.
 */
export async function uploadToR2(
  original: File,
  lojaId: string,
  area: 'produtos' | 'lojas',
  kind?: R2MediaKind
): Promise<R2Result> {
  try {
    // Compressão inteligente (sem cortar, sem recomprimir o que já está bom; se falhar, usa o original).
    const file = await optimizeImage(original, area);

    // O tipo vem dos primeiros bytes, não do nome nem do `file.type`.
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const type = sniffImageType(head) ?? 'application/octet-stream';

    const res = await fetch(asset('/api/r2/upload-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ area, kind, contentType: type, size: file.size, lojaId }),
    });
    if (res.status === 501) return { ok: false, disabled: true, error: 'r2_disabled' };
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, disabled: false, error: j?.error ?? 'Não foi possível enviar a imagem.' };
    }

    const { uploadUrl, publicUrl, key, headers } = (await res.json()) as {
      uploadUrl: string;
      publicUrl: string;
      key: string;
      headers: Record<string, string>;
    };

    const put = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
    if (!put.ok) {
      console.warn('[R2] PUT falhou:', put.status);
      return { ok: false, disabled: false, error: 'Não foi possível enviar a imagem. Tenta novamente.' };
    }
    return { ok: true, url: publicUrl, key };
  } catch (err) {
    console.warn('[R2] upload falhou:', err);
    return { ok: false, disabled: false, error: 'Não foi possível enviar a imagem. Verifica a ligação e tenta novamente.' };
  }
}

export async function uploadImage(
  bucket: (typeof BUCKETS)[keyof typeof BUCKETS],
  file: File,
  pathPrefix: string
): Promise<{ url: string | null; error: string | null }> {
  const r2 = await uploadToR2(file, pathPrefix, bucket === BUCKETS.lojas ? 'lojas' : 'produtos');
  if (r2.ok) return { url: r2.url, error: null };
  if (!r2.disabled) return { url: null, error: r2.error };

  // ── Transição: R2 ainda desligado → Supabase Storage (comportamento antigo) ──
  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export { R2_MAX_BYTES };
