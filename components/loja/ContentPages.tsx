'use client';

import { publicContactChannels } from '@/lib/settings/model';
import { ContactChannels, hasContactChannels } from '@/components/store/ContactChannels';
import { useState } from 'react';
import { Link } from '@/lib/router-compat';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, Plus, Eye, Bold, Italic, Heading2, List, Link as LinkIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/ShopyumpButton';
import { Input, Textarea } from '@/components/ui/ShopyumpInput';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { SettingsPage, Section, StatusBadge, DirtyReporter, useDraft } from '@/components/settings/SettingsKit';
import { useToast } from '@/components/ui/Toast';
import { canPublishPage, formatMoney } from '@/lib/settings/validators';

const ORDER = ['sobre', 'entrega', 'devolucoes', 'termos', 'privacidade', 'faq', 'contacto'];
const OPTIONAL = new Set(['sobre', 'faq']);

/** Modelos de partida editáveis. Não constituem aconselhamento jurídico. */
const TEMPLATES: Record<string, string> = {
  termos: '## Encomendas\nDescreve como o cliente faz e confirma uma encomenda.\n\n## Preços\nIndica se os preços incluem impostos e como podem mudar.\n\n## Entregas\nConsulta a nossa política de entrega.\n\n## Contacto\nIndica como o cliente te pode contactar em caso de dúvida.',
  privacidade: '## Dados que recolhemos\nIndica que dados pedes ao cliente (por ex.: nome, telefone, morada).\n\n## Para que usamos\nExplica para que usas esses dados (por ex.: entregar a encomenda).\n\n## Partilha\nIndica com quem partilhas os dados, se aplicável.\n\n## Os teus direitos\nExplica como o cliente pode pedir para ver ou apagar os seus dados.',
  devolucoes: '## Prazo\nIndica em quantos dias o cliente pode pedir uma troca ou devolução.\n\n## Condições\nDescreve em que estado o produto deve estar.\n\n## Reembolsos\nExplica como e em quanto tempo é feito o reembolso.',
};

export function ContentPagesList() {
  const { pages, setPages } = useDashboardState();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const sorted = [...pages].sort((a, b) => (ORDER.indexOf(a.slug) + 1 || 99) - (ORDER.indexOf(b.slug) + 1 || 99));
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        {sorted.map((page) => (
          <Link key={page.slug} to="/configuracoes/politicas/$slug" params={{ slug: page.slug }} className="group flex min-h-14 items-center gap-3.5 px-4 py-3 transition-colors hover:bg-muted/50">
            <FileText size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-medium text-foreground">{page.titulo}</span>
              {OPTIONAL.has(page.slug) && <span className="text-sm text-muted-foreground">Opcional</span>}
            </span>
            <StatusBadge tone={page.publicada ? 'ok' : 'muted'}>{page.publicada ? 'Publicada' : 'Rascunho'}</StatusBadge>
            <ChevronRight size={16} className="text-muted-foreground/50" aria-hidden />
          </Link>
        ))}
      </div>
      {adding ? (
        <form className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs" onSubmit={(e) => {
          e.preventDefault(); if (!title.trim()) return;
          setPages((p) => [...p, { slug: 'pagina-' + Date.now(), titulo: title.trim(), resumo: '', texto: '', publicada: false }]);
          setTitle(''); setAdding(false);
        }}>
          <Input name="page-title" label="Título da nova página" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          <div className="flex gap-2"><Button type="submit">Criar rascunho</Button><Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div>
        </form>
      ) : (
        <Button variant="secondary" className="self-start" onClick={() => setAdding(true)}><Plus size={16} /> Adicionar página</Button>
      )}
    </div>
  );
}

