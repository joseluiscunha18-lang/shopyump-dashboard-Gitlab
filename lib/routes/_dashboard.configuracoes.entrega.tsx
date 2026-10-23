import { createFileRoute } from '@/lib/route-compat';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, SaveBar, ToggleRow, StatusBadge, useDraft } from '@/components/settings/SettingsKit';
import { Input, Textarea } from '@/components/ui/ShopyumpInput';
import { Button } from '@/components/ui/ShopyumpButton';
import type { DeliveryZone } from '@/lib/settings/model';
import { formatMoney, validateMoney } from '@/lib/settings/validators';

export const Route = createFileRoute('/_dashboard/configuracoes/entrega')({
  head: () => ({ meta: [
    { title: 'Entrega | Shopyump' },
    { name: 'description', content: 'Zonas, custos, prazos e levantamento presencial da tua loja Shopyump.' },
    { property: 'og:title', content: 'Entrega | Shopyump' },
    { property: 'og:description', content: 'Métodos e zonas de entrega da loja.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

type ZoneForm = { id: string | null; nome: string; areas: string; custo: string; prazo: string };
const emptyZone: ZoneForm = { id: null, nome: '', areas: '', custo: '', prazo: '' };

function Page() {
  const { delivery, setDelivery, region } = useDashboardState();
  const { draft, patch, dirty, save, reset } = useDraft(delivery, setDelivery);
  const [form, setForm] = useState<ZoneForm | null>(null);
  const [zoneErrors, setZoneErrors] = useState<Record<string, string>>({});
  const [pickupError, setPickupError] = useState<string>();

  function submitZone() {
    if (!form) return;
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Indica o nome da zona.';
    const m = validateMoney(form.custo); if (m) e.custo = m;
    setZoneErrors(e);
    if (Object.keys(e).length) return;
    const zone: DeliveryZone = { id: form.id ?? String(Date.now()), nome: form.nome.trim(), areas: form.areas.trim(), custo: Number(form.custo.replace(',', '.')), prazo: form.prazo.trim() };
    patch({ zonas: form.id ? draft.zonas.map((z) => z.id === form.id ? zone : z) : [...draft.zonas, zone] });
    setForm(null);
  }

  const homeIncomplete = draft.domicilio && draft.zonas.length === 0;

  return (
    <SettingsPage title="Entrega">
      <Section title="Entrega ao domicílio" aside={homeIncomplete ? <StatusBadge tone="warn">Sem zonas</StatusBadge> : undefined}>
        <ToggleRow label="Entregar ao domicílio" checked={draft.domicilio} onChange={(v) => patch({ domicilio: v })}
          description={homeIncomplete ? 'Adiciona pelo menos uma zona. Sem zonas, esta opção não aparece aos clientes.' : undefined} />
        {draft.domicilio && (
          <div className="flex flex-col gap-3">
            {draft.zonas.length === 0 && !form && <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Ainda não tens zonas de entrega.</p>}
            {draft.zonas.map((z) => (
              <div key={z.id} className="flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-foreground">{z.nome}</p>
                  <p className="text-sm text-muted-foreground">{[z.custo === 0 ? 'Grátis' : formatMoney(z.custo, region.moeda), z.prazo, z.areas].filter(Boolean).join(' · ')}</p>
                </div>
                <Button type="button" variant="ghost" className="px-2" aria-label={'Editar ' + z.nome}
                  onClick={() => { setZoneErrors({}); setForm({ id: z.id, nome: z.nome, areas: z.areas, custo: String(z.custo), prazo: z.prazo }); }}><Pencil size={17} /></Button>
                <Button type="button" variant="ghost" className="px-2" aria-label={'Remover ' + z.nome}
                  onClick={() => patch({ zonas: draft.zonas.filter((x) => x.id !== z.id) })}><Trash2 size={17} /></Button>
              </div>
            ))}
            {form ? (
              <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/40 p-4">
                <p className="text-[15px] font-bold text-foreground">{form.id ? 'Editar zona' : 'Nova zona'}</p>
                <Input name="zona-nome" label="Nome da zona *" placeholder="Ex.: Maputo Cidade" value={form.nome} error={zoneErrors.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                <Input name="zona-areas" label="Bairros ou áreas abrangidas (opcional)" placeholder="Ex.: Polana, Sommerschield" value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="zona-custo" inputMode="decimal" label="Custo *" suffix={region.moeda} placeholder="0" value={form.custo} error={zoneErrors.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} />
                  <Input name="zona-prazo" label="Prazo estimado" placeholder="Ex.: 1 a 2 dias úteis" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={submitZone}>{form.id ? 'Atualizar zona' : 'Adicionar zona'}</Button>
                  <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="secondary" className="self-start" onClick={() => { setZoneErrors({}); setForm(emptyZone); }}><Plus size={16} /> Adicionar zona</Button>
            )}
          </div>
        )}
      </Section>
      <Section title="Levantamento presencial">
        <ToggleRow label="Permitir levantamento" checked={draft.levantamento} onChange={(v) => patch({ levantamento: v })} />
        {draft.levantamento && (
          <>
            <Input name="local" label="Local de levantamento *" placeholder="Ex.: Loja, Av. Eduardo Mondlane 100" value={draft.localLevantamento} error={pickupError}
              onChange={(e) => patch({ localLevantamento: e.target.value })} />
            <Textarea name="instrucoes" label="Instruções para o cliente (opcional)" rows={3} placeholder="Ex.: Levantamentos de segunda a sábado, das 9h às 17h." value={draft.instrucoesLevantamento}
              onChange={(e) => patch({ instrucoesLevantamento: e.target.value })} />
          </>
        )}
      </Section>
      <SaveBar dirty={dirty} onReset={() => { reset(); setForm(null); setPickupError(undefined); }} onSave={() => {
        const err = draft.levantamento && !draft.localLevantamento.trim() ? 'Indica onde o cliente levanta o pedido.' : undefined;
        setPickupError(err);
        if (err) return false;
        save();
      }} />
    </SettingsPage>
  );
}
