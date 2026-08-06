'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  X,
  Eye,
  Palette,
  Ticket,
  Settings,
  Globe,
  CreditCard,
  User,
  HelpCircle,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';

export type Plano = 'gratis' | 'premium';

interface NavLeaf {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  disabled?: boolean;
}

interface NavSection {
  title: string;
  items: NavLeaf[];
}

function buildSections(storeUrl: string | null): NavSection[] {
  return [
    {
      title: 'Loja',
      items: [
        { href: storeUrl ?? '#', label: 'Ver loja', icon: Eye, external: true, disabled: !storeUrl },
        { href: '/loja', label: 'Personalizar loja', icon: Palette },
      ],
    },
    {
      title: 'Marketing',
      items: [{ href: '/cupons', label: 'Cupons e descontos', icon: Ticket }],
    },
    {
      title: 'Configurações',
      items: [
        { href: '/configuracoes', label: 'Configurações da loja', icon: Settings },
        { href: '/dominio', label: 'Domínio', icon: Globe },
        { href: '/plano', label: 'Plano e faturação', icon: CreditCard },
        { href: '/perfil', label: 'Conta', icon: User },
      ],
    },
    {
      title: 'Suporte',
      items: [{ href: '/ajuda', label: 'Ajuda', icon: HelpCircle }],
    },
  ];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function MobileSidebarDrawer({
  open,
  onClose,
  storeName,
  storeUrl,
  logoUrl,
  // NOTE: `Loja` has no `plano` column yet in types/database.ts — defaults
  // to 'gratis' until billing lands. Wire this up to the real field once
  // it exists (see architecture doc note in lib/storage.ts for precedent).
  plano = 'gratis',
}: {
  open: boolean;
  onClose: () => void;
  storeName: string;
  storeUrl: string | null;
  logoUrl?: string | null;
  plano?: Plano;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sections = buildSections(storeUrl);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    return href !== '#' && pathname.startsWith(href);
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-200 ease-out sm:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-[400px] flex-col bg-white',
          'rounded-tr-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.25)]',
          'transform-gpu will-change-transform transition-transform duration-[220ms] ease-out sm:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fechar menu"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors active:scale-95 hover:bg-slate-100 hover:text-ink"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col overflow-y-auto overscroll-contain no-scrollbar pb-6 pt-7">
          {/* Header */}
          <div className="flex flex-col items-start gap-3 px-5 pb-6">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-ink text-[16px] font-black text-white shadow-lg shadow-ink/15">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
              ) : (
                <span>{initials(storeName)}</span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="truncate font-display text-[16px] font-black leading-tight tracking-tight text-ink">
                {storeName}
              </p>
              <span
                className={cn(
                  'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                  plano === 'premium' ? 'bg-brand-soft text-brand' : 'bg-slate-100 text-slate-500'
                )}
              >
                {plano === 'premium' ? 'Premium' : 'Grátis'}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Sections */}
          <nav className="flex flex-col gap-5 px-3 pt-5">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const content = (
                    <>
                      <span
                        className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl',
                          active ? 'bg-white/15 text-white' : 'bg-slate-50 text-slate-500'
                        )}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{item.label}</span>
                      {item.external && !item.disabled && (
                        <ChevronRight size={14} className={active ? 'text-white/60' : 'text-slate-300'} />
                      )}
                    </>
                  );

                  const className = cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-ink transition-colors active:scale-[0.98]',
                    active ? 'bg-ink text-white shadow-lg shadow-ink/10' : 'hover:bg-slate-50',
                    item.disabled && 'pointer-events-none opacity-40'
                  );

                  if (item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={onClose}
                        className={className}
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <Link key={item.label} href={item.href} onClick={onClose} className={className}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="mt-6 h-px bg-slate-100" />

          {/* Footer */}
          <div className="px-3 pt-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-red-500 transition-colors active:scale-[0.98] hover:bg-red-50"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
                <LogOut size={16} strokeWidth={2.2} />
              </span>
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
