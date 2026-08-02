'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ClipboardList, Store } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/loja', label: 'Loja', icon: Store },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2 py-2 sm:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors',
              active ? 'text-ink' : 'text-slate-400'
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
