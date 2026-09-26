'use client';

import { useMemo, useState } from 'react';
import { CartProvider, useCart } from './cart/CartContext';
import { StoreHeader } from './components/StoreHeader';
import { HeroBanner } from './components/HeroBanner';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetail } from './components/ProductDetail';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import { InstitutionalView } from './components/InstitutionalView';
import { PRODUTOS_DEMO } from './demo/demoData';
import type { StoreThemeProps } from '../types';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

/**
 * Tema 'default' (identidade visual "Lume") — minimalista, premium,
 * funcional. Ecrãs geridos por estado local (sem rotas novas): loja →
 * produto/carrinho/checkout/institucional. Ver nota de arquitectura em
 * versões anteriores deste ficheiro sobre porquê isto não usa rotas
 * Next.js próprias.
 *
 * MODO DE DEMONSTRAÇÃO: quando a loja ainda não tem nenhum produto real
 * (`produtos.length === 0`), a grelha mostra os `PRODUTOS_DEMO` (nome,
 * preço e imagem fictícios, ver ./demo/demoData.ts) — só para o visitante
 * perceber a forma da loja. Nesse estado, os cartões não abrem detalhe
 * nem têm "Adicionar" (ver `emModoDemo` passado a ProductGrid/ProductCard)
 * — não é suposto ser possível comprar um produto que não existe. Assim
 * que existir 1 produto real, os fictícios desaparecem sozinhos — nunca
 * chegam a tocar a base de dados, não há nada para "limpar".
 */
type View =
  | { tipo: 'loja' }
  | { tipo: 'carrinho' }
  | { tipo: 'checkout' }
  | { tipo: 'produto'; produto: ProdutoPublico }
  | { tipo: 'institucional'; campo: 'sobre' | 'entrega' | 'termos' };

function DefaultThemeInterno({ loja, produtos }: StoreThemeProps) {
  const [view, setView] = useState<View>({ tipo: 'loja' });
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState('');
  const { adicionar, contagem } = useCart();

  const emModoDemo = produtos.length === 0;
  const produtosBase = emModoDemo ? PRODUTOS_DEMO : produtos;

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtosBase;
    return produtosBase.filter(
      (p) => p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo),
    );
  }, [produtosBase, busca]);

  function adicionarAoCarrinho(p: ProdutoPublico) {
    adicionar({ produtoId: p.id, nome: p.nome, preco: p.preco_promo ?? p.preco, foto: p.fotos[0] ?? null });
  }

  const infoInstitucional: Record<'sobre' | 'entrega' | 'termos', { eyebrow: string; titulo: string; ativo: boolean; conteudo: string | null }> = {
    sobre: { eyebrow: 'A loja', titulo: 'Sobre', ativo: !!loja.mostrar_sobre, conteudo: loja.conteudo_sobre },
    entrega: { eyebrow: 'Informação', titulo: 'Entregas', ativo: !!loja.mostrar_entrega, conteudo: loja.conteudo_entrega },
    termos: { eyebrow: 'Informação', titulo: 'Termos e privacidade', ativo: !!loja.mostrar_termos, conteudo: loja.conteudo_termos },
  };

  const linksRedes = [
    loja.mostrar_instagram && loja.instagram ? { label: 'Instagram', href: loja.instagram } : null,
    loja.mostrar_facebook && loja.facebook ? { label: 'Facebook', href: loja.facebook } : null,
    loja.mostrar_tiktok && loja.tiktok ? { label: 'TikTok', href: loja.tiktok } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const linksInstitucionais = (['sobre', 'entrega', 'termos'] as const).filter((c) => infoInstitucional[c].ativo && infoInstitucional[c].conteudo);

  const tituloVoltar =
    view.tipo === 'carrinho'
      ? { titulo: 'Continuar a comprar', onClick: () => setView({ tipo: 'loja' }) }
      : view.tipo === 'checkout'
        ? { titulo: 'Voltar ao carrinho', onClick: () => setView({ tipo: 'carrinho' }) }
        : view.tipo === 'produto'
          ? { titulo: 'Voltar', onClick: () => setView({ tipo: 'loja' }) }
          : view.tipo === 'institucional'
            ? { titulo: 'Voltar à loja', onClick: () => setView({ tipo: 'loja' }) }
            : undefined;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-white font-[family-name:'Manrope',_sans-serif] text-[oklch(0.24353_0_0)]">
      <StoreHeader
        nomeLoja={loja.nome}
        voltar={tituloVoltar}
        buscaAberta={buscaAberta}
        onToggleBusca={() => setBuscaAberta((v) => !v)}
        valorBusca={busca}
        onMudaBusca={setBusca}
        contagemCarrinho={contagem}
        onAbrirCarrinho={() => setView({ tipo: 'carrinho' })}
      />

      {view.tipo === 'loja' && (
        <>
          <HeroBanner loja={loja} />
          <ProductGrid
            produtos={produtosFiltrados}
            emModoDemo={emModoDemo}
            onAdicionar={adicionarAoCarrinho}
            onAbrirDetalhe={(p) => setView({ tipo: 'produto', produto: p })}
          />

          {(linksInstitucionais.length > 0 || linksRedes.length > 0) && (
            <footer className="flex flex-col gap-4 border-t border-[oklch(0.88224_0_0)] px-4 py-6">
              {linksInstitucionais.length > 0 && (
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {linksInstitucionais.map((campo) => (
                    <button
                      key={campo}
                      type="button"
                      onClick={() => setView({ tipo: 'institucional', campo })}
                      className="text-[12px] font-bold text-[oklch(0.24353_0_0)] underline underline-offset-2"
                    >
                      {infoInstitucional[campo].titulo}
                    </button>
                  ))}
                </div>
              )}
              {linksRedes.length > 0 && (
                <div className="flex gap-4">
                  {linksRedes.map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-[oklch(0.52081_0_0)]">
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </footer>
          )}
        </>
      )}

      {view.tipo === 'produto' && (
        <ProductDetail produto={view.produto} onAdicionar={() => adicionarAoCarrinho(view.produto)} />
      )}

      {view.tipo === 'carrinho' && (
        <CartView onFinalizar={() => setView({ tipo: 'checkout' })} onContinuarComprando={() => setView({ tipo: 'loja' })} />
      )}

      {view.tipo === 'checkout' && <CheckoutView loja={loja} />}

      {view.tipo === 'institucional' && infoInstitucional[view.campo].conteudo && (
        <InstitutionalView
          eyebrow={infoInstitucional[view.campo].eyebrow}
          titulo={infoInstitucional[view.campo].titulo}
          conteudo={infoInstitucional[view.campo].conteudo as string}
        />
      )}
    </div>
  );
}

export function DefaultTheme(props: StoreThemeProps) {
  return (
    <CartProvider lojaId={props.loja.id}>
      <DefaultThemeInterno {...props} />
    </CartProvider>
  );
}