export function ContentPageEditor({ slug }: { slug: string }) {
  const { pages, setPages, contacts, delivery, region } = useDashboardState();
  const page = pages.find((p) => p.slug === slug);
  const { show } = useToast();
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string>();
  const { draft, patch, dirty, save, reset } = useDraft(
    page ?? { slug, titulo: '', resumo: '', texto: '', publicada: false },
    (v) => setPages((list) => list.map((p) => (p.slug === slug ? v : p))),
  );
  if (!page) return <SettingsPage title="Página não encontrada" backTo="/configuracoes/politicas"><Link to="/configuracoes/politicas" className="font-semibold underline">Voltar a Páginas e políticas</Link></SettingsPage>;

  const isContact = slug === 'contacto';
  const channels = publicContactChannels(contacts);
  const hasContent = isContact ? hasContactChannels(channels) : canPublishPage(draft.texto);

  function format(prefix: string, suffix = '') {
    const area = document.getElementById('page-content') as HTMLTextAreaElement | null; if (!area) return;
    const s = area.selectionStart, e = area.selectionEnd;
    patch({ texto: draft.texto.slice(0, s) + prefix + (draft.texto.slice(s, e) || 'Texto') + suffix + draft.texto.slice(e) });
    area.focus();
  }
  function submit(publish: boolean) {
    if (!draft.titulo.trim()) return setError('Indica o título.');
    setError(undefined);
    if (publish && !hasContent) return show('Adiciona conteúdo antes de publicar.', 'error');
    save({ ...draft, titulo: draft.titulo.trim(), publicada: publish });
    show(publish ? 'Página publicada nesta sessão.' : 'Guardada como rascunho.');
  }

  return (
    <SettingsPage title={page.titulo} backTo="/configuracoes/politicas" backLabel="Voltar a Páginas e políticas">
      <DirtyReporter dirty={dirty} />
      <span className="self-start"><StatusBadge tone={page.publicada ? 'ok' : 'muted'}>{page.publicada ? 'Publicada' : 'Rascunho'}</StatusBadge></span>
      <Section title="Conteúdo">
        <Input name="content-title" label="Título *" value={draft.titulo} error={error} onChange={(e) => patch({ titulo: e.target.value })} />
        <Input name="content-summary" label="Introdução (opcional)" value={draft.resumo} onChange={(e) => patch({ resumo: e.target.value })} />
        {isContact ? (
          <p className="text-sm text-muted-foreground">
            Os contactos são geridos em{' '}
            <Link to="/configuracoes/contactos" className="font-semibold text-foreground underline underline-offset-2">Canais de contacto</Link>.
            {!hasContactChannels(channels) && ' Adiciona pelo menos um contacto para publicar esta página.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {slug === 'entrega' && (
              <div className="rounded-md border border-border p-4 text-sm">
                <p className="font-semibold text-foreground">Tarifas em vigor (de Entrega)</p>
                {delivery.domicilio && delivery.zonas.length
                  ? delivery.zonas.map((z) => <p key={z.id} className="text-muted-foreground">{z.nome}: {z.custo === 0 ? 'Grátis' : formatMoney(z.custo, region.moeda)}{z.prazo && ` · ${z.prazo}`}</p>)
                  : <p className="text-muted-foreground">Sem zonas configuradas.</p>}
                <Link to="/configuracoes/entrega" className="font-semibold text-foreground underline underline-offset-2">Gerir zonas e custos</Link>
              </div>
            )}
            {TEMPLATES[slug] && !draft.texto.trim() && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-4 py-3 text-sm">
                <span className="text-muted-foreground">Começa com um modelo e adapta-o à tua loja. Não é aconselhamento jurídico.</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => patch({ texto: TEMPLATES[slug]! })}>Usar modelo</Button>
              </div>
            )}
            <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Formatação do conteúdo">
              {[{ label: 'Negrito', icon: Bold, p: '**', s: '**' }, { label: 'Itálico', icon: Italic, p: '*', s: '*' }, { label: 'Subtítulo', icon: Heading2, p: '\n## ' }, { label: 'Lista', icon: List, p: '\n- ' }, { label: 'Ligação', icon: LinkIcon, p: '[', s: '](https://)' }].map((x) => (
                <Button key={x.label} type="button" variant="ghost" size="sm" className="px-2" aria-label={x.label} title={x.label} onClick={() => format(x.p, x.s)}><x.icon size={17} /></Button>
              ))}
            </div>
            <Textarea id="page-content" name="content" label="Texto" rows={12} value={draft.texto} onChange={(e) => patch({ texto: e.target.value })} />
          </div>
        )}
      </Section>
      {preview && (
        <article className="content-preview rounded-md border border-border p-5"><h1>{draft.titulo}</h1>{draft.resumo && <p>{draft.resumo}</p>}{isContact ? <div className="not-prose mt-4"><ContactChannels data={channels} /></div> : <ReactMarkdown>{draft.texto}</ReactMarkdown>}</article>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        {page.publicada ? (
          <>
            <Button type="button" disabled={!dirty} onClick={() => submit(true)}>Guardar</Button>
            <Button type="button" variant="ghost" onClick={() => submit(false)}>Despublicar</Button>
          </>
        ) : (
          <>
            <Button type="button" disabled={!hasContent} onClick={() => submit(true)}>Publicar</Button>
            <Button type="button" variant="secondary" disabled={!dirty} onClick={() => submit(false)}>Guardar rascunho</Button>
          </>
        )}
        <Button type="button" variant="ghost" onClick={() => setPreview(!preview)}><Eye size={16} />{preview ? 'Fechar pré-visualização' : 'Pré-visualizar'}</Button>
        {dirty && <Button type="button" variant="ghost" onClick={reset}>Descartar</Button>}
      </div>
    </SettingsPage>
  );
}

