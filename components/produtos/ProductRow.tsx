'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MoreVertical, Pencil, Copy, EyeOff, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toggleProdutoAtivo, deleteProduto, duplicateProduto } from '@/lib/mutations/produtos';
import { useToast } from '@/components/ui/Toast';
import { Checkbox } from '@/components/ui/Checkbox';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  function handleToggleAtivo() {
    setMenuOpen(false);
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
    setMenuOpen(false);
    startTransition(async () => {
      const res = await duplicateProduto(produto.id);
      if (!res.ok) show(res.error ?? 'Não foi possível duplicar o produto.', 'error');
      else show('Produto duplicado.');
    });
  }

  function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Remover "${produto.nome}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const res = await deleteProduto(produto.id);
      if (!res.ok) show(res.error ?? 'Não foi possível remover o produto.', 'error');
      else show('Produto removido.');
    });
  }

  const preco = produto.preco_promo && produto.preco_promo > 0 ? produto.preco_promo : produto.preco;
  const temEstoque = typeof produto.estoque === 'number';

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
    >
      {onToggleSelect && (
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(produto.id)}
          ariaLabel={`Selecionar ${produto.nome}`}
          className="ml-0.5 mr-2"
        />
      )}

      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {produto.fotos?.[0] && (
          <Image src={produto.fotos[0]} alt={produto.nome} fill className="object-cover" sizes="56px" />
        )}
        {/* Contorno "fundido" à imagem (inset, não uma borda por fora) — a
        mesma técnica usada no card animado da tela de login/onboarding. */}
        <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(26,18,16,0.14)]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-ink">{produto.nome}</p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-600">
          {preco.toLocaleString('pt-MZ')} MT · {produto.categoria}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <span className={cn('h-[6px] w-[6px] rounded-full', ativo ? 'bg-emerald-500' : 'bg-slate-300')} />
          {ativo ? 'Ativo' : 'Inativo'}
          {temEstoque && <span className="text-slate-400">· Estoque: {produto.estoque}</span>}
        </p>
      </div>

      <div ref={menuRef} className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          disabled={pending}
          aria-label="Ações do produto"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <MoreVertical size={17} strokeWidth={2.3} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-[176px] overflow-hidden rounded-2xl border border-[#1A1210]/12 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]">
            <Link
              href={`/produtos/${produto.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
            >
              <Pencil size={15} strokeWidth={2.3} className="text-slate-500" />
              Editar
            </Link>
            <button
              onClick={handleDuplicate}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
            >
              <Copy size={15} strokeWidth={2.3} className="text-slate-500" />
              Duplicar
            </button>
            <button
              onClick={handleToggleAtivo}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
            >
              {ativo ? (
                <EyeOff size={15} strokeWidth={2.3} className="text-slate-500" />
              ) : (
                <Eye size={15} strokeWidth={2.3} className="text-slate-500" />
              )}
              {ativo ? 'Inativar' : 'Ativar'}
            </button>
            <div className="my-1 h-px bg-[#1A1210]/8" />
            <button
              onClick={handleDelete}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={15} strokeWidth={2.3} />
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
