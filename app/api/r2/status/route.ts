import { NextResponse, type NextRequest } from 'next/server';
import { getR2Config, headBucket, isR2UploadEnabled, resolveLojaDoUtilizador } from '@/lib/r2/server';

export const runtime = 'nodejs';

/**
 * GET /dashboard/api/r2/status[?probe=1]   (só com sessão iniciada)
 * Diz se o R2 está configurado/ligado, SEM revelar nenhum valor secreto.
 * Com ?probe=1 testa as credenciais e a existência do bucket (HeadBucket).
 */
export async function GET(req: NextRequest) {
  const dono = await resolveLojaDoUtilizador();
  if (!dono.ok && dono.status === 401) return NextResponse.json({ error: dono.error }, { status: 401 });

  const cfg = getR2Config();
  const out: Record<string, unknown> = {
    configurado: cfg !== null,
    uploadsLigados: isR2UploadEnabled(),
    variaveisEmFalta: [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
      'R2_PUBLIC_URL',
    ].filter((n) => !process.env[n]?.trim()),
  };

  if (cfg && req.nextUrl.searchParams.get('probe') === '1') {
    try {
      await headBucket(cfg);
      out.credenciaisOk = true;
    } catch (e) {
      out.credenciaisOk = false;
      out.erro = e instanceof Error ? e.name : 'erro';
    }
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
