'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, X, Image as ImageIcon, MoreVertical, Pencil, Copy, EyeOff, Trash2 } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';
import { segmentosCategoria } from '@/lib/caracteristicasPorCategoria';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';

// tempIds cuja janela de esqueleto já foi consumida (o timeout chegou a
// terminar) pelo menos uma vez. Módulo, não estado do componente — para
// sobreviver às duas montagens desta linha (loading.tsx e depois
// ProductsExplorer) e nunca reativar o esqueleto numa remontagem tardia
// que já o tinha mostrado.
const esqueletoJaConsumido = new Set<string>();

// Janela mínima de fallback (ms) usada SÓ quando a navegação para
// /produtos demorou mais do que o previsto (ligação lenta, dispositivo
// lento, etc.) e o relógio absoluto `skeletonUntil` — pensado para o
// caso normal — já tiver expirado antes mesmo de esta linha montar pela
// primeira vez. Sem isto, esse caso extremo saltava logo para o
// conteúdo final sem o lojista chegar a ver nenhuma animação de
// esqueleto. Nunca se aplica numa remontagem cujo esqueleto já foi
// consumido (ver `esqueletoJaConsumido`).
const SKELETON_FALLBACK_MS = 400;

/**
 * Enquanto a publicação está a decorrer (ou já terminou mas ainda à
 * espera de o `produtos` do servidor confirmar), mostra a MESMA aparência
 * de uma linha de produto real — foto local (blob:, é a mesma imagem que
 * vai ficar guardada), nome e preço já digitados. Isso faz a troca por
 * ProductRow (quando os dados reais chegam) ser impercetível — mesmo
 * layout, mesma foto, sem qualquer estado intermédio "a piscar" pelo meio.
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

  // `produto.skeletonUntil` é um relógio absoluto definido UMA VEZ em
  // startPublish (ver PublishingContext) — não um temporizador local desta
  // instância. Isto importa porque esta linha monta pelo menos duas vezes
  // por publicação (dentro de loading.tsx assim que se navega para
  // /produtos, e outra vez dentro da ProductsExplorer quando o page.tsx
  // real chega); se cada montagem recomeçasse a contar do zero, uma troca
  // rápida entre as duas fazia a segunda montagem herdar um prazo cujo
  // "início" já passou, ou nunca dar tempo de o esqueleto ser visto antes
  // de o servidor confirmar. Lendo o mesmo relógio em qualquer montagem,
  // o tempo restante é sempre o correto, medido desde o clique real.
  //
  // `SKELETON_FALLBACK_MS`: cobre o caso em que a navegação para /produtos
  // demorou mais do que o previsto — `restante` já chegaria a 0 mesmo
  // nesta, a primeira montagem desta linha, saltando logo para o conteúdo
  // final sem o esqueleto chegar a aparecer. Só se aplica quando o tempId
  // ainda não tinha consumido o esqueleto nenhuma vez.
  const restante = Math.max(0, produto.skeletonUntil - Date.now());
  const jaConsumido = esqueletoJaConsumido.has(produto.tempId);
  const restanteEfetivo = restante > 0 ? restante : jaConsumido ? 0 : SKELETON_FALLBACK_MS;
  const [showSkeleton, setShowSkeleton] = useState(!comErro && restanteEfetivo > 0);

  // Checkbox e menu "⋮" respondem ao toque desde o primeiro instante (ver
  // nota mais abaixo). O menu continua com estado próprio (não participa
  // em seleção em massa); a checkbox agora vem controlada de fora, pela
  // mesma seleção da ProductsExplorer que a ProductRow real usa.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    // Erro chegado a meio do esqueleto (ex: falhou o upload enquanto ainda
    // se mostrava a animar) — não faz sentido continuar a "carregar" algo
    // que já se sabe ter falhado.
    if (comErro) {
      setShowSkeleton(false);
      return;
    }
    const msRestantes = Math.max(0, produto.skeletonUntil - Date.now());
    // Mesmo fallback do cálculo inicial de `showSkeleton`: se a navegação
    // demorou mais do que o previsto e o relógio absoluto já expirou antes
    // de este efeito sequer correr, ainda assim garante-se uma janela
    // mínima visível — mas só na primeira vez que este tempId aparece.
    const efetivo = msRestantes > 0 ? msRestantes : esqueletoJaConsumido.has(produto.tempId) ? 0 : SKELETON_FALLBACK_MS;
    const t = setTimeout(() => {
      esqueletoJaConsumido.add(produto.tempId);
      setShowSkeleton(false);
    }, efetivo);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comErro, produto.skeletonUntil, produto.tempId]);

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
  useEffect(() => {
    if (showSkeleton || comErro) return;
    if (produto.produtoId && confirmado) finalizePublish(produto.tempId);
  }, [showSkeleton, comErro, produto.produtoId, confirmado, produto.tempId, finalizePublish]);

  // Checkbox e botão "⋮" — a ProductRow real MOSTRA SEMPRE os dois (a
  // ProductsExplorer passa onToggleSelect incondicionalmente). Por isso
  // mostramo-los aqui também, em todos os estados (esqueleto, normal e
  // erro), com a MESMA aparência visual da linha real — e com a mesma
  // resposta ao toque. A checkbox agora participa mesmo na seleção em
  // massa real (contador do cabeçalho, barra flutuante de ações no fundo
  // da lista): usa a chave `pending:${tempId}` porque ainda não há um
  // `id` de produto definitivo. As ações em massa que dependem do
  // servidor (ativar/desativar/duplicar) tratam essa chave como
  // "cancelar publicação" quando aplicadas a uma linha pendente — ver
  // ProductsExplorer.
  const checkboxEl = (
    <Checkbox
      checked={selected}
      onChange={() => onToggleSelect(`pending:${produto.tempId}`)}
      ariaLabel="Selecionar produto"
      className="ml-0.5 mr-2"
    />
  );

  // Feedback para as ações que dependem de o produto já estar gravado no
  // servidor (Editar, Duplicar, Ativar/Inativar): enquanto a publicação
  // ainda decorre não há `produto.id` real para essas mutações agirem em
  // cima, por isso avisam em vez de fingir que fizeram algo. "Cancelar
  // publicação" continua à parte, por já ser possível de verdade nesta
  // fase (remove a linha otimista).
  function avisarAindaPublicando() {
    setMenuOpen(false);
    show('Aguarda a publicação terminar para fazer isso.');
  }

  const menuEl = (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Ações do produto"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
      >
        <MoreVertical size={17} strokeWidth={2.3} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-20 mt-1.5 w-[176px] overflow-hidden rounded-md border border-[#1A1210]/12 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]">
          <button
            type="button"
            onClick={avisarAindaPublicando}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
          >
            <Pencil size={15} strokeWidth={2.3} className="text-slate-500" />
            Editar
          </button>
          <button
            type="button"
            onClick={avisarAindaPublicando}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
          >
            <Copy size={15} strokeWidth={2.3} className="text-slate-500" />
            Duplicar
          </button>
          <button
            type="button"
            onClick={avisarAindaPublicando}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
          >
            <EyeOff size={15} strokeWidth={2.3} className="text-slate-500" />
            Inativar
          </button>
          <div className="my-1 h-px bg-[#1A1210]/8" />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              dismissPending(produto.tempId);
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 size={15} strokeWidth={2.3} />
            Excluir
          </button>
        </div>
      )}
    </div>
  );

  // Placeholder de checkbox e menu — usados no estado de skeleton para
  // reservar o mesmo espaço que a linha real ocupa, evitando qualquer
  // salto de layout na troca entre skeleton → conteúdo. Em vez de ficarem
  // invisíveis (opacity-0), mostram o mesmo shimmer do resto da linha,
  // para o esqueleto cobrir a linha toda — do quadradinho da checkbox até
  // aos "⋮" — e não só a foto e o texto.
  const checkboxPlaceholder = (
    <Skeleton className="ml-0.5 mr-2 h-[19px] w-[19px] flex-shrink-0 rounded-[6px]" />
  );
  const menuPlaceholder = (
    <Skeleton className="h-8 w-8 flex-shrink-0 rounded-md" />
  );

  // ── Skeleton vs conteúdo real ──────────────────────────────────────────
  // Durante a janela do esqueleto (definida por skeletonUntil no
  // PublishingContext), mostra uma linha inteira em skeleton — foto, nome
  // e preço — para que a troca para o conteúdo real seja suave e sem
  // saltos de layout.
  if (showSkeleton && !comErro) {
    return (
      <div className="flex items-center gap-3 p-4" style={{ contain: 'layout' }}>
        {checkboxPlaceholder}
        <Skeleton className="-ml-1 h-14 w-14 flex-shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Skeleton className="h-[13px] w-2/5" />
          <Skeleton className="h-[12px] w-1/3" />
        </div>
        {menuPlaceholder}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4" style={{ contain: 'layout' }}>
      {checkboxEl}
      <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
        {comErro ? (
          <div className="flex h-full w-full items-center justify-center">
            <AlertTriangle size={22} strokeWidth={1.5} className="text-red-400" />
          </div>
        ) : produto.fotoPreview ? (
          <Image src={produto.fotoPreview} alt="" fill className="object-cover" sizes="56px" unoptimized loading="eager" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={26} strokeWidth={1.5} style={{ color: 'rgba(26,18,16,0.22)' }} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
      </div>

      <div className="min-w-0 flex-1">
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
      </div>

      {comErro ? (
        <div className="flex flex-shrink-0 items-center gap-1">
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
        menuEl
      )}
    </div>
  );
}
