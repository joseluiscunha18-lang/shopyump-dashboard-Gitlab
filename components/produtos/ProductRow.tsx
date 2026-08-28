'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Copy, EyeOff, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toggleProdutoAtivo, deleteProduto, duplicateProduto } from '@/lib/mutations/produtos';
import { segmentosCategoria } from '@/lib/caracteristicasPorCategoria';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductThumbnail } from '@/components/produtos/shared/ProductThumbnail';
import { ProductRowCheckbox } from '@/components/produtos/shared/ProductRowCheckbox';
import { ProductActionsMenu, type ProductMenuItem } from '@/components/produtos/shared/ProductActionsMenu';
import type { Produto } from '@/types/database';

export function ProductRow({
  produto,
  selected = false,
  onToggleSelect,
}: {
  produto: Produto;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [ativo, setAtivo] = useState(produto.ativo);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  function handleToggleAtivo() {
    const next = !ativo;
    setAtivo(next);
    startTransition(async () => {
      const res = await toggleProdutoAtivo(produto.id, next);
      if (!res.ok) {
        setAtivo(!next);
        show(res.error ?? 'Não foi possível atualizar o produto.', 'error');
      }
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const res = await duplicateProduto(produto.id);
      if (!res.ok) show(res.error ?? 'Não foi possível duplicar o produto.', 'error');
      else show('Produto duplicado.');
    });
  }

  function confirmarDelete() {
    startTransition(async () => {
      const res = await deleteProduto(produto.id);
      if (!res.ok) show(res.error ?? 'Não foi possível remover o produto.', 'error');
      else show('Produto removido.');
    });
  }

  const preco = produto.preco_promo && produto.preco_promo > 0 ? produto.preco_promo : produto.preco;
  // `produto.categoria` guarda o caminho completo ("Moda › Calçados ›
  // Ténis"), mas mostrar a cadeia inteira nesta linha estreita é o que
  // fazia o texto cortar. A última parte já é a mais específica da
  // hierarquia — é ela que identifica o produto, o resto ("Moda", etc.) é
  // implícito e não faz falta aqui.
  const segmentos = segmentosCategoria(produto.categoria);
  const categoriaEspecifica = segmentos[segmentos.length - 1] ?? produto.categoria;
  const temEstoque = typeof produto.estoque === 'number';

  const menuItems: ProductMenuItem[] = [
    {
      key: 'editar',
      icon: <Pencil size={15} strokeWidth={2.3} className="text-slate-500" />,
      label: 'Editar',
      href: `/produtos/${produto.id}`,
    },
    {
      key: 'duplicar',
      icon: <Copy size={15} strokeWidth={2.3} className="text-slate-500" />,
      label: 'Duplicar',
      onClick: handleDuplicate,
      disabled: pending,
    },
    {
      key: 'ativo',
      icon: ativo ? (
        <EyeOff size={15} strokeWidth={2.3} className="text-slate-500" />
      ) : (
        <Eye size={15} strokeWidth={2.3} className="text-slate-500" />
      ),
      label: ativo ? 'Inativar' : 'Ativar',
      onClick: handleToggleAtivo,
      disabled: pending,
    },
    {
      key: 'excluir',
      icon: <Trash2 size={15} strokeWidth={2.3} />,
      label: 'Excluir',
      onClick: () => setConfirmDeleteOpen(true),
      disabled: pending,
      danger: true,
      separatorBefore: true,
    },
  ];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/produtos/${produto.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/produtos/${produto.id}`);
      }}
      className={cn(
        'group flex items-center gap-3 p-4 transition-colors hover:bg-slate-50/60 cursor-pointer',
        selected && 'bg-[#1A1210]/[0.04] hover:bg-[#1A1210]/[0.06]',
      )}
      style={{ contain: 'layout', height: '88px' }}
    >
      {onToggleSelect && (
        <ProductRowCheckbox
          checked={selected}
          onChange={() => onToggleSelect(produto.id)}
          ariaLabel={`Selecionar ${produto.nome}`}
        />
      )}

      <ProductThumbnail
        state={produto.fotos?.[0] ? 'image' : 'placeholder'}
        src={produto.fotos?.[0]}
        alt={produto.nome}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] leading-[13px] font-bold text-ink">{produto.nome}</p>
        <p className="mt-0.5 truncate text-[12px] leading-[12px] font-semibold text-slate-600">
          {preco.toLocaleString('pt-MZ')} MZN · {categoriaEspecifica}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-[11px] font-semibold text-slate-600">
          {ativo ? (
            <span className="h-[6px] w-[6px] rounded-full bg-emerald-500" />
          ) : produto.rascunho ? (
            <span className="h-[6px] w-[6px] rounded-full bg-amber-400" />
          ) : (
            <span className="h-[6px] w-[6px] rounded-full bg-slate-300" />
          )}
          {ativo ? 'Ativo' : produto.rascunho ? 'Rascunho' : 'Inativo'}
          {temEstoque && <span className="text-slate-400">· Estoque: {produto.estoque}</span>}
        </p>
      </div>

      <ProductActionsMenu items={menuItems} />

      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={confirmarDelete}
          title={`Remover "${produto.nome}"?`}
          description="Esta ação não pode ser desfeita."
          confirmLabel="Remover"
          danger
        />
      </div>
    </div>
  );
}
