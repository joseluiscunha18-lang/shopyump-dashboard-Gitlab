/**
 * Testes das orientações de primeiro acesso (lógica de estado + cabeçalho).
 * Correr: npx tsx --tsconfig scripts/tsconfig.test.json scripts/test-orientacoes.tsx
 * Os triggers da base de dados (o que conta como "concluído") estão validados à parte, em
 * supabase/migration_orientacoes_onboarding.sql (ver README da migração).
 */
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calcularOnboarding, type MarcosPorNome } from '../lib/onboarding/orientacoes';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { normalizarPagamentos, validarPagamentos } from '../lib/settings/model';

const OK = { concluido_em: '2026-10-25T10:00:00Z', dispensado: false };
const DISP = { concluido_em: null, dispensado: true };
const html = (m: MarcosPorNome) => renderToStaticMarkup(createElement(DashboardHeader, { cabecalho: calcularOnboarding(m).cabecalho }));
const texto = (h: string) => h.replace(/<[^>]+>/g, '|').split('|').filter(Boolean);

let n = 0;
const caso = (nome: string, fn: () => void) => { fn(); n++; console.log(`  ✔ ${nome}`); };

const A = ['Bem-vindo à Shopyump!', 'Por onde queres começar?'];
const B = ['Continua a preparar a tua loja'];
const C = ['Acompanha o teu negócio'];
const TODOS = ['primeiro_produto', 'personalizar_loja', 'configurar_pagamentos', 'partilhar_loja'];
const sem = (...fora: string[]) => TODOS.filter((m) => !fora.includes(m));

console.log('\nCenários');
caso('1. Novo utilizador: estado A, 4 cartões, cabeçalho A', () => {
  const e = calcularOnboarding({});
  assert.equal(e.fase, 'primeiro_acesso'); assert.deepEqual(e.cartoes, TODOS);
  assert.deepEqual(texto(html({})), A);
});
caso('2. Cria o produto primeiro: B, sem o cartão de produtos', () => {
  const m: MarcosPorNome = { primeiro_produto: OK }; const e = calcularOnboarding(m);
  assert.equal(e.fase, 'em_progresso'); assert.deepEqual(e.cartoes, sem('primeiro_produto')); assert.deepEqual(texto(html(m)), B);
});
caso('3. Começa pela personalização: B, restantes 3 cartões', () => {
  const m: MarcosPorNome = { personalizar_loja: OK }; const e = calcularOnboarding(m);
  assert.equal(e.fase, 'em_progresso'); assert.deepEqual(e.cartoes, sem('personalizar_loja')); assert.deepEqual(texto(html(m)), B);
});
caso('4. Começa pelos pagamentos: B', () => {
  const m: MarcosPorNome = { configurar_pagamentos: OK }; const e = calcularOnboarding(m);
  assert.equal(e.fase, 'em_progresso'); assert.deepEqual(e.cartoes, sem('configurar_pagamentos')); assert.deepEqual(texto(html(m)), B);
});
caso('5. Copia o link antes das outras: B', () => {
  const m: MarcosPorNome = { partilhar_loja: OK }; const e = calcularOnboarding(m);
  assert.equal(e.fase, 'em_progresso'); assert.deepEqual(e.cartoes, sem('partilhar_loja')); assert.deepEqual(texto(html(m)), B);
});
caso('6. Abre uma orientação e sai sem concluir: nada muda (continua A)', () => {
  // visitar páginas não grava nada → os marcos são exatamente os mesmos
  assert.deepEqual(calcularOnboarding({}), calcularOnboarding({}));
  assert.equal(calcularOnboarding({}).fase, 'primeiro_acesso');
});
caso('7. Dispensa um cartão e atualiza: continua A, sem esse cartão, e NÃO conta como concluído', () => {
  const m: MarcosPorNome = { personalizar_loja: DISP }; const e = calcularOnboarding(m);
  assert.equal(e.fase, 'primeiro_acesso'); assert.deepEqual(e.cartoes, sem('personalizar_loja'));
  assert.equal(e.estados.personalizar_loja, 'dispensada'); assert.deepEqual(texto(html(m)), A);
});
caso('8. Dispensa os 4 sem concluir nenhuma: C (fim do onboarding)', () => {
  const m: MarcosPorNome = Object.fromEntries(TODOS.map((k) => [k, DISP]));
  const e = calcularOnboarding(m);
  assert.equal(e.fase, 'concluido'); assert.deepEqual(e.cartoes, []); assert.deepEqual(texto(html(m)), C);
  assert.ok(Object.values(e.estados).every((s) => s === 'dispensada'));
});
caso('9. Conclui as 4: C', () => {
  const m: MarcosPorNome = Object.fromEntries(TODOS.map((k) => [k, OK]));
  const e = calcularOnboarding(m);
  assert.equal(e.fase, 'concluido'); assert.deepEqual(e.cartoes, []); assert.deepEqual(texto(html(m)), C);
});
caso('10. Conclui uma, sai e volta (estado recalculado do que está gravado): B estável; concluir outra não muda o título', () => {
  const m1: MarcosPorNome = { primeiro_produto: OK };
  assert.deepEqual(texto(html(m1)), B); assert.deepEqual(texto(html(m1)), B); // "novo acesso"
  const m2: MarcosPorNome = { primeiro_produto: OK, partilhar_loja: OK };
  assert.deepEqual(texto(html(m2)), B);
});

