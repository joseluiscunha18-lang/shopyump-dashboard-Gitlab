'use client';

/**
 * Compatibilidade com a API do @tanstack/react-router usada pelos componentes
 * do design novo (Lovable), mas apoiada no router real do Next (URLs reais,
 * basePath incluído). Assim os componentes ficam 1:1 com o Lovable e só a
 * linha de import muda: '@tanstack/react-router' -> '@/lib/router-compat'.
 */

import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { isCleanPath } from './domains';

type SearchObj = Record<string, unknown>;

type To = {
  to: string;
  params?: Record<string, string>;
  search?: SearchObj | ((prev: SearchObj) => SearchObj);
};

/** "/produtos/$id" + { id: "7" } -> "/produtos/7" */
function fillParams(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  return path.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) =>
    encodeURIComponent(params[key] ?? ''),
  );
}

function toQuery(search?: SearchObj): string {
  if (!search) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue;
    qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : '';
}

/** O Lovable usa '/dashboard' como início; no Next o basePath já é /dashboard, logo o início é '/'. */
function normalizeHome(path: string): string {
  return path === '/dashboard' ? '/' : path;
}

export function buildHref({ to, params, search }: To, prev: SearchObj = {}): string {
  const resolved = typeof search === 'function' ? search(prev) : search;
  return `${normalizeHome(fillParams(to, params))}${toQuery(resolved)}`;
}

function currentSearch(sp: URLSearchParams | null): SearchObj {
  return sp ? Object.fromEntries(sp.entries()) : {};
}

/** Lê a query atual só quando é preciso (search como função) — evita exigir <Suspense> em cada Link. */
function readSearch(): SearchObj {
  if (typeof window === 'undefined') return {};
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  params?: Record<string, string>;
  search?: To['search'];
  replace?: boolean;
  children?: ReactNode;
};

export function Link({ to, params, search, replace, children, className, ...rest }: LinkProps) {
  const href = buildHref({ to, params, search }, typeof search === 'function' ? readSearch() : {});
  const pathname = usePathname() ?? '/';
  // Páginas de autenticação vivem fora do /dashboard: <a> normal, para o URL ficar limpo (/register).
  if (isCleanPath(href)) {
    return <a href={href} className={className} {...rest}>{children}</a>;
  }
  // O <Link> do TanStack Router marca sozinho a ligação ativa (classe "active" + aria-current),
  // incluindo rotas filhas (/produtos fica ativo em /produtos/novo). O design do menu depende disso.
  const target = normalizeHome(fillParams(to, params));
  const active = target === '/' ? pathname === '/' : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <NextLink
      href={href}
      replace={replace}
      className={[className, active ? 'active' : ''].filter(Boolean).join(' ') || undefined}
      aria-current={active ? 'page' : undefined}
      data-status={active ? 'active' : undefined}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (opts: (To & { replace?: boolean }) | string) => {
      const target = typeof opts === 'string' ? { to: opts } : opts;
      const href = buildHref(target, readSearch());
      if (isCleanPath(href)) { window.location.assign(href); return; }
      if (typeof opts !== 'string' && opts.replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );
}

export function useRouterState<T>({
  select,
}: {
  select: (state: { location: { pathname: string } }) => T;
}): T {
  const raw = usePathname() ?? '/';
  // Inverso de normalizeHome: o resto do design compara o início com '/dashboard'.
  const pathname = raw === '/' ? '/dashboard' : raw;
  return select({ location: { pathname } });
}

export function useSearch(_opts?: { strict?: boolean }): SearchObj {
  const sp = useSearchParams();
  return useMemo(() => currentSearch(sp), [sp]);
}
