'use client';

import { useMemo, useState } from 'react';
import { CartProvider, useCart } from './cart/CartContext';
import { StoreHeader } from './components/StoreHeader';
import { HeroBanner } from './components/HeroBanner';
import { ProductGrid } from './components/ProductGrid';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import type { StoreThemeProps } from '../types';

/**
 * Tema 'default' — minimalista, premium, funcional. NÃO é o design
 * final da marca Shopyump, é o tema que qualquer loja tem por omissão.
 *
 * Estrutura em 3 "ecrãs" geridos por estado local (sem rotas novas):
 * loja → carrinho → checkout. Isto é uma decisão deliberada: manter o
 * fluxo de compra dentro do próprio componente do tema, em vez de criar
 * rotas Next.js (/loja/[slug]/carrinho, /checkout), para que a rota
 * pública continue sem saber nada sobre a estrutura interna de um tema
 * — um tema futuro pode ter um fluxo de compra completamente diferente
 * (ou nenhum) sem precisar de tocar em app/loja/[slug]/page.tsx.
 */
type View = 'loja' | 'carrinho' | 'checkout';

function DefaultThemeInterno({ loja, produtos }: StoreThemeProps) {
  const [view, setView] = useState<View>('loja');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState('');
  const { adicionar, contagem } = useCart();

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo));
  }, [produtos, busca]);

  const linksRedes = [
    loja.mostrar_instagram && loja.instagram ? { label: 'Instagram', href: loja.instagram } : null,
    loja.mostrar_facebook && loja.facebook ? { label: 'Facebook', href: loja.facebook } : null,
    loja.mostrar_tiktok && loja.tiktok ? { label: 'TikTok', href: loja.tiktok } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const temInfoRodape =
    linksRedes.length > 0 ||
    (loja.mostrar_sobre && loja.conteudo_sobre) ||
    (loja.mostrar_entrega && loja.conteudo_entrega) ||
    (loja.mostrar_termos && loja.conteudo_termos);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-white font-[family-name:var(--font-inter)] text-[#141414]">
      <StoreHeader
        nomeLoja={loja.nome}
        voltar={
          view === 'carrinho'
            ? { titulo: 'Continuar a comprar', onClick: () => setView('loja') }
            : view === 'checkout'
              ? { titulo: 'Voltar ao carrinho', onClick: () => setView('carrinho') }
              : undefined
        }
        buscaAberta={buscaAberta}
        onToggleBusca={() => setBuscaAberta((v) => !v)}
        valorBusca={busca}
        onMudaBusca={setBusca}
        contagemCarrinho={contagem}
        onAbrirCarrinho={() => setView('carrinho')}
      />

      {view === 'loja' && (
        <>
          <HeroBanner loja={loja} />
          <ProductGrid
            produtos={produtosFiltrados}
            onAdicionar={(p) =>
              adicionar({
                produtoId: p.id,
                nome: p.nome,
                preco: p.preco_promo ?? p.preco,
                foto: p.fotos[0] ?? null,
              })
            }
          />

          {temInfoRodape && (
            <footer className="flex flex-col gap-3 border-t border-[#EAE7E1] px-4 py-6 text-[12px] text-[#78716C]">
              {loja.mostrar_sobre && loja.conteudo_sobre && (
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-widest text-[#A8A29E]">Sobre</span>
                  <p className="mt-1">{loja.conteudo_sobre}</p>
                </div>
              )}
              {loja.mostrar_entrega && loja.conteudo_entrega && (
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-widest text-[#A8A29E]">Entrega</span>
                  <p className="mt-1">{loja.conteudo_entrega}</p>
                </div>
              )}
              {loja.mostrar_termos && loja.conteudo_termos && (
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-widest text-[#A8A29E]">Termos</span>
                  <p className="mt-1">{loja.conteudo_termos}</p>
                </div>
              )}
              {linksRedes.length > 0 && (
                <div className="flex gap-3 pt-1">
                  {linksRedes.map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="font-bold text-[#141414] underline">
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </footer>
          )}
        </>
      )}

      {view === 'carrinho' && (
        <CartView onFinalizar={() => setView('checkout')} onContinuarComprando={() => setView('loja')} />
      )}

      {view === 'checkout' && <CheckoutView loja={loja} />}
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
