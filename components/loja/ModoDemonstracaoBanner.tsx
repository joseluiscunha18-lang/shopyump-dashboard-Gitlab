import { Info } from 'lucide-react';

/**
 * Aviso discreto no painel — mostra-se enquanto a loja pública ainda
 * está a exibir produtos de demonstração (ver
 * lib/store/themes/default/demo/demoData.ts). Some sozinho assim que o
 * lojista publicar o primeiro produto real — é por isso que este
 * componente só precisa de saber `temProdutos`, nada mais: renderiza
 * `null` quando já existe pelo menos 1 produto.
 *
 * Integração: em ProdutosPageBody.tsx, ao lado de <ProductCelebrationBanner>:
 *   <ModoDemonstracaoBanner temProdutos={produtos.length > 0} />
 */
export function ModoDemonstracaoBanner({ temProdutos }: { temProdutos: boolean }) {
  if (temProdutos) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-3">
      <Info size={15} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="text-[12.5px] font-medium leading-snug text-amber-800">
        A tua loja pública está a mostrar produtos de exemplo, só para dares uma ideia de como vai ficar. Assim que
        publicares o teu primeiro produto, eles desaparecem automaticamente.
      </p>
    </div>
  );
}
