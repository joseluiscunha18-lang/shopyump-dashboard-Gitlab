'use client';

import { useEffect, useMemo, useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  Info,
  Truck,
  RotateCcw,
  Wallet,
  FileText,
  IdCard,
  Shield,
  Paintbrush,
  Languages,
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

interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
}

type NavEntry = NavLeaf | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

function buildEntries(storeUrl: string | null): NavEntry[] {
  return [
    { href: storeUrl ?? '#', label: 'Ver loja', icon: Eye, external: true, disabled: !storeUrl },
    { href: '/loja', label: 'Personalizar loja', icon: Palette },
    { href: '/cupons', label: 'Cupons e descontos', icon: Ticket },
    {
      key: 'loja',
      label: 'Loja',
      icon: Settings,
      children: [
        { href: '/configuracoes/informacoes', label: 'Informações da loja', icon: Info },
        { href: '/configuracoes/entrega', label: 'Entrega', icon: Truck },
        { href: '/configuracoes/devolucoes', label: 'Devoluções', icon: RotateCcw },
        { href: '/configuracoes/pagamentos', label: 'Pagamentos', icon: Wallet },
        { href: '/configuracoes/politicas', label: 'Políticas', icon: FileText },
      ],
    },
    { href: '/dominio', label: 'Domínio', icon: Globe },
    { href: '/plano', label: 'Plano e faturação', icon: CreditCard },
    {
      key: 'conta',
      label: 'Conta',
      icon: User,
      children: [
        { href: '/perfil', label: 'Perfil', icon: IdCard },
        { href: '/seguranca', label: 'Segurança', icon: Shield },
        { href: '/aparencia', label: 'Aparência', icon: Paintbrush },
        { href: '/idioma', label: 'Idioma', icon: Languages },
      ],
    },
    { href: '/ajuda', label: 'Ajuda', icon: HelpCircle },
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
  const entries = useMemo(() => buildEntries(storeUrl), [storeUrl]);

  // Only one group open at a time — keeps the menu feeling short and calm.
  // Auto-expands whichever group contains the current route.
  const [expanded, setExpanded] = useState<string | null>(() => {
    const active = entries.find((e) => isGroup(e) && e.children.some((c) => pathname.startsWith(c.href)));
    return active ? (active as NavGroup).key : null;
  });

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

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
          'fixed inset-y-0 left-0 z-50 flex w-[80%] max-w-[400px] flex-col bg-white',
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

        <div className="flex flex-col overflow-y-auto overscroll-contain no-scrollbar pb-6 pt-8">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pb-7">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-orange-700 text-[16px] font-black text-white shadow-md shadow-brand/20">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
              ) : (
                <span>{initials(storeName)}</span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="truncate font-display text-[17px] font-black leading-tight tracking-tight text-ink">
                {storeName}
              </p>
              <span
                className={cn(
                  'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-black uppercase tracking-widest',
                  plano === 'premium' ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {plano === 'premium' ? 'Premium' : 'Grátis'}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-4">
            {entries.map((entry) => {
              if (isGroup(entry)) {
                const GroupIcon = entry.icon;
                const groupOpen = expanded === entry.key;
                const groupHasActiveChild = entry.children.some((c) => isActive(c.href));

                return (
                  <div key={entry.key} className="flex flex-col">
                    <button
                      onClick={() => setExpanded(groupOpen ? null : entry.key)}
                      aria-expanded={groupOpen}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:scale-[0.98]',
                        groupHasActiveChild ? 'text-brand' : 'text-ink hover:bg-slate-50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl',
                          groupHasActiveChild ? 'bg-brand-soft text-brand' : 'bg-slate-50 text-slate-500'
                        )}
                      >
                        <GroupIcon size={16} strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{entry.label}</span>
                      <ChevronDown
                        size={15}
                        strokeWidth={2.4}
                        className={cn(
                          'flex-shrink-0 text-slate-300 transition-transform duration-[250ms] ease-out',
                          groupOpen && 'rotate-180 text-slate-400'
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-[250ms] ease-out',
                        groupOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-0.5 py-1 pl-[18px]">
                          {entry.children.map((child) => {
                            const ChildIcon = child.icon;
                            const active = isActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-3 rounded-xl border-l-2 py-2.5 pl-4 pr-3 text-[12.5px] font-bold transition-colors active:scale-[0.98]',
                                  active
                                    ? 'border-brand text-brand'
                                    : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:text-ink'
                                )}
                              >
                                <ChildIcon size={15} strokeWidth={2.2} className="flex-shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const Icon = entry.icon;
              const active = isActive(entry.href);
              const content = (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl',
                      active ? 'bg-brand-soft text-brand' : 'bg-slate-50 text-slate-500'
                    )}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{entry.label}</span>
                  {entry.external && !entry.disabled && (
                    <ChevronRight size={14} className="flex-shrink-0 text-slate-300" />
                  )}
                </>
              );

              const className = cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors active:scale-[0.98]',
                active ? 'text-brand' : 'text-ink hover:bg-slate-50',
                entry.disabled && 'pointer-events-none opacity-40'
              );

              if (entry.external) {
                return (
                  <a
                    key={entry.label}
                    href={entry.href}
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
                <Link key={entry.label} href={entry.href} onClick={onClose} className={className}>
                  {content}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 px-4">
            <div className="h-px bg-slate-100" />
          </div>

          {/* Footer */}
          <div className="px-4 pt-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-bold text-red-500 transition-colors active:scale-[0.98] hover:bg-red-50"
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
