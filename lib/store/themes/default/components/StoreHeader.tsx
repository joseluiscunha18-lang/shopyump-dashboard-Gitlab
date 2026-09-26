'use client';

import { Search, ShoppingBag, ArrowLeft, X } from 'lucide-react';

interface StoreHeaderProps {
  nomeLoja: string;
  voltar?: { titulo: string; onClick: () => void };
  buscaAberta: boolean;
  onToggleBusca: () => void;
  valorBusca: string;
  onMudaBusca: (v: string) => void;
  contagemCarrinho: number;
  onAbrirCarrinho: () => void;
}

export function StoreHeader({
  nomeLoja,
  voltar,
  buscaAberta,
  onToggleBusca,
  valorBusca,
  onMudaBusca,
  contagemCarrinho,
  onAbrirCarrinho,
}: StoreHeaderProps) {
  if (voltar) {
    return (
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[oklch(0.88224_0_0)] bg-white/90 px-4 py-3.5 backdrop-blur-md">
        <button
          type="button"
          onClick={voltar.onClick}
          className="flex items-center gap-1.5 text-[13px] font-bold text-[oklch(0.24353_0_0)] active:opacity-60"
        >
          <ArrowLeft size={16} />
          {voltar.titulo}
        </button>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex flex-col border-b border-[oklch(0.88224_0_0)] bg-white/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="truncate font-[family-name:'Manrope',_sans-serif] text-[16px] font-extrabold tracking-tight text-[oklch(0.24353_0_0)]">
          {nomeLoja}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleBusca}
            aria-label={buscaAberta ? 'Fechar busca' : 'Procurar produtos'}
            className="flex h-9 w-9 items-center justify-center text-[oklch(0.24353_0_0)] active:opacity-60"
          >
            {buscaAberta ? <X size={18} /> : <Search size={18} />}
          </button>

          <button
            type="button"
            onClick={onAbrirCarrinho}
            aria-label="Ver carrinho"
            className="relative flex h-9 w-9 items-center justify-center text-[oklch(0.24353_0_0)] active:opacity-60"
          >
            <ShoppingBag size={18} />
            {contagemCarrinho > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[oklch(0.24353_0_0)] px-1 text-[9px] font-black text-white">
                {contagemCarrinho}
              </span>
            )}
          </button>
        </div>
      </div>

      {buscaAberta && (
        <div className="px-4 pb-3.5">
          <input
            autoFocus
            type="text"
            value={valorBusca}
            onChange={(e) => onMudaBusca(e.target.value)}
            placeholder="Procurar produtos…"
            className="h-10 w-full rounded-[10px] border border-[oklch(0.88224_0_0)] bg-[oklch(0.95213_0_0)] px-3.5 text-[13px] font-medium text-[oklch(0.24353_0_0)] placeholder:text-[oklch(0.52081_0_0)] focus:border-[oklch(0.24353_0_0)] focus:outline-none"
          />
        </div>
      )}
    </header>
  );
}
