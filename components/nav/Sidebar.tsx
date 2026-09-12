'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ClipboardList, Store, User, ShieldCheck, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/loja', label: 'Personalizar loja', icon: Store },
];

const secondaryItems = [
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/seguranca', label: 'Segurança', icon: ShieldCheck },
];

export function Sidebar({ storeUrl }: { storeUrl: string | null }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <aside className="hidden sm:flex w-64 flex-shrink-0 flex-col border-r border-slate-100 bg-white/60 backdrop-blur-xl h-screen sticky top-0 px-5 py-8">
      <div className="px-2 mb-10">
        <span className="font-display text-xl font-black text-ink tracking-tighter">Shopyump</span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-colors',
              isActive(href) ? 'bg-ink text-white shadow-lg shadow-ink/10' : 'text-slate-500 hover:bg-slate-100 hover:text-ink'
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="h-px bg-slate-100 my-5" />

      <nav className="flex flex-col gap-1">
        {secondaryItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-colors',
              isActive(href) ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-ink'
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-slate-200 text-[12px] font-bold text-ink hover:bg-slate-50 transition-colors"
          >
            Ver a minha loja <ExternalLink size={13} />
          </a>
        )}
      </div>
    </aside>
  );
}
