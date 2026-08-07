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
        'fixed inset-x-0 bottom-0 z-40 sm:hidden transform-gpu will-change-transform transition-transform duration-[160ms] ease-out',
        menuOpen ? 'translate-y-[130%]' : 'translate-y-0'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="flex items-center justify-around rounded-t-[28px] border-t-[0.5px] border-slate-200/60 bg-white/95 px-2 pb-2 pt-2 backdrop-blur-sm"
        style={{ boxShadow: '0 -10px 30px -14px rgba(15,23,42,0.16), 0 -2px 8px -2px rgba(15,23,42,0.06)' }}
      >
        {items.map(({ href, label, icon: Icon, isAction }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          if (isAction) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="relative -mt-7 flex flex-col items-center gap-1 px-3 transition-transform active:scale-95"
              >
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ink text-white shadow-lg shadow-ink/25 ring-4 ring-white">
                  <Icon size={22} strokeWidth={2.4} />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors',
                active ? 'text-ink' : 'text-slate-400'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
