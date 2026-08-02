'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Surfaces';
import { toggleProdutoAtivo, deleteProduto } from '@/lib/mutations/produtos';
import { useToast } from '@/components/ui/Toast';
import type { Produto } from '@/types/database';

export function ProductRow({ produto }: { produto: Produto }) {
  const [ativo, setAtivo] = useState(produto.ativo);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function handleToggle() {
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

  function handleDelete() {
    if (!confirm(`Remover "${produto.nome}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const res = await deleteProduto(produto.id);
      if (!res.ok) show(res.error ?? 'Não foi possível remover o produto.', 'error');
      else show('Produto removido.');
    });
  }

  const preco = produto.preco_promo && produto.preco_promo > 0 ? produto.preco_promo : produto.preco;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50/60 transition-colors">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
        {produto.fotos?.[0] && (
          <Image src={produto.fotos[0]} alt={produto.nome} fill className="object-cover" sizes="56px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-ink truncate">{produto.nome}</p>
        <p className="text-[12px] font-semibold text-slate-500">{preco.toLocaleString('pt-MZ')} MT · {produto.categoria}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={pending}
        className="flex-shrink-0"
        title={ativo ? 'Visível na loja' : 'Oculto da loja'}
      >
        <Badge tone={ativo ? 'success' : 'neutral'}>{ativo ? 'Ativo' : 'Inativo'}</Badge>
      </button>
      <Link href={`/produtos/${produto.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors flex-shrink-0">
        <Pencil size={15} />
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
