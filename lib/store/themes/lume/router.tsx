'use client';

/**
 * Compatibilidade mínima com a API do @tanstack/react-router usada pelos
 * ficheiros copiados do LUME (Lovable/TanStack Start) — Link, useNavigate,
 * useRouterState, createFileRoute, notFound.
 *
 * PORQUÊ ISTO EXISTE: o contrato de tema desta app (`StoreThemeComponent`
 * em lib/store/themes/types.ts) é um único componente `(loja, produtos) =>
 * ReactElement`, sem rotas Next.js próprias (só existe
 * app/loja/[slug]/page.tsx — ver registry.tsx). O LUME original tem 10+
 * rotas TanStack com URLs reais. Para não ter de reescrever a lógica de
 * cada ficheiro de rota, este módulo implementa a mesma API de
 * navegação, mas com o "URL" a viver em estado React em vez do endereço
 * do browser. Resultado: os ficheiros em ./routes/*.tsx são cópias 1:1
 * do Lovable — só a linha de import do router muda.
 */

import {
  Component,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';

type SearchObj = Record<string, unknown>;
type SearchUpdater = SearchObj | ((prev: SearchObj) => SearchObj);

type RouterState = {
  pathname: string;
  params: Record<string, string>;
  search: SearchObj;
};

type NavigateOptions = {
  to?: string;
  params?: Record<string, string>;
  search?: SearchUpdater;
  replace?: boolean;
};

type NavigateFn = (opts: NavigateOptions | string) => void;

type LumeRouterValue = {
  state: RouterState;
  navigate: NavigateFn;
};

const LumeRouterContext = createContext<LumeRouterValue | undefined>(undefined);

export function LumeRouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RouterState>({ pathname: '/', params: {}, search: {} });

  const navigate = useCallback<NavigateFn>((opts) => {
    setState((current) => {
      if (typeof opts === 'string') {
        return { pathname: opts, params: {}, search: {} };
      }
      const nextPathname = opts.to ?? current.pathname;
      const nextParams = opts.params ?? (opts.to ? {} : current.params);
      let nextSearch: SearchObj = current.search;
      if (opts.search) {
        nextSearch = typeof opts.search === 'function' ? opts.search(current.search) : opts.search;
      } else if (opts.to) {
        nextSearch = {};
      }
      return { pathname: nextPathname, params: nextParams, search: nextSearch };
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo(() => ({ state, navigate }), [state, navigate]);

  return <LumeRouterContext.Provider value={value}>{children}</LumeRouterContext.Provider>;
}

function useLumeRouter(): LumeRouterValue {
  const value = useContext(LumeRouterContext);
  if (!value) throw new Error('useLumeRouter must be used inside LumeRouterProvider');
  return value;
}

/** Lê o "URL" interno atual — usado pelo LumeTheme para decidir que view mostrar. */
export function useCurrentLumeRoute() {
  return useLumeRouter().state;
}

export function useNavigate() {
  return useLumeRouter().navigate;
}

export function useRouterState<T>({ select }: { select: (state: { location: { pathname: string } }) => T }): T {
  const { state } = useLumeRouter();
  return select({ location: { pathname: state.pathname } });
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  params?: Record<string, string>;
  search?: SearchUpdater;
  replace?: boolean;
  children?: ReactNode;
};

export function Link({ to, params, search, replace, onClick, children, ...rest }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href="#"
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        navigate({ to, params, search, replace });
      }}
    >
      {children}
    </a>
  );
}

/** Lançado por notFound(); apanhado pelo RouteNotFoundBoundary. */
export class NotFoundError extends Error {}

export function notFound(): never {
  throw new NotFoundError('not found');
}

type RouteConfig<TLoaderData = unknown> = {
  component: () => ReactNode;
  loader?: (args: { params: Record<string, string> }) => TLoaderData;
  /** Nunca invocado pelo router-shim (não há <head> de documento por ecrã aqui) — só precisa de tipar certo o parâmetro para o TypeScript não rebentar com "implicitamente any". */
  head?: (args: { loaderData: TLoaderData }) => unknown;
  validateSearch?: unknown;
};

export function createFileRoute(_path: string) {
  return function configure<TLoaderData>(config: RouteConfig<TLoaderData>) {
    return {
      options: config,
      // any: o schema real (zod) só existe no ficheiro da rota, não aqui no
      // shim — sem isto o TS travava a destruturação em produtos.tsx com
      // "unknown".
      useSearch(): any {
        return useLumeRouter().state.search;
      },
      useNavigate,
      useParams(): Record<string, string> {
        return useLumeRouter().state.params;
      },
      useLoaderData(): TLoaderData {
        const { params } = useLumeRouter().state;
        if (!config.loader) throw new Error(`route sem loader`);
        return config.loader({ params });
      },
    };
  };
}

type RouteBoundaryState = { notFound: boolean };

/**
 * Substitui o notFoundComponent do TanStack Router: apanha o notFound()
 * lançado por um loader (ex.: produto inexistente) e mostra um estado
 * vazio simples em vez de rebentar a página toda.
 */
export class RouteNotFoundBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, RouteBoundaryState> {
  state: RouteBoundaryState = { notFound: false };

  static getDerivedStateFromError(error: unknown) {
    if (error instanceof NotFoundError) return { notFound: true };
    throw error;
  }

  render() {
    if (this.state.notFound) return this.props.fallback;
    return this.props.children;
  }
}
