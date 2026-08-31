import Link from 'next/link';

const DICAS: { texto: string; href?: string }[] = [
  { texto: 'Adicione mais produtos', href: '/produtos/novo' },
  { texto: 'Melhore as fotos e descrições dos produtos', href: '/produtos' },
  { texto: 'Divulgue sua loja nas redes sociais' },
  { texto: 'Acompanhe suas visitas e pedidos', href: '/analises' },
];

/**
 * Substitui os cards de onboarding quando já não resta nenhum marco por
 * fazer (`loja_marcos` todos concluídos ou dispensados) — a Início não
 * fica então "vazia por cima do resumo", mas também não volta a inventar
 * tarefas obrigatórias: são sugestões soltas, sem estado, sem "X" para
 * dispensar e sem trigger nenhum por trás — não fazem parte do fluxo de
 * onboarding, só preenchem o espaço com ideias úteis e permanentes.
 */
export function GenericGrowthTips() {
  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Dicas para crescer</h2>
      <ul className="flex flex-col gap-2">
        {DICAS.map((dica) =>
          dica.href ? (
            <li key={dica.texto}>
              <Link
                href={dica.href}
                className="block rounded-[14px] bg-white px-4 py-3 text-[13px] font-semibold text-slate-500 ring-1 ring-black/[0.035] transition-colors hover:text-ink"
              >
                {dica.texto}
              </Link>
            </li>
          ) : (
            <li
              key={dica.texto}
              className="rounded-[14px] bg-white px-4 py-3 text-[13px] font-semibold text-slate-500 ring-1 ring-black/[0.035]"
            >
              {dica.texto}
            </li>
          )
        )}
      </ul>
    </div>
  );
}
