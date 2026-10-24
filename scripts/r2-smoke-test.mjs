#!/usr/bin/env node
/**
 * Teste de fumo do Cloudflare R2 — corre ANTES de ligar R2_UPLOADS_ENABLED.
 *
 *   npm i            (instala @aws-sdk/*)
 *   node --env-file=.env.local scripts/r2-smoke-test.mjs
 *
 * Faz, pela ordem: (1) HeadBucket  (2) PUT com URL pré-assinado, tal como o browser
 * (3) GET pelo domínio público R2_PUBLIC_URL  (4) apaga o ficheiro de teste.
 * Escreve só em `_smoke-test/` e remove o que criou. Não imprime credenciais.
 */
import {
  S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const need = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
const falta = need.filter((n) => !process.env[n]?.trim());
if (falta.length) { console.error('✗ Variáveis em falta:', falta.join(', ')); process.exit(1); }

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
const base = process.env.R2_PUBLIC_URL.trim().replace(/\/+$/, '');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID.trim(), secretAccessKey: R2_SECRET_ACCESS_KEY.trim() },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
const Bucket = R2_BUCKET_NAME.trim();
const Key = `_smoke-test/${crypto.randomUUID()}.png`;
// PNG 1x1 válido
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

let passo = 0;
const ok = (m) => console.log(`✓ ${++passo}. ${m}`);
const ko = (m, e) => { console.error(`✗ ${++passo}. ${m}`, e?.name ?? e ?? ''); process.exitCode = 1; };

try { await s3.send(new HeadBucketCommand({ Bucket })); ok('Credenciais válidas e bucket existe'); }
catch (e) { ko('HeadBucket falhou (credenciais/nome do bucket)', e); process.exit(1); }

let uploaded = false;
try {
  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket, Key, ContentType: 'image/png', ContentLength: png.length,
  }), { expiresIn: 120 });
  const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: png });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  uploaded = true; ok('PUT pré-assinado aceite (igual ao que o browser faz)');
} catch (e) { ko('PUT pré-assinado falhou', e); }

if (uploaded) {
  try {
    const r = await fetch(`${base}/${Key}`);
    const ct = r.headers.get('content-type');
    if (!r.ok) throw new Error(`HTTP ${r.status} — o domínio está ligado ao bucket e com acesso público?`);
    ok(`Leitura pública OK em ${base} (content-type: ${ct})`);
  } catch (e) { ko('GET público falhou', e); }

  try { await s3.send(new DeleteObjectCommand({ Bucket, Key })); ok('Ficheiro de teste apagado'); }
  catch (e) { ko(`Não consegui apagar ${Key} (apaga à mão no painel)`, e); }
}

console.log(process.exitCode ? '\nResultado: FALHOU — NÃO ligues R2_UPLOADS_ENABLED.' : '\nResultado: TUDO OK — já podes definir R2_UPLOADS_ENABLED=true.');
console.log('Nota: o CORS do bucket (PUT a partir de shopyump.com) testa-se no browser, ver passo final.');
