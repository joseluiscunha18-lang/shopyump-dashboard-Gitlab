import { createFileRoute } from '@/lib/route-compat';
import { useState } from 'react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, StatusBadge } from '@/components/settings/SettingsKit';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Sheet } from '@/components/ui/ShopyumpSheet';
import { Button } from '@/components/ui/ShopyumpButton';
import { Input } from '@/components/ui/ShopyumpInput';
import { DELETION_GRACE_DAYS, scheduleDeletionDate } from '@/lib/settings/validators';

export const Route = createFileRoute('/_dashboard/configuracoes/estado')({
  head: () => ({ meta: [
    { title: 'Estado da loja | Shopyump' },
    { name: 'description', content: 'Desativa, reativa ou agenda a eliminação da tua loja Shopyump.' },
    { property: 'og:title', content: 'Estado da loja | Shopyump' },
    { property: 'og:description', content: 'Controla se a tua loja está disponível para clientes.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

function Page() {
  const { store, storeStatus: st, setStoreStatus } = useDashboardState();
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const scheduled = st.eliminacaoEm ? new Date(st.eliminacaoEm) : null;
  const dateLabel = scheduled?.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SettingsPage title="Estado da loja">
      {message && <p role="status" className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">{message}</p>}
      <Section title="Estado atual" aside={<StatusBadge tone={st.ativa ? 'ok' : 'muted'}>{st.ativa ? 'Ativa' : 'Desativada'}</StatusBadge>}
        description={st.ativa ? 'Os clientes podem ver a loja e fazer encomendas.' : 'A loja está oculta e não aceita novas encomendas.'}>
        {!scheduled && (
          <Button type="button" variant="secondary" className="self-start" onClick={() => setConfirmToggle(true)}>
            {st.ativa ? 'Desativar loja' : 'Reativar loja'}
          </Button>
        )}
      </Section>

      <section className="flex flex-col gap-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <div>
          <h2 className="text-[15px] font-semibold text-destructive">Zona de perigo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A eliminação é agendada para {DELETION_GRACE_DAYS} dias depois. Durante esse período a loja não aceita novas encomendas,
            mas continuas a aceder às encomendas anteriores, pagamentos pendentes, reembolsos e disputas. Os registos que a lei obriga a conservar são mantidos.
          </p>
        </div>
        {scheduled ? (
          <>
            <p className="text-sm font-medium text-foreground">Eliminação prevista para {dateLabel}.</p>
            <Button type="button" variant="secondary" className="self-start" onClick={() => {
              setStoreStatus({ ativa: st.ativaAntesEliminacao, eliminacaoEm: null, ativaAntesEliminacao: st.ativaAntesEliminacao });
              setMessage('Eliminação cancelada. A loja voltou ao estado anterior.');
            }}>Cancelar eliminação</Button>
          </>
        ) : (
          <Button type="button" variant="danger" className="self-start" onClick={() => { setTyped(''); setDeleteOpen(true); }}>Eliminar loja permanentemente</Button>
        )}
      </section>


      <ConfirmDialog open={confirmToggle} onClose={() => setConfirmToggle(false)}
        title={st.ativa ? 'Desativar a loja?' : 'Reativar a loja?'}
        description={st.ativa
          ? 'A loja fica oculta e deixa de aceitar encomendas. Produtos, configurações e histórico de encomendas são mantidos.'
          : 'A loja volta a ficar visível e a aceitar encomendas.'}
        confirmLabel={st.ativa ? 'Desativar' : 'Reativar'} danger={st.ativa}
        onConfirm={() => { setStoreStatus({ ...st, ativa: !st.ativa }); setMessage(st.ativa ? 'Loja desativada.' : 'Loja reativada.'); }} />

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar loja permanentemente"
        subtitle={`Escreve «${store.nome}» para confirmar. A eliminação acontece daqui a ${DELETION_GRACE_DAYS} dias e podes cancelá-la até lá.`}>
        <div className="flex flex-col gap-4 pb-2 pt-3">
          <Input name="confirmar-nome" label="Nome da loja" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button type="button" variant="danger" className="flex-1" disabled={typed.trim() !== store.nome.trim() || !store.nome.trim()} onClick={() => {
              setStoreStatus({ ativa: false, eliminacaoEm: scheduleDeletionDate(new Date()).toISOString(), ativaAntesEliminacao: st.ativa });
              setDeleteOpen(false);
              setMessage('Eliminação agendada. A loja deixou de aceitar novas encomendas.');
            }}>Agendar eliminação</Button>
          </div>
        </div>
      </Sheet>
    </SettingsPage>
  );
}
