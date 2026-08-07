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
      <div className="grid grid-cols-5 items-stretch border-t border-slate-200 bg-white px-1 pb-1.5 pt-1.5">
        {items.map(({ href, label, icon: Icon, isAction }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          if (isAction) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-col items-center justify-center gap-1 py-1 active:opacity-80"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm shadow-brand/30">
                  <Icon size={19} strokeWidth={2.3} />
                </span>
                <span className="text-[10px] font-semibold tracking-wide leading-none text-brand">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-1 active:opacity-70"
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-brand' : 'text-slate-500'} />
              <span
                className={cn(
                  'text-[10px] tracking-wide leading-none',
                  active ? 'font-semibold text-brand' : 'font-normal text-slate-500'
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
