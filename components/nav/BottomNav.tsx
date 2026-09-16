'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, ClipboardList, BarChart3, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMobileNav } from './MobileNavContext';
import { isFocusModePath } from '@/lib/nav/productFormFlow';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isAction?: boolean;
}

const items: NavItem[] = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/produtos/novo', label: 'Adicionar', icon: Plus, isAction: true },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/analises', label: 'Análises', icon: BarChart3 },
];

export function BottomNav({ lojaId, initialPedidosPendentes = 0 }: { lojaId?: string; initialPedidosPendentes?: number }) {
  const pathname = usePathname();
  const { menuOpen } = useMobileNav();
  const inFlow = isFocusModePath(pathname);

  // Nasce com o valor já calculado no servidor (sem "piscar" 0 → N no
  // primeiro render) e só depois liga-se ao Realtime para se manter
  // correto enquanto o usuário está com a app aberta — a mesma
  // informação que já alimenta o NewOrderAlert na Início, só que aqui
  // isolada num contador (o badge não precisa de saber QUAL pedido é,
  // só QUANTOS estão por confirmar).
  const [pedidosPendentes, setPedidosPendentes] = useState(initialPedidosPendentes);

  useEffect(() => {
    if (!lojaId) return;
    const supabase = createClient();

    // Reconta via `count: 'exact', head: true` — mesmo padrão do
    // `getDashboardStats` no servidor, aqui do lado do browser (não dá
    // para reutilizar diretamente `countPedidosPendentes`, que é uma
    // função de servidor e depende de `cookies()`).
    function recontar() {
      supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('loja_id', lojaId!)
        .eq('status', 'pendente')
        .then(({ count }) => setPedidosPendentes(count ?? 0));
    }

    // Em qualquer INSERT/UPDATE em `pedidos` desta loja (novo pedido,
    // confirmação, cancelamento...), reconta em vez de tentar adivinhar
    // a diferença — fica sempre correto, mesmo perante updates que mudam
    // o status para fora/para dentro de 'pendente'.
    const channel = supabase
      .channel(`bottomnav-pedidos-${lojaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `loja_id=eq.${lojaId}` },
        recontar
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lojaId]);

  // `inFlow` vem do pathname (disponível já na primeira renderização), por
  // isso a barra nasce escondida nessas rotas em vez de aparecer e só
  // depois recolher — sem flash.
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 sm:hidden transform-gpu will-change-transform',
        !inFlow && 'transition-transform duration-200',
        menuOpen || inFlow ? 'translate-y-[130%]' : 'translate-y-0'
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="mx-3 grid grid-cols-5 items-stretch rounded-[28px] border border-zinc-200/70 bg-white px-1.5 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]">
        {items.map(({ href, label, icon: Icon, isAction }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const showBadge = href === '/pedidos' && pedidosPendentes > 0;

          if (isAction) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-col items-center justify-center gap-1 active:opacity-80"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <Icon size={19} strokeWidth={2.2} />
                </span>
                <span className="text-[10px] font-semibold tracking-wide leading-none text-zinc-900">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 active:opacity-70"
            >
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2 : 1.8} className={active ? 'text-zinc-900' : 'text-zinc-400'} />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                    {pedidosPendentes > 9 ? '9+' : pedidosPendentes}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] tracking-wide leading-none',
                  active ? 'font-semibold text-zinc-900' : 'font-normal text-zinc-400'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
