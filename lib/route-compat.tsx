'use client';

/**
 * Runtime que permite usar, dentro do Next, os ficheiros de rota do design novo
 * (Lovable / TanStack Start) SEM os reescrever: createFileRoute, redirect,
 * Outlet, getRouteApi, notFound. Cada ficheiro de rota fica 1:1 com o Lovable
 * (só muda o import) e cada app/**\/page.tsx limita-se a renderizar <RoutePage>.
 *
 * Executa beforeLoad (guardas/redirects) e loader no cliente, exatamente como o
 * Lovable fazia com `ssr: false`. Quando ligarmos o Supabase, as páginas podem
 * passar a Server Components uma a uma, sem mexer no resto.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useParams as useNextParams, useRouter, useSearchParams } from 'next/navigation';
import { buildHref, useNavigate, useSearch } from './router-compat';

export { Link, useNavigate, useRouterState, useSearch } from './router-compat';

type Obj = Record<string, unknown>;
type RedirectOpts = { to: string; params?: Record<string, string>; search?: Obj; replace?: boolean };

class RedirectError {
  constructor(public opts: RedirectOpts) {}
}
class NotFoundError extends Error {}

/** Usado como `throw redirect({ to })` — devolve o objeto a lançar. */
export function redirect(opts: RedirectOpts): never {
  throw new RedirectError(opts);
}
export function notFound(): never {
  throw new NotFoundError('not found');
}

const OutletContext = createContext<ReactNode>(null);
export function Outlet() {
  return <>{useContext(OutletContext)}</>;
}

type RouteConfig<TLoader> = {
  head?: (...args: any[]) => any;
  ssr?: boolean;
  validateSearch?: (search: Obj) => any;
  beforeLoad?: (args: { params: Record<string, string>; search: any }) => unknown;
  loader?: (args: { params: Record<string, string> }) => TLoader | Promise<TLoader>;
  component?: () => ReactNode;
  notFoundComponent?: () => ReactNode;
  errorComponent?: (...args: any[]) => ReactNode;
};

export type CompatRoute<TLoader = undefined> = {
  options: RouteConfig<TLoader>;
  Context: React.Context<unknown>;
  useLoaderData: () => Awaited<TLoader>;
  useParams: () => Record<string, string>;
  useSearch: () => any;
  useNavigate: typeof useNavigate;
  useRouteContext: () => Record<string, never>;
};

function asParams(p: ReturnType<typeof useNextParams>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(p ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : String(v)]),
  );
}

/** Contextos de dados (loader) por caminho de rota, para getRouteApi() os encontrar. */
const routeContexts = new Map<string, React.Context<unknown>>();
const EmptyContext = createContext<unknown>(undefined);

export function createFileRoute(path: string) {
  return function configure<TLoader = undefined>(config: RouteConfig<TLoader>): CompatRoute<TLoader> {
    const Context = createContext<unknown>(undefined);
    routeContexts.set(path, Context);
    return {
      options: config,
      Context,
      useLoaderData: () => useContext(Context) as Awaited<TLoader>,
      useParams: () => asParams(useNextParams()),
      useSearch: () => {
        const raw = useSearch();
        return config.validateSearch ? config.validateSearch(raw) : raw;
      },
      useNavigate,
      useRouteContext: () => ({}),
    };
  };
}

/** getRouteApi('/x') — dá acesso a useParams/useSearch/useLoaderData sem importar a Route. */
export function getRouteApi(path: string) {
  return {
    useParams: () => asParams(useNextParams()),
    useSearch: () => useSearch(),
    useNavigate,
    // Procura o contexto no momento do uso (a rota pode ser registada depois deste módulo carregar).
    useLoaderData: () => useContext(routeContexts.get(path) ?? EmptyContext) as any,
  };
}

function pageTitle(head: RouteConfig<unknown>['head']): string | undefined {
  try {
    const meta = head?.({})?.meta as Array<Obj> | undefined;
    const t = meta?.find((m) => typeof m.title === 'string')?.title;
    return typeof t === 'string' ? t : undefined;
  } catch {
    return undefined;
  }
}

type RouteState = { ready: boolean; value?: unknown; notFound?: boolean };

export function RoutePage({ route, children }: { route: CompatRoute<any>; children?: ReactNode }) {
  const config = route.options;
  const router = useRouter();
  const nextParams = useNextParams();
  const sp = useSearchParams();
  const params = useMemo(() => asParams(nextParams), [nextParams]);
  const search = useMemo(() => Object.fromEntries(sp?.entries() ?? []), [sp]);
  const [state, setState] = useState<RouteState>({ ready: false });

  const paramsKey = JSON.stringify(params);
  const searchKey = JSON.stringify(search);

  useEffect(() => {
    const title = pageTitle(config.head);
    if (title) document.title = title;
  }, [config.head]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const validated = config.validateSearch ? config.validateSearch(search) : search;
        await config.beforeLoad?.({ params, search: validated });
        const value = config.loader ? await config.loader({ params }) : undefined;
        if (!cancelled) setState({ ready: true, value });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof RedirectError) {
          const href = buildHref(error.opts);
          if (error.opts.replace === false) router.push(href);
          else router.replace(href);
        } else if (error instanceof NotFoundError) {
          setState({ ready: true, notFound: true });
        } else {
          setState(() => {
            throw error;
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, searchKey]);

  if (!state.ready) return null;
  if (state.notFound) return <>{config.notFoundComponent?.() ?? null}</>;
  const Component = config.component;
  return (
    <route.Context.Provider value={state.value}>
      <OutletContext.Provider value={children}>{Component ? <Component /> : null}</OutletContext.Provider>
    </route.Context.Provider>
  );
}
