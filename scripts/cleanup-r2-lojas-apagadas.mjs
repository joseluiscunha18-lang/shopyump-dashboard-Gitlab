#!/usr/bin/env node
/**
 * Apaga no Cloudflare R2 tudo o que pertence às lojas indicadas abaixo — pastas
 * `produtos/<lojaId>/` e `lojas/<lojaId>/` inteiras.
 *
 * Só para usar depois de as lojas já terem sido apagadas na base de dados (como
 * em lib/r2/cleanup.ts, a limpeza do R2 corre sempre DEPOIS). Como a loja inteira
 * deixou de existir, não há verificação de "ainda está em uso" a fazer — a pasta
 * é exclusiva dela.
 *
 * Por omissão corre em modo simulação (só lista e conta). Só apaga de facto com --apply.
 *
 *   npm i                                      (instala @aws-sdk/*, já no package.json)
 *   node --env-file=.env.local scripts/cleanup-r2-lojas-apagadas.mjs           # simulação
 *   node --env-file=.env.local scripts/cleanup-r2-lojas-apagadas.mjs --apply   # apaga a sério
 *
 * As variáveis (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
 * R2_PUBLIC_URL) só existem no .env.local / Vercel — por isso corre-se localmente.
 */
import {
  S3Client, ListObjectsV2Command, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

// Lojas apagadas em 2026-10-25 (todas as contas exceto joseluiscunha18@gmail.com).
const LOJA_IDS = [
  '18772b54-a15e-45e2-a268-4b2e67262461',
  'eb8a46fb-a311-4df7-abeb-b438de40aeee',
  'cd13594b-c16f-4ec9-977d-98d808fa983a',
  '04ef7c2a-b3e0-47d9-b0e0-91d0447cdc1c',
  '216586fe-ed53-4a8c-903b-ed6c77ed8325',
  'f86fd8f8-6a0a-41e9-aee4-6ac614cfa605',
  '5d88647a-e55f-438b-9bbd-5ea51f9d7b33',
  'c9fdb384-a12e-41c6-ae0a-7bf094bea941',
  'c3bc26f6-11b5-4880-838b-291a4bfe63f6',
  'c8cb2211-6039-4006-84a7-fd2353c14795',
  '3da8d39f-d63e-44a9-b3dd-1b2fd3e7f058',
  '3c24c972-32f3-4d54-98de-dc9de9bd2c7c',
  '7a78ec2b-6308-42fc-94f5-d9e2e8595a33',
  '5dfa166c-7aa7-4e28-a275-a3b6423df380',
  'f0653e41-804d-440c-b315-46040511978b',
  '8d077b68-ee57-4a1f-88e6-90ee5d6c0ec1',
  '49650617-7849-40e1-95f5-f96c521c31ab',
  '975c4133-5ce6-4e2a-9310-2cc08235a1a3',
  'fd119f62-c0ed-42af-99b9-8bb6bb3b3b9d',
  'fb2f34a9-7fed-42da-8e38-1a092caedc9d',
  'b73432f8-687d-4727-87c7-497597b06592',
  '76353184-100c-4250-b901-14343d143001',
  '7c14ef18-b2bc-48a8-bd07-95385e95aab9',
  'a1bdfaf1-fa65-4bf9-9860-99946161bbca',
  'e598085b-b248-4bc4-8af7-01f9131edf2f',
  '0e5f3fa5-9635-4926-8620-99e2eb716fdf',
  '043377e3-75c8-41d7-a1d4-bae29e9af836',
  'f955d081-3d76-40ce-aa2e-ea2cdbeb5fd5',
  '39b3451b-0855-4f6f-8269-5fe9d95684d0',
  '55b43e1b-dc59-4ca6-935f-73b6f4d7a922',
  '4394c2e6-2b4a-448d-a6df-f5ff794bc840',
  '2f346a77-3909-45ab-bb43-8b184389249e',
  '27399dfe-fe6f-4cf1-9686-430476812512',
  'e1b2075a-e843-4020-8368-8ddfea43650e',
  'c3cb4979-8ed9-4eb7-9cee-376397cb9135',
  '0eba7cde-40da-4191-a3a8-9184225363f5',
  '7ebae94f-c7fe-43c7-9931-4518f5855717',
];

const need = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
const falta = need.filter((n) => !process.env[n]?.trim());
if (falta.length) { console.error('✗ Variáveis em falta:', falta.join(', ')); process.exit(1); }

const apply = process.argv.includes('--apply');
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
const Bucket = R2_BUCKET_NAME.trim();
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID.trim(), secretAccessKey: R2_SECRET_ACCESS_KEY.trim() },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

async function listAll(prefix) {
  const keys = [];
  let token;
  do {
    const out = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken: token }));
    for (const o of out.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function deleteKeys(keys) {
  // DeleteObjects aceita até 1000 chaves por pedido.
  for (let i = 0; i < keys.length; i += 1000) {
    const Objects = keys.slice(i, i + 1000).map((Key) => ({ Key }));
    await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects, Quiet: true } }));
  }
}

console.log(apply ? '🗑️  Modo real: vai apagar de facto.\n' : '🔎 Modo simulação (passa --apply para apagar).\n');

let total = 0;
for (const lojaId of LOJA_IDS) {
  const [produtos, lojas] = await Promise.all([
    listAll(`produtos/${lojaId}/`),
    listAll(`lojas/${lojaId}/`),
  ]);
  const keys = [...produtos, ...lojas];
  total += keys.length;
  if (keys.length === 0) continue;
  console.log(`${lojaId}: ${keys.length} ficheiro(s)`);
  if (apply) await deleteKeys(keys);
}

console.log(`\n${apply ? 'Apagados' : 'Encontrados'}: ${total} ficheiro(s) em ${LOJA_IDS.length} loja(s).`);
if (!apply && total > 0) console.log('Corre de novo com --apply para apagar a sério.');
