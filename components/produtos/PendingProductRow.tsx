'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, X, Image as ImageIcon, MoreVertical, Pencil, Copy, EyeOff, Trash2 } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';
import { Skeleton } from '@/components/ui/Surfaces';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';

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
const SKELETON_MIN_MS = 1500;
const SKELETON_MAX_MS = 2000;

export function PendingProductRow({
  produto,
  confirmado,
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
}) {
  const { dismissPending, finalizePublish } = usePublishing();
  const { show } = useToast();
  const comErro = produto.status === 'erro';

  // Duração sorteada uma única vez por linha (não a cada re-render), para
  // não parecer sempre o mesmo tempo cronometrado ao segundo.
  const skeletonMsRef = useRef(SKELETON_MIN_MS + Math.random() * (SKELETON_MAX_MS - SKELETON_MIN_MS));
  const [showSkeleton, setShowSkeleton] = useState(!comErro);

  // Checkbox e menu "⋮" respondem ao toque desde o primeiro instante (ver
  // nota mais abaixo) — precisam do seu próprio estado local, já que ainda
  // não existe um `produto.id` real para participar na seleção em massa da
  // ProductsExplorer nem num menu de ações que dependa de mutações no
  // servidor.
  const [selecionado, setSelecionado] = useState(false);
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
    const t = setTimeout(() => setShowSkeleton(false), skeletonMsRef.current);
    return () => clearTimeout(t);
  }, [comErro]);

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
  // erro), com a MESMA aparência visual da linha real — e AGORA também com
  // a mesma resposta ao toque. Enquanto o produto ainda está a publicar,
  // ainda não há `id` real para participar na seleção em massa nem em
  // mutações no servidor, mas isso não é motivo para o botão ficar morto:
  // a checkbox marca-se localmente (dá o mesmo feedback imediato que o
  // lojista já conhece do resto da lista) e o "⋮" abre um menu real com a
  // única ação que já faz sentido nesta fase — cancelar a publicação.
  const checkboxEl = (
    <Checkbox
      checked={selecionado}
      onChange={setSelecionado}
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

  if (showSkeleton) {
    return (
      <div className="flex items-center gap-3 p-4">
        {checkboxEl}
        <Skeleton className="-ml-1 h-14 w-14 flex-shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Skeleton className="h-[13px] w-2/5" />
          <Skeleton className="h-[12px] w-1/3" />
          <Skeleton className="h-[11px] w-1/4" />
        </div>
        {menuEl}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4">
      {checkboxEl}
      <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
        {comErro ? (
          <div className="flex h-full w-full items-center justify-center">
            <AlertTriangle size={22} strokeWidth={1.5} className="text-red-400" />
          </div>
        ) : produto.fotoPreview ? (
          <Image src={produto.fotoPreview} alt="" fill className="object-cover" sizes="56px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={26} strokeWidth={1.5} style={{ color: 'rgba(26,18,16,0.22)' }} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-ink">{produto.nome}</p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-600">
          {produto.precoLabel} MZN · {produto.categoria}
        </p>
        {comErro ? (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <AlertTriangle size={11} className="text-red-500" />
            <span className="text-red-500">{produto.errorMessage ?? 'Não foi possível publicar.'}</span>
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
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
