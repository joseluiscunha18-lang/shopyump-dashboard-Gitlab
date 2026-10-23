import { createFileRoute } from '@/lib/route-compat';
import { useEffect, useState } from 'react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, SaveBar, FieldSelect, useDraft } from '@/components/settings/SettingsKit';
import { Input } from '@/components/ui/ShopyumpInput';
import { DEFAULT_TIMEZONE_BY_COUNTRY, PROVINCES, countryOptions } from '@/lib/settings/model';
import { validateStoreName, STORE_NAME_MAX } from '@/lib/settings/validators';

export const Route = createFileRoute('/_dashboard/configuracoes/dados')({
  head: () => ({ meta: [
    { title: 'Informações gerais | Shopyump' },
    { name: 'description', content: 'Nome e localização comercial da tua loja Shopyump.' },
    { property: 'og:title', content: 'Informações gerais | Shopyump' },
    { property: 'og:description', content: 'Nome e localização comercial da tua loja Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Page,
});

function Page() {
  const { store, setStore, region, setRegion } = useDashboardState();
  // País: fonte única em region.pais (usada por moeda, fuso e entrega); editado só aqui.
  const { draft, patch, dirty, save } = useDraft({ ...store, pais: region.pais }, ({ pais, ...s }) => {
    setStore(s);
    if (pais !== region.pais) setRegion({ ...region, pais, fuso: DEFAULT_TIMEZONE_BY_COUNTRY[pais] ?? region.fuso });
  });
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState([{ code: region.pais, label: region.pais }]);
  useEffect(() => { setCountries(countryOptions()); }, []);
  const provinces = PROVINCES[draft.pais];

  return (
    <SettingsPage title="Informações gerais">
      <Section title="Identificação da loja">
        <Input name="nome" label="Nome da loja" value={draft.nome} maxLength={STORE_NAME_MAX} required error={error ?? undefined}
          onChange={(e) => { patch({ nome: e.target.value }); if (error) setError(validateStoreName(e.target.value)); }} />
      </Section>
      <Section title="Localização comercial">
        <FieldSelect id="pais" label="País" value={draft.pais} onChange={(v) => patch({ pais: v, provincia: '' })}>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </FieldSelect>
        {provinces ? (
          <FieldSelect id="provincia" label="Província ou região" value={draft.provincia} onChange={(v) => patch({ provincia: v })}>
            <option value="">Selecionar</option>
            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </FieldSelect>
        ) : (
          <Input name="provincia" label="Província ou região" value={draft.provincia} onChange={(e) => patch({ provincia: e.target.value })} />
        )}
        <Input name="cidade" label="Cidade ou localidade" value={draft.cidade} onChange={(e) => patch({ cidade: e.target.value })} />
      </Section>
      <SaveBar dirty={dirty} onSave={() => {
        const err = validateStoreName(draft.nome);
        setError(err);
        if (err) return false;
        save({ ...draft, nome: draft.nome.trim(), cidade: draft.cidade.trim(), provincia: draft.provincia.trim() });
      }} />
    </SettingsPage>
  );
}
