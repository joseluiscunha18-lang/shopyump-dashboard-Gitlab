import { createFileRoute, Link } from '@/lib/route-compat';
import { Store, MessageSquareText, AtSign, Languages, Truck, ShoppingCart, Wallet, FileText, ChevronRight, Power } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage } from '@/components/settings/SettingsKit';
import { CURRENCIES } from '@/lib/settings/model';

export const Route = createFileRoute('/_dashboard/configuracoes/')({
  head: () => ({ meta: [
    { title: 'Configurações da loja | Shopyump' },
    { name: 'description', content: 'Gere os dados, contactos, entrega, pagamentos e políticas da tua loja Shopyump.' },
    { property: 'og:title', content: 'Configurações da loja | Shopyump' },
    { property: 'og:description', content: 'Gere os dados e o funcionamento da tua loja Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

type Item = { to: string; label: string; detail?: string; icon: ReactNode };

function Page() {
  const { store, contacts, socials, region, delivery, checkout, payments, pages } = useDashboardState();
  const currency = CURRENCIES.find((c) => c.code === region.moeda)?.code ?? region.moeda;
  const published = pages.filter((p) => p.publicada).length;
  const activePayments = [payments.transferencia && 'Transferência', payments.dinheiroEntrega && 'Dinheiro na entrega'].filter(Boolean);
  const groups: { title: string; items: Item[] }[] = [
    { title: 'Informações da loja', items: [
      { to: '/configuracoes/dados', label: 'Informações gerais', detail: [store.nome, store.cidade].filter(Boolean).join(' · '), icon: <Store size={20} strokeWidth={1.75} /> },
      { to: '/configuracoes/contactos', label: 'Canais de contacto', detail: contacts.whatsapp ? 'WhatsApp configurado' : 'Sem WhatsApp', icon: <MessageSquareText size={20} strokeWidth={1.75} /> },
      { to: '/configuracoes/redes-sociais', label: 'Redes sociais', detail: socials.length ? `${socials.length} ligação${socials.length > 1 ? 'ões' : ''}` : 'Nenhuma ligação', icon: <AtSign size={20} strokeWidth={1.75} /> },
      { to: '/configuracoes/regiao', label: 'Idioma e moeda', detail: `Português · ${currency} · ${region.fuso}`, icon: <Languages size={20} strokeWidth={1.75} /> },
    ] },
    { title: 'Vendas e operações', items: [
      { to: '/configuracoes/entrega', label: 'Entrega', detail: delivery.domicilio || delivery.levantamento ? [delivery.domicilio && `${delivery.zonas.length} zona(s)`, delivery.levantamento && 'Levantamento'].filter(Boolean).join(' · ') : 'Por configurar', icon: <Truck size={20} strokeWidth={1.75} /> },
      { to: '/configuracoes/finalizacao', label: 'Finalização da compra', detail: checkout.whatsapp ? 'Encomendas pelo WhatsApp' : 'Por configurar', icon: <ShoppingCart size={20} strokeWidth={1.75} /> },
      { to: '/configuracoes/pagamentos', label: 'Métodos de pagamento', detail: activePayments.length ? activePayments.join(' · ') : 'Nenhum ativo', icon: <Wallet size={20} strokeWidth={1.75} /> },
    ] },
    { title: 'Gestão da loja', items: [
      { to: '/configuracoes/politicas', label: 'Páginas e políticas', detail: `${published} de ${pages.length} publicadas`, icon: <FileText size={20} strokeWidth={1.75} /> },
      { to: '/configuracoes/estado', label: 'Estado da loja', icon: <Power size={20} strokeWidth={1.75} /> },
    ] },
  ];
  return (
    <SettingsPage title="Configurações da loja" intro="Gere os dados e o funcionamento da tua loja." back={false}>
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col">
          <h2 className="px-1 pb-2.5 text-[13px] font-medium text-muted-foreground">{g.title}</h2>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
            {g.items.map((i) => (
              <Link key={i.to} to={i.to} className="group flex items-center gap-3.5 pl-4 transition-colors hover:bg-muted/50">
                <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden>{i.icon}</span>
                <span className="flex min-h-14 flex-1 items-center gap-3 pr-4">
                  <span className="flex-1 text-[15px] font-medium text-foreground">{i.label}</span>
                  <ChevronRight size={16} className="text-muted-foreground/50" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </SettingsPage>
  );
}
