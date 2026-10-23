import { createFileRoute } from '@/lib/route-compat';
import { useEffect, useState } from 'react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, SaveBar, FieldSelect, useDraft } from '@/components/settings/SettingsKit';
import { CURRENCIES, PUBLIC_LANGUAGES, timezoneLabel, timezoneOptions, type CurrencyCode } from '@/lib/settings/model';
import { formatMoney } from '@/lib/settings/validators';

export const Route = createFileRoute('/_dashboard/configuracoes/regiao')({
  head: () => ({ meta: [
    { title: 'Idioma e moeda | Shopyump' },
    { name: 'description', content: 'Idioma, moeda e fuso horário da tua loja Shopyump.' },
    { property: 'og:title', content: 'Idioma e moeda | Shopyump' },
    { property: 'og:description', content: 'Preferências regionais da loja.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

function Page() {
  const { region, setRegion } = useDashboardState();
  const { draft, patch, dirty, save, reset } = useDraft(region, setRegion);
  // Listas dependem do ICU do navegador: carregadas após montar para evitar diferenças com o servidor.
  const [zones, setZones] = useState([region.fuso]);
  useEffect(() => { setZones(timezoneOptions()); }, []);
  const language = PUBLIC_LANGUAGES[0]!;

  return (
    <SettingsPage title="Idioma e moeda">
      <Section title="Idioma da loja">
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold text-foreground">{language.label}</span>
          <span className="text-sm text-muted-foreground">É o único idioma disponível de momento.</span>
        </div>
      </Section>
      <Section title="Moeda">
        <FieldSelect id="moeda" label="Moeda dos preços" value={draft.moeda} onChange={(v) => patch({ moeda: v as CurrencyCode })}
          hint={`Exemplo: ${formatMoney(1250, draft.moeda)}`}>
          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
        </FieldSelect>
        {draft.moeda !== region.moeda && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
            Os preços dos produtos não são convertidos. O valor numérico mantém-se e passa a ser lido em {draft.moeda}.
          </p>
        )}
      </Section>
      <Section title="Fuso horário">
        <FieldSelect id="fuso" label="Fuso horário" value={draft.fuso} onChange={(v) => patch({ fuso: v })}>
          {(zones.includes(draft.fuso) ? zones : [draft.fuso, ...zones]).map((z) => <option key={z} value={z}>{timezoneLabel(z)}</option>)}
        </FieldSelect>
      </Section>
      <SaveBar dirty={dirty} onReset={reset} onSave={() => {
        // O país é gerido em Informações gerais; preserva-se o valor atual.
        save({ ...draft, pais: region.pais });
      }} />
    </SettingsPage>
  );
}
