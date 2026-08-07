'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  X,
  Search,
  Eye,
  Palette,
  Ticket,
  Settings,
  Globe,
  CreditCard,
  Users,
  Moon,
  Languages,
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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';

export type Plano = 'gratis' | 'premium';

const ICON_STROKE = 2;

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
    {
      key: 'loja',
      label: 'Configurações da loja',
      icon: Settings,
      children: [
        { href: '/configuracoes/informacoes', label: 'Informações da loja', icon: Info },
        { href: '/configuracoes/entrega', label: 'Entrega', icon: Truck },
        { href: '/configuracoes/devolucoes', label: 'Devoluções', icon: RotateCcw },
        { href: '/configuracoes/pagamentos', label: 'Pagamentos', icon: Wallet },
        { href: '/configuracoes/politicas', label: 'Políticas', icon: FileText },
      ],
    },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/cupons', label: 'Cupons e descontos', icon: Ticket },
    { href: '/dominio', label: 'Domínio', icon: Globe },
    { href: '/plano', label: 'Plano e faturação', icon: CreditCard },
    { href: '/aparencia', label: 'Aparência', icon: Moon },
    { href: '/idioma', label: 'Idioma', icon: Languages },
    {
      key: 'conta',
      label: 'Conta',
      icon: User,
      children: [
        { href: '/perfil', label: 'Perfil', icon: IdCard },
        { href: '/seguranca', label: 'Segurança', icon: Shield },
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
  const [searchQuery, setSearchQuery] = useState('');

  function defaultExpandedKey() {
    const active = entries.find((e) => isGroup(e) && e.children.some((c) => pathname.startsWith(c.href)));
    return active ? (active as NavGroup).key : null;
  }

  const [expanded, setExpanded] = useState<string | null>(defaultExpandedKey);
  const [instant, setInstant] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setInstant(true);
    setExpanded(defaultExpandedKey());
  }, [open]);

  useEffect(() => {
    if (!instant) return;
    const raf = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  const query = searchQuery.trim().toLowerCase();
  const searching = query.length > 0;

  const visibleEntries = useMemo(() => {
    if (!searching) return entries;
    return entries.reduce<NavEntry[]>((acc, entry) => {
      if (isGroup(entry)) {
        const matchingChildren = entry.children.filter((c) => c.label.toLowerCase().includes(query));
        if (entry.label.toLowerCase().includes(query) || matchingChildren.length > 0) {
          acc.push({ ...entry, children: matchingChildren.length > 0 ? matchingChildren : entry.children });
        }
      } else if (entry.label.toLowerCase().includes(query)) {
        acc.push(entry);
      }
      return acc;
    }, []);
  }, [entries, searching, query]);

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
      {/* Overlay com transição de opacidade fluida e blur leve */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] sm:hidden',
          'transition-opacity duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Painel lateral Otimizado para GPU e 120Hz */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[360px] flex-col bg-white',
          'border-r border-zinc-200/80 shadow-2xl',
          'transform-gpu [backface-visibility:hidden] [will-change:transform]',
          'transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] sm:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header Fixo de Navegação */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-[13px] font-extrabold text-white shadow-sm">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
              ) : (
                <span>{initials(storeName)}</span>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-[15px] font-semibold text-zinc-900 tracking-tight">
                {storeName}
              </p>
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                <span className="font-normal">Loja</span>
                <span className="text-zinc-300">•</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wider',
                    plano === 'premium' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {plano === 'premium' ? 'Premium' : 'Grátis'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors active:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Pesquisa Estilo Shopify */}
        <div className="px-5 py-2">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 transition-all focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-zinc-400">
            <Search size={15} strokeWidth={2} className="flex-shrink-0 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-transparent text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Lista de Navegação com Scroll Rápido */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 no-scrollbar">
          <nav className="flex flex-col gap-0.5">
            {visibleEntries.map((entry) => {
              if (isGroup(entry)) {
                const GroupIcon = entry.icon;
                const groupOpen = searching ? true : expanded === entry.key;
                const groupHasActiveChild = entry.children.some((c) => isActive(c.href));
                const groupHighlighted = groupOpen || groupHasActiveChild;

                return (
                  <div key={entry.key} className="flex flex-col">
                    <button
                      onClick={() => setExpanded(groupOpen ? null : entry.key)}
                      aria-expanded={groupOpen}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors active:bg-zinc-100/80',
                        groupHighlighted ? 'text-zinc-900 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                      )}
                    >
                      <GroupIcon
                        size={18}
                        strokeWidth={ICON_STROKE}
                        className={cn('flex-shrink-0', groupHighlighted ? 'text-zinc-900' : 'text-zinc-400')}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13.5px]">
                        {entry.label}
                      </span>
                      <ChevronDown
                        size={15}
                        strokeWidth={2}
                        className={cn(
                          'flex-shrink-0 text-zinc-400 duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
                          instant ? 'transition-none' : 'transition-transform',
                          groupOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        'grid duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] transform-gpu',
                        instant ? 'transition-none' : 'transition-[grid-template-rows]',
                        groupOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-0.5 py-1 pl-7 pr-1">
                          {entry.children.map((child) => {
                            const ChildIcon = child.icon;
                            const active = isActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors active:bg-zinc-100',
                                  active
                                    ? 'bg-zinc-100 font-semibold text-zinc-900'
                                    : 'font-normal text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                )}
                              >
                                <ChildIcon
                                  size={15}
                                  strokeWidth={ICON_STROKE}
                                  className={cn('flex-shrink-0', active ? 'text-zinc-900' : 'text-zinc-400')}
                                />
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

              const className = cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors active:bg-zinc-100',
                active
                  ? 'bg-zinc-100 font-semibold text-zinc-900'
                  : 'font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                entry.disabled && 'pointer-events-none opacity-40'
              );

              const content = (
                <>
                  <Icon
                    size={18}
                    strokeWidth={ICON_STROKE}
                    className={cn('flex-shrink-0', active ? 'text-zinc-900' : 'text-zinc-400')}
                  />
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  {active && <ChevronRight size={14} strokeWidth={2} className="flex-shrink-0 text-zinc-400" />}
                </>
              );

              if (entry.external) {
                return (
                  <a key={entry.label} href={entry.href} target="_blank" rel="noreferrer" onClick={onClose} className={className}>
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

            {searching && visibleEntries.length === 0 && (
              <p className="px-3 py-6 text-center text-[13px] text-zinc-400">
                Sem resultados para &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </nav>
        </div>

        {/* Footer Fixo */}
        <div className="border-t border-zinc-100 p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-red-600 transition-colors active:bg-red-50 hover:bg-red-50/50"
          >
            <LogOut size={18} strokeWidth={ICON_STROKE} className="flex-shrink-0" />
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}
