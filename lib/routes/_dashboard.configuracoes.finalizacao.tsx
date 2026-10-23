import { createFileRoute, Link } from '@/lib/route-compat';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, SaveBar, ToggleRow, StatusBadge, useDraft } from '@/components/settings/SettingsKit';
import { validateInternationalPhone } from '@/lib/settings/validators';

export const Route = createFileRoute('/_dashboard/configuracoes/finalizacao')({
  head: () => ({ meta: [
    { title: 'Finalização da compra | Shopyump' },
    { name: 'description', content: 'Escolhe como os clientes enviam encomendas à tua loja Shopyump.' },
    { property: 'og:title', content: 'Finalização da compra | Shopyump' },
    { property: 'og:description', content: 'Como o cliente faz uma encomenda.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

function Page() {
  const { checkout, setCheckout, contacts } = useDashboardState();
  const { draft, patch, dirty, save, reset } = useDraft(checkout, setCheckout);
  const hasWhatsapp = Boolean(contacts.whatsapp) && !validateInternationalPhone(contacts.whatsapp);

  return (
    <SettingsPage title="Finalização da compra">
      <Section title="Encomendas pelo WhatsApp" aside={<StatusBadge tone={hasWhatsapp && draft.whatsapp ? 'ok' : 'muted'}>{hasWhatsapp && draft.whatsapp ? 'Ativo' : 'Inativo'}</StatusBadge>}>
        <ToggleRow label="Receber encomendas pelo WhatsApp" checked={hasWhatsapp && draft.whatsapp} disabled={!hasWhatsapp}
          onChange={(v) => patch({ whatsapp: v })}
          description={hasWhatsapp
            ? <>O cliente abre uma conversa para <strong className="font-semibold text-foreground">{contacts.whatsapp}</strong> com o produto, a variante e a quantidade. Abrir a conversa não regista a encomenda na Shopyump.</>
            : <>Precisas de um número de WhatsApp válido. <Link to="/configuracoes/contactos" className="font-semibold text-foreground underline underline-offset-2">Configurar contactos</Link></>} />
      </Section>
      <Section title="Checkout Shopyump" aside={<StatusBadge tone="muted">Indisponível</StatusBadge>}>
        <p className="text-sm leading-relaxed text-muted-foreground">Ainda não disponível. Quando existir, o cliente poderá preencher os dados, escolher a entrega e pagar diretamente na loja.</p>
      </Section>
      <p className="text-sm text-muted-foreground">
        As formas de pagamento configuram-se em <Link to="/configuracoes/pagamentos" className="font-semibold text-foreground underline underline-offset-2">Métodos de pagamento</Link>.
      </p>
      <SaveBar dirty={dirty} onReset={reset} onSave={() => save()} />
    </SettingsPage>
  );
}
