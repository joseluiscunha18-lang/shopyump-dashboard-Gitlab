import { createFileRoute, Link } from '@/lib/route-compat';
import { useState } from 'react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, SaveBar, ToggleRow, StatusBadge, useDraft } from '@/components/settings/SettingsKit';
import { Input, Textarea } from '@/components/ui/ShopyumpInput';
import { salvarPagamentos } from '@/lib/mutations/pagamentos';

export const Route = createFileRoute('/_dashboard/configuracoes/pagamentos')({
  head: () => ({ meta: [
    { title: 'Métodos de pagamento | Shopyump' },
    { name: 'description', content: 'Formas de pagamento disponíveis para os clientes da tua loja Shopyump.' },
    { property: 'og:title', content: 'Métodos de pagamento | Shopyump' },
    { property: 'og:description', content: 'Como o cliente pode pagar.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

function Page() {
  const { payments, setPayments, delivery } = useDashboardState();
  const { draft, patch, dirty, save, reset } = useDraft(payments, setPayments);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasDelivery = delivery.domicilio && delivery.zonas.length > 0;

  return (
    <SettingsPage title="Métodos de pagamento">
      <Section title="Pagamentos online" aside={<StatusBadge tone="muted">Não ligado</StatusBadge>}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Os pagamentos por cartão e carteiras móveis (M-Pesa, e-Mola, mKesh) através da Shopyump ainda não estão disponíveis. Não há integrações externas disponíveis de momento.
        </p>
      </Section>
      <Section title="Transferência bancária" aside={<StatusBadge tone={draft.transferencia ? 'ok' : 'muted'}>{draft.transferencia ? 'Ativo' : 'Inativo'}</StatusBadge>}>
        <ToggleRow label="Aceitar transferência bancária" checked={draft.transferencia} onChange={(v) => patch({ transferencia: v })}
          description="Confirmas manualmente cada pagamento recebido." />
        {draft.transferencia && (
          <>
            <Input name="banco" label="Banco *" placeholder="Ex.: Millennium bim" value={draft.banco} error={errors.banco} onChange={(e) => patch({ banco: e.target.value })} />
            <Input name="titular" label="Titular da conta *" value={draft.titular} error={errors.titular} onChange={(e) => patch({ titular: e.target.value })} />
            <Input name="conta" label="NIB ou número de conta *" value={draft.conta} error={errors.conta} onChange={(e) => patch({ conta: e.target.value })} />
            <Textarea name="instrucoesTransferencia" label="Instruções para o cliente (opcional)" rows={3} placeholder="Ex.: Envia o comprovativo pelo WhatsApp." value={draft.instrucoesTransferencia}
              onChange={(e) => patch({ instrucoesTransferencia: e.target.value })} />
          </>
        )}
      </Section>
      <Section title="Dinheiro na entrega" aside={<StatusBadge tone={draft.dinheiroEntrega ? 'ok' : 'muted'}>{draft.dinheiroEntrega ? 'Ativo' : 'Inativo'}</StatusBadge>}>
        <ToggleRow label="Aceitar dinheiro na entrega" checked={draft.dinheiroEntrega && hasDelivery} disabled={!hasDelivery}
          onChange={(v) => patch({ dinheiroEntrega: v })}
          description={hasDelivery ? 'Marcas o pagamento como recebido depois da entrega.'
            : <>Requer entrega ao domicílio com pelo menos uma zona. <Link to="/configuracoes/entrega" className="font-semibold text-foreground underline underline-offset-2">Configurar entrega</Link></>} />
        {draft.dinheiroEntrega && hasDelivery && (
          <Textarea name="instrucoesDinheiro" label="Condições (opcional)" rows={2} placeholder="Ex.: Tem o valor exato pronto." value={draft.instrucoesDinheiro}
            onChange={(e) => patch({ instrucoesDinheiro: e.target.value })} />
        )}
      </Section>
      <SaveBar dirty={dirty} onReset={() => { reset(); setErrors({}); }} onSave={async () => {
        const e: Record<string, string> = {};
        if (draft.transferencia) {
          if (!draft.banco.trim()) e.banco = 'Indica o banco.';
          if (!draft.titular.trim()) e.titular = 'Indica o titular.';
          if (!draft.conta.trim()) e.conta = 'Indica o NIB ou conta.';
        }
        setErrors(e);
        if (Object.keys(e).length) return false;
        const value = { ...draft, dinheiroEntrega: draft.dinheiroEntrega && hasDelivery };
        // Grava na base de dados ANTES de atualizar o ecrã: se falhar, o SaveBar mostra o erro e o rascunho mantém-se.
        const r = await salvarPagamentos(value);
        if (!r.ok) throw new Error(r.error);
        save(value);
      }} />
    </SettingsPage>
  );
}
