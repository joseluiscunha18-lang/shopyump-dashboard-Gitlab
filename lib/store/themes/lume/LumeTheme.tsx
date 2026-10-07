'use client';

import { LumeRouterProvider, RouteNotFoundBoundary, useCurrentLumeRoute } from './router';
import { StoreShell } from './components/store/store-shell';
import { LumeLojaProvider } from './components/store/lume-loja-context';
import { LumePersonalizacaoProvider } from './components/store/lume-personalizacao-context';
import type { LumePersonalizacao } from './lib/personalizacao';
import type { StoreThemeProps } from '../types';

import { Route as IndexRoute } from './routes/index';
import { Route as ProdutosRoute } from './routes/produtos';
import { Route as ProdutoRoute } from './routes/produto-detail';
import { Route as CheckoutRoute } from './routes/checkout';
import { Route as ContaRoute } from './routes/conta';
import { Route as FavoritosRoute } from './routes/favoritos';
import { Route as ContactoRoute } from './routes/contacto';
import { Route as SobreRoute } from './routes/sobre';
import { Route as EnviosRoute } from './routes/envios-e-entregas';
import { Route as TermosRoute } from './routes/termos-e-privacidade';
import { Route as TrocasRoute } from './routes/trocas-e-devolucoes';

/**
 * Tema 'lume' — fusão técnica do tema LUME (Lovable/TanStack Start) para
 * esta app. Visual e lógica das telas são cópia 1:1 dos ficheiros
 * originais em lib/store/themes/lume/{routes,components}; a única coisa
 * escrita de raiz aqui é a "troca de rota" abaixo, que substitui as
 * rotas TanStack reais (não disponíveis dentro do contrato de tema de
 * página única desta app — ver router.tsx) por um switch sobre o estado
 * interno de navegação.
 *
 * LÓGICA DE ONBOARDING/FALLBACK (implementada em lume-loja-context.tsx):
 *   - Sem produtos reais → mostra demo; com produtos reais → mostra reais.
 *   - Redes sociais/contactos → só mostra o que o lojista preencheu.
 *   - Páginas institucionais → sempre activas com texto modelo genérico.
 */
function CurrentLumeView() {
  const { pathname } = useCurrentLumeRoute();

  switch (pathname) {
    case '/produtos':
      return <ProdutosRoute.options.component />;
    case '/produto/$productId':
      return (
        <RouteNotFoundBoundary fallback={<ProdutoNaoEncontrado />}>
          <ProdutoRoute.options.component />
        </RouteNotFoundBoundary>
      );
    case '/checkout':
      return <CheckoutRoute.options.component />;
    case '/conta':
      return <ContaRoute.options.component />;
    case '/favoritos':
      return <FavoritosRoute.options.component />;
    case '/contacto':
      return <ContactoRoute.options.component />;
    case '/sobre':
      return <SobreRoute.options.component />;
    case '/envios-e-entregas':
      return <EnviosRoute.options.component />;
    case '/termos-e-privacidade':
      return <TermosRoute.options.component />;
    case '/trocas-e-devolucoes':
      return <TrocasRoute.options.component />;
    case '/':
    default:
      return <IndexRoute.options.component />;
  }
}

function ProdutoNaoEncontrado() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este produto pode ter sido removido ou já não está disponível.
        </p>
      </div>
    </div>
  );
}

function LumeThemeInterno() {
  return (
    <StoreShell>
      <CurrentLumeView />
    </StoreShell>
  );
}

/**
 * Parte "cliente" do tema. Recebe a personalização JÁ resolvida pelo servidor
 * (ver ./index.tsx) — `null` = sem personalização, visual original do Lume.
 */
export function LumeThemeClient({ loja, produtos, personalizacao }: StoreThemeProps & { personalizacao: LumePersonalizacao | null }) {
  return (
    <LumeLojaProvider loja={loja} produtos={produtos}>
      <LumePersonalizacaoProvider value={personalizacao}>
        <LumeRouterProvider>
          <LumeThemeInterno />
        </LumeRouterProvider>
      </LumePersonalizacaoProvider>
    </LumeLojaProvider>
  );
}
