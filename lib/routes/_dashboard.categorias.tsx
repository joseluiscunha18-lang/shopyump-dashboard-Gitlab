import { createFileRoute, Link } from '@/lib/route-compat';
import { PageShell, PageHeader } from '@/components/demo/DemoKit';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';

export const Route = createFileRoute('/_dashboard/categorias')({
  head: () => ({ meta: [
    { title: 'Categorias | Shopyump' },
    { name: 'description', content: 'Categorias dos produtos da tua loja.' },
    { property: 'og:title', content: 'Categorias | Shopyump' },
    { property: 'og:description', content: 'Categorias dos produtos da tua loja.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  loader: async () => {
    const ctx = await getUserContext();
    const produtos = ctx.loja ? await getProdutosByLoja(ctx.loja.id) : [];
    // As categorias vêm dos próprios produtos (campo `categoria`), por isso refletem sempre o catálogo real.
    const contagem = new Map<string, number>();
    for (const p of produtos) if (p.categoria) contagem.set(p.categoria, (contagem.get(p.categoria) ?? 0) + 1);
    return { categorias: [...contagem.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt')) };
  },
  component: Page,
});

function Page() {
  const { categorias } = Route.useLoaderData();
  return (
    <PageShell>
      <PageHeader title="Categorias" subtitle="Categorias usadas nos teus produtos" />
      {categorias.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Ainda não tens categorias. Elas aparecem aqui quando adicionares produtos.</p>
      ) : (
        <div>
          {categorias.map(([nome, n]) => (
            <div key={nome} className="settings-row">
              <span className="text-sm font-semibold">{nome}</span>
              <span className="ml-auto text-xs text-muted-foreground">{n} {n === 1 ? 'produto' : 'produtos'}</span>
            </div>
          ))}
        </div>
      )}
      <Link to="/produtos" className="text-sm underline">Voltar a Produtos</Link>
    </PageShell>
  );
}
