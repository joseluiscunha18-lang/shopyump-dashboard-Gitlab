'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, ClipboardList, BarChart3, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMobileNav } from './MobileNavContext';

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

export function BottomNav() {
  const pathname = usePathname();
  const { menuOpen } = useMobileNav();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 sm:hidden transform-gpu [backface-visibility:hidden]',
        'transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
        menuOpen ? 'translate-y-[130%]' : 'translate-y-0'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around border-t border-zinc-200/60 bg-white/90 px-2 py-1.5 backdrop-blur-lg shadow-lg">
        {items.map(({ href, label, icon: Icon, isAction }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          if (isAction) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="relative -mt-6 flex flex-col items-center gap-1 active:opacity-80"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md ring-4 ring-white">
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <span className="text-[10px] font-medium text-zinc-500">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors active:opacity-70',
                active ? 'text-zinc-900' : 'text-zinc-400'
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-normal')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
