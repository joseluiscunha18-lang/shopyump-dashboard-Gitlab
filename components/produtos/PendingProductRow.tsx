'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, X, Pencil, Copy, EyeOff, Trash2 } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';
import { segmentosCategoria } from '@/lib/caracteristicasPorCategoria';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Surfaces';
import { ProductThumbnail } from '@/components/produtos/shared/ProductThumbnail';
import { ProductRowCheckbox } from '@/components/produtos/shared/ProductRowCheckbox';
import { ProductActionsMenu, type ProductMenuItem } from '@/components/produtos/shared/ProductActionsMenu';

// tempIds cuja janela de esqueleto já foi consumida (o timeout chegou a
// terminar) pelo menos uma vez. Módulo, não estado do componente — para
// sobreviver às duas montagens desta linha (loading.tsx e depois
// ProductsExplorer) e nunca reativar o esqueleto numa remontagem tardia
// que já o tinha mostrado. Normalmente isso significa que, se a primeira
// montagem (em loading.tsx) já mostrou e terminou o esqueleto, a segunda
// (na ProductsExplorer) nasce direto no conteúdo final — o que é
// correto, já foi vista uma janela completa de esqueleto para este tempId.
const esqueletoJaConsumido = new Set<string>();

// Janela do esqueleto (ms) — contada a partir do instante em que ESTA
// linha monta, não a partir do clique em "Publicar produto". Antes, o
// prazo vinha de um relógio absoluto calculado no clique, à espera de
// que a navegação para /produtos demorasse sempre ~MIN_BOTAO_PUBLICAR_MS;
// se a rede fosse mais lenta que isso, o relógio já estava a meio (ou
// esgotado) quando a linha finalmente nascia, e o esqueleto saía cedo
// demais ou nem chegava a aparecer. Medindo a partir da montagem real,
// a janela completa fica sempre garantida, seja a rede rápida ou lenta.
const SKELETON_MIN_MS = 1600;
const SKELETON_MAX_MS = 1800;

/**
 * Enquanto a publicação está a decorrer (ou já terminou mas ainda à
 * espera de o `produtos` do servidor confirmar), mostra a MESMA aparência
 * de uma linha de produto real — foto local (blob:, é a mesma imagem que
 * vai ficar guardada), nome e preço já digitados. Isso faz a troca por
 * ProductRow (quando os dados reais chegam) ser impercetível — mesmo
 * layout, mesma foto, sem qualquer estado intermédio "a piscar" pelo meio.
 *
 * O layout (checkbox, miniatura, menu "⋮") vem dos componentes partilhados
 * em `components/produtos/shared/` — os mesmos usados pela ProductRow real
 * — para os dois nunca se desalinharem visualmente. Só o CONTEÚDO de cada
 * estado (esqueleto / erro / normal) muda aqui.
 *
 * Ao MONTAR — ou seja, exatamente quando se chega à página Produtos —
 * esta linha (e só esta, as restantes já existentes na lista ficam
 * intactas) passa primeiro por um breve esqueleto (skeleton-shimmer, o
 * mesmo usado no resto do dashboard) antes de revelar a foto/nome/preço.
 * O botão "Publicar produto" já segura a navegação por
 * MIN_BOTAO_PUBLICAR_MS (ver ProductForm) só o suficiente para o clique
 * se sentir registado — o resto do "a processar" acontece aqui, já na
 * lista, como um carregamento rápido em vez de continuar preso ao ecrã do
 * formulário.
 *
 * Em caso de erro, o lojista precisa de contexto para decidir se tenta de
 * novo ou descarta — por isso, se `status` já vier (ou passar a) 'erro',
 * salta-se o esqueleto e mostra-se logo a mensagem e as ações.
 */
