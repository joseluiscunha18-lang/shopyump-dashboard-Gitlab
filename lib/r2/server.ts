import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@/lib/supabase/server';
import { normalizePublicBase, type R2ImageType } from '@/lib/r2/shared';

/**
 * Cloudflare R2 (API compatível com S3) — SÓ no servidor.
 * As credenciais nunca saem daqui: o browser recebe apenas um URL pré-assinado
 * de curta duração para UM ficheiro.
 *
 * Variáveis (Vercel + .env.local):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 *   R2_UPLOADS_ENABLED=true   ← interruptor: só ligar DEPOIS do teste (scripts/r2-smoke-test.mjs)
 */
export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
};

/** Devolve a configuração completa, ou null se faltar alguma variável (ou o URL for inválido). */
export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicBase = normalizePublicBase(process.env.R2_PUBLIC_URL);
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

/** Novos uploads só vão para o R2 quando a configuração está completa E o interruptor está ligado. */
export function isR2UploadEnabled(): boolean {
  return process.env.R2_UPLOADS_ENABLED === 'true' && getR2Config() !== null;
}

function client(cfg: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    // Versões recentes do SDK acrescentam checksums CRC32 aos URLs pré-assinados, o que
    // faz o PUT feito pelo browser falhar no R2. Só calcular quando o serviço exige.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/** URL de upload (PUT) válido 5 min, preso à chave, ao tipo e ao tamanho exatos. */
export async function presignPut(cfg: R2Config, key: string, type: R2ImageType, size: number) {
  return getSignedUrl(
    client(cfg),
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: type, ContentLength: size }),
    { expiresIn: 300 }
  );
}

export async function deleteObject(cfg: R2Config, key: string): Promise<void> {
  await client(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}

/** Confirma que as credenciais funcionam e o bucket existe (não lê nem escreve objetos). */
export async function headBucket(cfg: R2Config): Promise<void> {
  await client(cfg).send(new HeadBucketCommand({ Bucket: cfg.bucket }));
}

/**
 * Autenticação + propriedade da loja. A loja SEMPRE vem da sessão (tabela `lojas`,
 * `perfil_id = user.id`), nunca do corpo do pedido. Se o utilizador enviar um `lojaId`,
 * tem de ser uma das lojas dele.
 */
export async function resolveLojaDoUtilizador(
  pedidoLojaId?: unknown
): Promise<{ ok: true; lojaId: string } | { ok: false; status: number; error: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, status: 401, error: 'Sessão inválida.' };

  const { data: lojas, error } = await supabase.from('lojas').select('id').eq('perfil_id', auth.user.id);
  if (error || !lojas?.length) return { ok: false, status: 403, error: 'Sem loja associada.' };

  const ids = lojas.map((l: { id: string }) => l.id);
  if (typeof pedidoLojaId === 'string' && pedidoLojaId) {
    return ids.includes(pedidoLojaId)
      ? { ok: true, lojaId: pedidoLojaId }
      : { ok: false, status: 403, error: 'Esta loja não é tua.' };
  }
  if (ids.length === 1) return { ok: true, lojaId: ids[0] };
  return { ok: false, status: 400, error: 'Indica a loja.' };
}

/** Lista objetos sob um prefixo (mais recentes primeiro). */
export async function listObjects(cfg: R2Config, prefix: string, limit = 200) {
  const out = await client(cfg).send(
    new ListObjectsV2Command({ Bucket: cfg.bucket, Prefix: prefix, MaxKeys: Math.min(limit, 1000) })
  );
  return (out.Contents ?? [])
    .filter((o: { Key?: string }) => !!o.Key)
    .map((o: { Key?: string; LastModified?: Date }) => ({ key: o.Key as string, lastModified: o.LastModified ?? null }))
    .sort((a: { lastModified: Date | null }, b: { lastModified: Date | null }) =>
      (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
}
