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
        'fixed inset-x-0 bottom-0 z-40 sm:hidden transform-gpu will-change-transform transition-transform duration-200',
        menuOpen ? 'translate-y-[130%]' : 'translate-y-0'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div
        className="grid grid-cols-5 items-stretch rounded-t-[28px] border-t-[0.5px] border-slate-200/60 bg-white/95 px-1.5 pb-1.5 pt-2 backdrop-blur-sm"
        style={{ boxShadow: '0 -10px 30px -14px rgba(15,23,42,0.16), 0 -2px 8px -2px rgba(15,23,42,0.06)' }}
      >
        {items.map(({ href, label, icon: Icon, isAction }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={isAction ? label : undefined}
              className="flex flex-col items-center justify-center gap-1.5 py-1 transition-transform active:scale-95"
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  isAction
                    ? 'bg-ink text-white shadow-md shadow-ink/20'
                    : active
                      ? 'bg-ink/[0.06] text-ink'
                      : 'text-slate-400'
                )}
              >
                <Icon size={19} strokeWidth={isAction || active ? 2.4 : 2} />
              </span>
              <span
                className={cn(
                  'text-[9.5px] font-bold uppercase tracking-wide leading-none',
                  isAction || active ? 'text-ink' : 'text-slate-400'
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
