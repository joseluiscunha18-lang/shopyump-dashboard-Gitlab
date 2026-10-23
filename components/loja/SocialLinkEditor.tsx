'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/ShopyumpButton';
import { Input } from '@/components/ui/ShopyumpInput';
import { useDashboardState, type SocialLink } from '@/components/dashboard/DashboardState';
import { SaveBar, Section, useDraft } from '@/components/settings/SettingsKit';
import { normalizeUrl } from '@/lib/settings/validators';

/** Redes suportadas com campo próprio. Fonte única: `socials` no estado partilhado. */
export const SUPPORTED_NETWORKS = [
  { nome: 'Instagram', placeholder: 'instagram.com/a-tua-loja' },
  { nome: 'Facebook', placeholder: 'facebook.com/a-tua-loja' },
  { nome: 'TikTok', placeholder: 'tiktok.com/@a-tua-loja' },
  { nome: 'YouTube', placeholder: 'youtube.com/@a-tua-loja' },
  { nome: 'Pinterest', placeholder: 'pinterest.com/a-tua-loja' },
  { nome: 'LinkedIn', placeholder: 'linkedin.com/company/a-tua-loja' },
  { nome: 'X', placeholder: 'x.com/a-tua-loja' },
];
const isSupported = (n: string) => SUPPORTED_NETWORKS.some((s) => s.nome.toLowerCase() === n.toLowerCase());

type Row = { id: number; nome: string; url: string };
type Draft = { fixed: Record<string, string>; extra: Row[] };

function toDraft(list: SocialLink[]): Draft {
  const fixed: Record<string, string> = {};
  for (const n of SUPPORTED_NETWORKS) fixed[n.nome] = list.find((s) => s.nome.toLowerCase() === n.nome.toLowerCase())?.url ?? '';
  return { fixed, extra: list.filter((s) => !isSupported(s.nome)).map(({ id, nome, url }) => ({ id, nome, url })) };
}

export function SocialLinkEditor() {
  const { socials, setSocials } = useDashboardState();
  const initial = useMemo(() => toDraft(socials), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [errors, setErrors] = useState<Record<string, string>>({});

  const commit = (d: Draft) => {
    const next: SocialLink[] = [];
    for (const n of SUPPORTED_NETWORKS) {
      const url = normalizeUrl(d.fixed[n.nome] ?? '');
      if (url) next.push({ id: socials.find((s) => s.nome === n.nome)?.id ?? Date.now() + next.length, nome: n.nome, url, visivel: true });
    }
    for (const r of d.extra) { const url = normalizeUrl(r.url); if (url && r.nome.trim()) next.push({ id: r.id, nome: r.nome.trim(), url, visivel: true }); }
    setSocials(next);
  };
  const { draft, setDraft, dirty, save, reset } = useDraft<Draft>(initial, commit);

  function validate() {
    const e: Record<string, string> = {};
    for (const n of SUPPORTED_NETWORKS) if (normalizeUrl(draft.fixed[n.nome] ?? '') === null) e[n.nome] = 'Ligação inválida.';
    for (const r of draft.extra) {
      if (r.url.trim() && !r.nome.trim()) e['n' + r.id] = 'Indica o nome.';
      if (normalizeUrl(r.url) === null) e['u' + r.id] = 'Ligação inválida.';
    }
    return e;
  }

  return (
    <>
      <Section title="Perfis sociais" description="Deixa vazio para não mostrar a rede.">
        {SUPPORTED_NETWORKS.map((n) => (
          <Input key={n.nome} name={'social-' + n.nome} type="url" inputMode="url" label={n.nome} placeholder={n.placeholder}
            value={draft.fixed[n.nome] ?? ''} error={errors[n.nome]}
            onChange={(e) => setDraft((d) => ({ ...d, fixed: { ...d.fixed, [n.nome]: e.target.value } }))} />
        ))}
      </Section>
      <Section title="Outras ligações">
        {draft.extra.map((r) => (
          <div key={r.id} className="flex items-start gap-2">
            <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <Input name={'extra-n' + r.id} label="Nome" value={r.nome} error={errors['n' + r.id]}
                onChange={(e) => setDraft((d) => ({ ...d, extra: d.extra.map((x) => x.id === r.id ? { ...x, nome: e.target.value } : x) }))} />
              <Input name={'extra-u' + r.id} type="url" label="Ligação" placeholder="https://" value={r.url} error={errors['u' + r.id]}
                onChange={(e) => setDraft((d) => ({ ...d, extra: d.extra.map((x) => x.id === r.id ? { ...x, url: e.target.value } : x) }))} />
            </div>
            <Button type="button" variant="ghost" className="mt-7 px-3" aria-label={'Remover ' + (r.nome || 'ligação')}
              onClick={() => setDraft((d) => ({ ...d, extra: d.extra.filter((x) => x.id !== r.id) }))}><Trash2 size={18} /></Button>
          </div>
        ))}
        <Button type="button" variant="secondary" className="self-start"
          onClick={() => setDraft((d) => ({ ...d, extra: [...d.extra, { id: Date.now(), nome: '', url: '' }] }))}>
          <Plus size={16} /> Adicionar outra ligação
        </Button>
      </Section>
      <SaveBar dirty={dirty} onReset={() => { reset(); setErrors({}); }} onSave={() => {
        const e = validate(); setErrors(e);
        if (Object.keys(e).length) return false;
        save();
      }} />
    </>
  );
}
