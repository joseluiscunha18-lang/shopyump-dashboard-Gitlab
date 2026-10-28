/**
 * Testes das notificações reais (boas-vindas e stock).
 * Correr: npx tsx --tsconfig scripts/tsconfig.test.json scripts/test-notificacoes.ts
 */
import assert from 'node:assert/strict';
import { hashId, quandoRel, notificacaoBoasVindas, notificacoesStock, LIMITE_STOCK_BAIXO, MAX_AVISOS_STOCK } from '../lib/notificacoes/gerar';

let n = 0;
const caso = (nome: string, fn: () => void) => { fn(); n++; console.log(`  ✔ ${nome}`); };
const vazio = () => new Set<number>();
const AGORA = Date.parse('2026-10-28T12:00:00Z');
const loja = { id: 'loja-1', nome: 'Casa Maputo', created_at: '2026-10-27T12:00:00Z' };

console.log('\nBoas-vindas');
caso('Aparece sempre que não foi eliminada, por ler, com o nome da loja e link para os produtos', () => {
  const [b] = notificacaoBoasVindas(loja, vazio(), vazio(), AGORA);
  assert.equal(b.tipo, 'boas_vindas'); assert.equal(b.titulo, 'Bem-vindo à Shopyump!');
  assert.ok(b.texto.includes('Casa Maputo')); assert.equal(b.lida, false); assert.equal(b.link, '/produtos');
  assert.equal(b.quando, 'há 1 dias');
});
caso('Sem nome da loja não mostra «null»', () => {
  const [b] = notificacaoBoasVindas({ ...loja, nome: null }, vazio(), vazio(), AGORA);
  assert.ok(!/null|«»/.test(b.texto));
});
caso('Lida persiste (vem do conjunto de lidas) e eliminada deixa de aparecer', () => {
  const id = notificacaoBoasVindas(loja, vazio(), vazio(), AGORA)[0].id;
  assert.equal(notificacaoBoasVindas(loja, new Set([id]), vazio(), AGORA)[0].lida, true);
  assert.deepEqual(notificacaoBoasVindas(loja, vazio(), new Set([id]), AGORA), []);
});
caso('Cada loja tem a sua (ids diferentes)', () => {
  assert.notEqual(notificacaoBoasVindas(loja, vazio(), vazio())[0].id, notificacaoBoasVindas({ ...loja, id: 'loja-2' }, vazio(), vazio())[0].id);
});

console.log('\nStock');
const A = (id: string, qtd: number, nome = 'Produto ' + id) => ({ id, nome, qtd });
caso('Esgotado (0) e stock baixo (≤ limite) com textos próprios', () => {
  const l = notificacoesStock([A('a', 0, 'Camisola'), A('b', 3, 'Boné'), A('c', 1, 'Mala')], vazio(), vazio());
  assert.equal(l.length, 3);
  assert.equal(l[0].titulo, '«Camisola» está esgotado');
  assert.equal(l[1].texto, 'Restam 1 unidade.'); assert.equal(l[2].texto, 'Restam 3 unidades.');
  assert.ok(l.every((x) => x.tipo === 'stock' && x.link === '/produtos' && x.lida === false));
});
caso('Acima do limite não gera aviso; no limite gera', () => {
  assert.equal(notificacoesStock([A('a', LIMITE_STOCK_BAIXO + 1)], vazio(), vazio()).length, 0);
  assert.equal(notificacoesStock([A('a', LIMITE_STOCK_BAIXO)], vazio(), vazio()).length, 1);
});
caso('Os mais urgentes (menos unidades) vêm primeiro', () => {
  const l = notificacoesStock([A('a', 4), A('b', 0), A('c', 2)], vazio(), vazio());
  assert.deepEqual(l.map((x) => x.titulo.includes('esgotado') ? 0 : Number(x.texto.match(/\d+/)![0])), [0, 2, 4]);
});
caso('Id estável para o mesmo produto/nível; muda de «baixo» para «esgotado» (volta a ficar por ler)', () => {
  const a = notificacoesStock([A('a', 3)], vazio(), vazio())[0].id;
  assert.equal(notificacoesStock([A('a', 2)], vazio(), vazio())[0].id, a);
  assert.notEqual(notificacoesStock([A('a', 0)], new Set([a]), vazio())[0].id, a);
  assert.equal(notificacoesStock([A('a', 0)], new Set([a]), vazio())[0].lida, false);
});
caso('Lida e eliminada respeitadas', () => {
  const id = notificacoesStock([A('a', 3)], vazio(), vazio())[0].id;
  assert.equal(notificacoesStock([A('a', 3)], new Set([id]), vazio())[0].lida, true);
  assert.deepEqual(notificacoesStock([A('a', 3)], vazio(), new Set([id])), []);
});
caso('Máximo de avisos mostrados', () => {
  const muitos = Array.from({ length: MAX_AVISOS_STOCK + 10 }, (_, i) => A('p' + i, 1));
  assert.equal(notificacoesStock(muitos, vazio(), vazio()).length, MAX_AVISOS_STOCK);
});
caso('Sem alertas = sem notificações', () => assert.deepEqual(notificacoesStock([], vazio(), vazio()), []));

console.log('\nUtilitários');
caso('hashId é determinístico, positivo e distingue entradas', () => {
  assert.equal(hashId('x'), hashId('x')); assert.ok(hashId('x') >= 0); assert.notEqual(hashId('x'), hashId('y'));
});
caso('quandoRel', () => {
  assert.equal(quandoRel('2026-10-28T12:00:00Z', AGORA), 'agora mesmo');
  assert.equal(quandoRel('2026-10-28T11:30:00Z', AGORA), 'há 30 min');
  assert.equal(quandoRel('2026-10-28T09:00:00Z', AGORA), 'há 3 h');
  assert.equal(quandoRel('lixo', AGORA), '');
});

console.log(`\n${n} testes passaram.\n`);
