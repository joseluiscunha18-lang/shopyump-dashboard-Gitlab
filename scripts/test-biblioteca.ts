/**
 * Testes da biblioteca de imagens e do envio das fotos de produto.
 * Correr: npx tsx --tsconfig scripts/tsconfig.test.json scripts/test-biblioteca.ts
 */
import assert from 'node:assert/strict';

// localStorage mínimo (a biblioteca guarda por loja no navegador)
const mem = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
  },
};

async function main() {
  const lib = await import('../lib/produtos/imageLibrary');
  const { aindaLocal } = await import('../lib/produtos/fotos');
  let n = 0;
  const caso = (nome: string, fn: () => void) => { mem.clear(); fn(); n++; console.log(`  ✔ ${nome}`); };

  console.log('\nBiblioteca de imagens');
  caso('Máximo de 8 fotos por produto', () => {
    assert.equal(lib.MAX_FOTOS_PRODUTO, 8);
    assert.equal(lib.vagasRestantes(7), 1); assert.equal(lib.vagasRestantes(8), 0); assert.equal(lib.vagasRestantes(9), 0);
  });
  caso('Mesma imagem não duplica (sobe para o topo)', () => {
    lib.adicionarABiblioteca('a', 'foto.png'); lib.adicionarABiblioteca('a', 'foto.png');
    assert.equal(lib.listarBiblioteca('a').length, 1);
  });
  caso('Enquadramento separado do original e isolado por loja', () => {
    lib.adicionarABiblioteca('a', 'foto.png');
    lib.guardarEnquadramento('a', 'foto.png', { modo: 'contain', x: 30, y: 65, usarSemFundo: false });
    assert.equal(lib.listarBiblioteca('a')[0].original, 'foto.png');
    assert.equal(lib.lerEnquadramento('a', 'foto.png').x, 30);
    assert.equal(lib.lerEnquadramento('b', 'foto.png').x, 50);
  });
  caso('Bibliotecas de lojas diferentes não se misturam', () => {
    lib.adicionarABiblioteca('a', 'x.png');
    assert.equal(lib.listarBiblioteca('b').length, 0);
  });
  caso('Proporção vem do cartão de produto, não de outro rácio', () => {
    assert.equal(lib.proporcaoDeTexto(JSON.stringify({ sections: { hero: { settings: { ratio: '4/5' } } } })), '1/1');
    assert.equal(lib.proporcaoDeTexto(JSON.stringify({ sections: { products: { elements: { productCard: { aspectRatio: '4/5' } } } } })), '4/5');
    assert.equal(lib.proporcaoDeTexto('invalido'), '1/1');
  });

  console.log('\nEnvio das fotos ao guardar o produto');
  caso('blob: e data: ainda são locais (têm de ser enviados); URLs finais não', () => {
    assert.equal(aindaLocal('blob:https://app/abc'), true);
    assert.equal(aindaLocal('data:image/webp;base64,AAAA'), true);
    assert.equal(aindaLocal('https://img.shopyump.com/produtos/x.webp'), false);
    assert.equal(aindaLocal('https://xyz.supabase.co/storage/v1/object/public/p/x.jpg'), false);
  });

  console.log(`\n${n} testes passaram.\n`);
}
main();
