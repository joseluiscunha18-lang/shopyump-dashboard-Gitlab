import { createFileRoute } from '@/lib/route-compat';
import { useState } from 'react';
import { MessageCircle, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/ShopyumpCheckbox';
import { WEEKDAYS } from '@/lib/settings/model';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, SaveBar, ToggleRow, useDraft } from '@/components/settings/SettingsKit';
import { Input, Textarea } from '@/components/ui/ShopyumpInput';
import { Button } from '@/components/ui/ShopyumpButton';
import { updateLoja } from '@/lib/mutations/loja';
import { validateEmail, validateInternationalPhone, whatsappLink, normalizePhone } from '@/lib/settings/validators';

export const Route = createFileRoute('/_dashboard/configuracoes/contactos')({
  head: () => ({ meta: [
    { title: 'Contactos | Shopyump' },
    { name: 'description', content: 'WhatsApp, telefone, e-mail e horário de atendimento da loja.' },
    { property: 'og:title', content: 'Contactos | Shopyump' },
    { property: 'og:description', content: 'Canais oficiais de contacto da loja.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

type Errors = Partial<Record<'whatsapp' | 'telefone' | 'email' | 'horario', string>>;

function Page() {
  const { contacts, setContacts, lojaId } = useDashboardState();
  const { draft, patch, dirty, save, reset } = useDraft(contacts, setContacts);
  const [errors, setErrors] = useState<Errors>({});
  const wa = whatsappLink(draft.whatsapp, draft.mensagemWhatsapp);

  function validate(): Errors {
    const e: Errors = {};
    const w = validateInternationalPhone(draft.whatsapp); if (w) e.whatsapp = w;
    const t = validateInternationalPhone(draft.telefone); if (t) e.telefone = t;
    const m = validateEmail(draft.email); if (m) e.email = m;
    if (draft.horarioAtivo && draft.horario.some((d) => d.aberto && d.periodos.some((p) => !p.abertura || !p.fecho || p.abertura >= p.fecho)))
      e.horario = 'Cada período deve fechar depois de abrir.';
    return e;
  }

  return (
    <SettingsPage title="Canais de contacto">
      <Section title="WhatsApp" description="Usado também para receber encomendas pelo WhatsApp.">
        <Input name="whatsapp" type="tel" label="Número de WhatsApp" placeholder="Ex.: +258 84 000 0000" value={draft.whatsapp} error={errors.whatsapp}
          onChange={(e) => patch({ whatsapp: e.target.value })} />
        <Textarea name="mensagemWhatsapp" label="Mensagem inicial (opcional)" rows={2} placeholder="Ex.: Olá! Tenho uma pergunta sobre um produto." value={draft.mensagemWhatsapp}
          onChange={(e) => patch({ mensagemWhatsapp: e.target.value })} />
        <Button type="button" variant="secondary" className="self-start" disabled={!wa}
          onClick={() => wa && window.open(wa, '_blank', 'noopener')}>
          <MessageCircle size={16} /> Testar conversa
        </Button>
      </Section>
      <Section title="Telefone">
        <Input name="telefone" type="tel" label="Número de telefone (opcional)" placeholder="Ex.: +258 21 000 000" value={draft.telefone} error={errors.telefone}
          onChange={(e) => patch({ telefone: e.target.value })} />
      </Section>
      <Section title="E-mail">
        <Input name="email" type="email" label="E-mail da loja (opcional)" placeholder="Ex.: loja@exemplo.co.mz" value={draft.email} error={errors.email}
          onChange={(e) => patch({ email: e.target.value })} />
      </Section>
      <Section title="Horário de funcionamento" description='Os clientes veem se estás disponível para atender. Não fecha a loja nem impede compras.'>
        <ToggleRow label="Mostrar horário na loja" checked={draft.horarioAtivo} onChange={(v) => patch({ horarioAtivo: v })} />
        {draft.horarioAtivo && (
          <div className="flex flex-col gap-5">
            {draft.horario.map((day, i) => {
              const setDay = (d: typeof day) => patch({ horario: draft.horario.map((x, j) => (j === i ? d : x)) });
              return (
                <div key={WEEKDAYS[i]} className="flex flex-col gap-3">
                  <label className="flex items-center gap-3">
                    <Checkbox checked={day.aberto} ariaLabel={WEEKDAYS[i]} onChange={(v) => setDay({ ...day, aberto: v })} />
                    <span className="text-[15px] text-foreground">{WEEKDAYS[i]}</span>
                  </label>
                  {day.aberto && day.periodos.map((p, k) => {
                    const setP = (np: typeof p) => setDay({ ...day, periodos: day.periodos.map((x, j) => (j === k ? np : x)) });
                    return (
                      <div key={k} className="flex items-center gap-2">
                        <input type="time" aria-label={`${WEEKDAYS[i]} abre às`} value={p.abertura} onChange={(e) => setP({ ...p, abertura: e.target.value })}
                          className="h-12 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-[15px] text-foreground" />
                        <span className="text-muted-foreground">–</span>
                        <input type="time" aria-label={`${WEEKDAYS[i]} fecha às`} value={p.fecho} onChange={(e) => setP({ ...p, fecho: e.target.value })}
                          className="h-12 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-[15px] text-foreground" />
                        {k === 0 ? (
                          <button type="button" aria-label="Adicionar período" className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted"
                            onClick={() => setDay({ ...day, periodos: [...day.periodos, { abertura: '14:00', fecho: '18:00' }] })}><Plus size={20} /></button>
                        ) : (
                          <button type="button" aria-label="Remover período" className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            onClick={() => setDay({ ...day, periodos: day.periodos.filter((_, j) => j !== k) })}><X size={20} /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {errors.horario && <p role="alert" className="text-sm text-destructive">{errors.horario}</p>}
          </div>
        )}
      </Section>
      <SaveBar dirty={dirty} onReset={() => { reset(); setErrors({}); }} onSave={async () => {
        const e = validate(); setErrors(e);
        if (Object.keys(e).length) return false;
        const next = { ...draft, whatsapp: draft.whatsapp ? normalizePhone(draft.whatsapp) : '', telefone: draft.telefone ? normalizePhone(draft.telefone) : '' };
        // O WhatsApp e o e-mail têm de ir para a base de dados: é daí que a loja pública lê o número que recebe os pedidos.
        const r = await updateLoja(lojaId, { whatsapp: next.whatsapp || null, email: next.email.trim() || null });
        if (!r.ok) throw new Error(r.error);
        save(next);
      }} />
    </SettingsPage>
  );
}