export function PendingProductRow({
  produto,
  confirmado,
  selected,
  onToggleSelect,
}: {
  produto: PendingProduto;
  /**
   * True só quando o produto real já está presente no `produtos` recebido
   * do servidor (i.e. o router.refresh() disparado por resolvePublish já
   * chegou). Enquanto for false, mantemos a linha otimista visível mesmo
   * que `produtoId` já tenha chegado e o esqueleto já tenha terminado —
   * finalizar cedo demais deixaria uma janela sem otimista nem real, e é
   * aí que a lista mostra "Nenhum produto encontrado" por engano antes de
   * o produto real aparecer.
   */
  confirmado: boolean;
  /** Vem da ProductsExplorer — a mesma seleção em massa da lista real,
   * chaveada por `pending:${tempId}` (ver ProductsExplorer) já que ainda
   * não existe um `id` de produto real. */
  selected: boolean;
  onToggleSelect: (key: string) => void;
}) {
  const { dismissPending, finalizePublish } = usePublishing();
  const { show } = useToast();
  const comErro = produto.status === 'erro';

  // Mesma regra da ProductRow real: mostra só o segmento mais específico
  // do caminho de categoria, não a cadeia inteira — ver ProductRow.tsx.
  const segmentosPendente = segmentosCategoria(produto.categoria);
  const categoriaEspecifica = segmentosPendente[segmentosPendente.length - 1] ?? produto.categoria;

  // Mostra o esqueleto de início só se este tempId ainda não o tiver
  // consumido — se já foi visto numa montagem anterior (ver
  // `esqueletoJaConsumido`), esta linha nasce direto no conteúdo final.
  const [showSkeleton, setShowSkeleton] = useState(
    !comErro && !esqueletoJaConsumido.has(produto.tempId)
  );

  useEffect(() => {
    // Erro chegado a meio do esqueleto (ex: falhou o upload enquanto ainda
    // se mostrava a animar) — não faz sentido continuar a "carregar" algo
    // que já se sabe ter falhado.
    if (comErro) {
      setShowSkeleton(false);
      return;
    }
    // Já consumido numa montagem anterior desta mesma publicação — nada a
    // fazer, o `useState` inicial já nasceu com `showSkeleton` a false.
    if (esqueletoJaConsumido.has(produto.tempId)) return;
    // Duração sorteada aqui, no mount deste efeito — ou seja, a partir do
    // instante em que a linha realmente aparece no ecrã, e não do clique
    // em "Publicar produto". Isto garante a janela completa
    // (SKELETON_MIN_MS–SKELETON_MAX_MS) sempre que a linha nasce,
    // independentemente de a rede ter sido rápida ou lenta até aqui.
    const duracao = SKELETON_MIN_MS + Math.random() * (SKELETON_MAX_MS - SKELETON_MIN_MS);
    const t = setTimeout(() => {
      esqueletoJaConsumido.add(produto.tempId);
      setShowSkeleton(false);
    }, duracao);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comErro, produto.tempId]);

  // Só depois de o esqueleto terminar É QUE se verifica se já há
  // confirmação real para finalizar — é este componente, não o
  // ProductsExplorer, que decide o momento exato da troca. Isto garante a
  // janela mínima de exibição mesmo quando o servidor responde muito
  // depressa (produto já confirmado antes de a página nem terminar de
  // montar). Se o esqueleto já tiver terminado e a confirmação chegar mais
  // tarde, este efeito volta a correr (por `produto.produtoId` ou
  // `confirmado` mudarem) e finaliza assim que ambos estiverem prontos.
  //
  // A condição exige `confirmado` (não só `produto.produtoId`): ter um
  // produtoId só significa que o insert no servidor terminou — não que o
  // router.refresh() já trouxe esse produto de volta no `produtos` da
  // página. Finalizar com base só no produtoId cria uma janela em que a
  // linha otimista já saiu e a real ainda não chegou, e a lista mostra
  // "Nenhum produto encontrado" por um instante. Ao exigir `confirmado`,
  // a troca só acontece quando já há sempre pelo menos uma linha (a
  // otimista ou a real) visível.
  //
  // E exige também `fotoPronta`: `confirmado` só garante que os DADOS do
  // produto já chegaram — não que a FOTO (tamanho grande, ver
  // PublishingContext.resolvePublish) já terminou de baixar no browser.
  // Sem isto, em ligações mais lentas a troca acontecia antes da foto
  // estar pronta, e a ProductRow real nascia com a miniatura em branco até
  // o download terminar — exatamente a "foto a carregar de novo" que não
  // queremos que o lojista veja. Enquanto `fotoPronta` não for true, a
  // linha otimista continua visível com a MESMA foto (via blob:, já
  // carregada há muito), sem qualquer buraco em branco.
  useEffect(() => {
    if (showSkeleton || comErro) return;
    if (produto.produtoId && confirmado && produto.fotoPronta) finalizePublish(produto.tempId);
  }, [showSkeleton, comErro, produto.produtoId, confirmado, produto.fotoPronta, produto.tempId, finalizePublish]);

  // Enquanto a publicação decorre não há `produto.id` real para as
  // mutações (Editar/Duplicar/Ativar) agirem em cima, por isso avisam em
  // vez de fingir que fizeram algo. "Excluir" continua à parte, por já
  // ser possível de verdade nesta fase (remove a linha otimista).
  function avisarAindaPublicando() {
    show('Aguarda a publicação terminar para fazer isso.');
  }

  const menuItems: ProductMenuItem[] = [
    {
      key: 'editar',
      icon: <Pencil size={15} strokeWidth={2.3} className="text-slate-500" />,
      label: 'Editar',
      onClick: avisarAindaPublicando,
    },
    {
      key: 'duplicar',
      icon: <Copy size={15} strokeWidth={2.3} className="text-slate-500" />,
      label: 'Duplicar',
      onClick: avisarAindaPublicando,
    },
    {
      key: 'inativar',
      icon: <EyeOff size={15} strokeWidth={2.3} className="text-slate-500" />,
      label: 'Inativar',
      onClick: avisarAindaPublicando,
    },
    {
      key: 'excluir',
      icon: <Trash2 size={15} strokeWidth={2.3} />,
      label: 'Excluir',
      onClick: () => dismissPending(produto.tempId),
      danger: true,
      separatorBefore: true,
    },
  ];

  // ── Checkbox e miniatura: mesmos componentes partilhados da ProductRow
  // real, só a variar o `state`/`loading` consoante esqueleto ou erro.
  const thumbnailState = showSkeleton && !comErro ? 'skeleton' : comErro ? 'error' : produto.fotoPreview ? 'image' : 'placeholder';

  return (
    <div className="flex items-center gap-3 p-4" style={{ contain: 'layout', height: '88px' }}>
      <ProductRowCheckbox
        loading={showSkeleton && !comErro}
        checked={selected}
        onChange={() => onToggleSelect(`pending:${produto.tempId}`)}
        ariaLabel="Selecionar produto"
      />

      <ProductThumbnail state={thumbnailState} src={produto.fotoPreview ?? undefined} alt="" />

      <div className="min-w-0 flex-1">
        {showSkeleton && !comErro ? (
          // 3 linhas, não 2 — a linha real sempre acaba com nome, preço·categoria
          // E o status (ponto colorido + "Ativo"/etc). Mostrar só 2 linhas no
          // esqueleto fazia o conteúdo "crescer" uma linha no momento da troca
          // para o real. Espaçamento (mt-2.5/mt-2) maior que o do conteúdo real
          // de propósito — puramente estético, ainda cabe dentro da altura fixa
          // da linha (88px) sem overflow nem descentralizar o bloco de texto.
          <div className="flex flex-col">
            <Skeleton className="h-[13px] w-3/5 rounded-full" />
            <Skeleton className="mt-1 h-[12px] w-2/5 rounded-full" />
            <Skeleton className="mt-1 h-[11px] w-1/3 rounded-full" />
          </div>
        ) : (
          <>
            <p className="truncate text-[13px] leading-[13px] font-bold text-ink">{produto.nome}</p>
            <p className="mt-0.5 truncate text-[12px] leading-[12px] font-semibold text-slate-600">
              {produto.precoLabel} MZN · {categoriaEspecifica}
            </p>
            {comErro ? (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-[11px] font-semibold text-slate-600">
                <AlertTriangle size={11} className="text-red-500" />
                <span className="text-red-500">{produto.errorMessage ?? 'Não foi possível publicar.'}</span>
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-[11px] font-semibold text-slate-600">
                <span className="h-[6px] w-[6px] rounded-full bg-emerald-500" />
                Ativo
              </p>
            )}
          </>
        )}
      </div>

      {comErro ? (
        <div className="flex h-8 flex-shrink-0 items-center gap-1">
          <Link
            href="/produtos/novo"
            aria-label="Tentar novamente"
            title="Tentar novamente"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <RotateCcw size={16} strokeWidth={2.2} />
          </Link>
          <button
            type="button"
            onClick={() => dismissPending(produto.tempId)}
            aria-label="Descartar"
            title="Descartar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        // Mesmo componente, usado diretamente como filho do flex — sem
        // wrapper à volta. O ProductActionsMenu já tem `flex-shrink-0` e
        // tamanho fixo (h-8 w-8) na própria raiz, exatamente o que a
        // ProductRow real faz. Um <div> extra à volta perde esse
        // `flex-shrink-0` (o padrão do flexbox é encolher), e é isso que
        // causava o menu "⋮" a ficar desalinhado em relação às linhas
        // reais — não era o skeleton em si, era o wrapper.
        <ProductActionsMenu items={menuItems} loading={showSkeleton} />
      )}
    </div>
  );
}