console.log('\nRegras adicionais');
caso('Concluída prevalece sobre dispensada (dispensou e fez depois → conta como concluída → B)', () => {
  const m: MarcosPorNome = { configurar_pagamentos: { concluido_em: '2026-10-25T10:00:00Z', dispensado: true } };
  const e = calcularOnboarding(m);
  assert.equal(e.estados.configurar_pagamentos, 'concluida'); assert.equal(e.fase, 'em_progresso'); assert.deepEqual(texto(html(m)), B);
});
caso('Uma concluída + três dispensadas → C (não há cartões)', () => {
  const m: MarcosPorNome = { primeiro_produto: OK, personalizar_loja: DISP, configurar_pagamentos: DISP, partilhar_loja: DISP };
  assert.equal(calcularOnboarding(m).fase, 'concluido');
});
caso('Linha sem concluído nem dispensado = pendente', () => {
  const m: MarcosPorNome = { primeiro_produto: { concluido_em: null, dispensado: false } };
  assert.equal(calcularOnboarding(m).estados.primeiro_produto, 'pendente');
  assert.equal(calcularOnboarding(m).fase, 'primeiro_acesso');
});
caso('Ordem dos cartões é fixa, independente da ordem de conclusão', () => {
  assert.deepEqual(calcularOnboarding({ partilhar_loja: OK, configurar_pagamentos: OK }).cartoes, ['primeiro_produto', 'personalizar_loja']);
});
caso('Cabeçalho: nunca "Olá", "INÍCIO" nem subtítulo; só o estado A tem o texto pequeno', () => {
  const todosOK = Object.fromEntries(TODOS.map((k) => [k, OK])) as MarcosPorNome;
  for (const m of [{}, { primeiro_produto: OK }, todosOK] as MarcosPorNome[]) {
    const h = html(m);
    assert.ok(!/Olá|INÍCIO|Início/i.test(h), h);
    assert.equal((h.match(/<h1/g) || []).length, 1);
  }
  assert.equal((html({}).match(/<p/g) || []).length, 1);                    // A: 1 texto pequeno + título
  assert.equal((html({ primeiro_produto: OK }).match(/<p/g) || []).length, 0); // B: só o título
  assert.equal((html(todosOK).match(/<p/g) || []).length, 0);               // C: só o título
  assert.ok(/text-\[14px\][^"]*text-muted-foreground/.test(html({})));      // pequeno e em cor secundária
});

console.log('\nPagamentos (validação)');
caso('Transferência exige banco, titular e conta', () => {
  assert.equal(validarPagamentos({ ...normalizarPagamentos({}), transferencia: true }).ok, false);
  assert.equal(validarPagamentos({ ...normalizarPagamentos({}), transferencia: true, banco: 'BIM', titular: 'Ana', conta: '0001' }).ok, true);
});
caso('Só dinheiro na entrega é válido; tudo desligado também (grava, mas não conclui)', () => {
  assert.equal(validarPagamentos({ ...normalizarPagamentos({}), dinheiroEntrega: true }).ok, true);
  assert.equal(validarPagamentos(normalizarPagamentos({})).ok, true);
});
caso('Rejeita lixo e tipos errados; normaliza e limita tamanhos', () => {
  assert.equal(validarPagamentos(null).ok, false);
  assert.equal(validarPagamentos({ transferencia: 'sim', dinheiroEntrega: false }).ok, false);
  const v = normalizarPagamentos({ transferencia: true, banco: '  BIM  ', conta: 'x'.repeat(500), titular: 5 });
  assert.equal(v.banco, 'BIM'); assert.equal(v.conta.length, 60); assert.equal(v.titular, ''); assert.equal(v.dinheiroEntrega, false);
});

console.log(`\n${n} testes passaram.\n`);
