'use client';

import { Search, ShoppingBag, ArrowLeft, X } from 'lucide-react';

interface StoreHeaderProps {
  nomeLoja: string;
  /** Quando definido, o cabeçalho mostra "← título" em vez de logo/busca/carrinho. */
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
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#EAE7E1] bg-white/90 px-4 py-3.5 backdrop-blur-md">
        <button
          type="button"
          onClick={voltar.onClick}
          className="flex items-center gap-1.5 text-[13px] font-bold text-[#141414] active:opacity-60"
        >
          <ArrowLeft size={16} />
          {voltar.titulo}
        </button>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex flex-col border-b border-[#EAE7E1] bg-white/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="truncate font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold tracking-tight text-[#141414]">
          {nomeLoja}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleBusca}
            aria-label={buscaAberta ? 'Fechar busca' : 'Procurar produtos'}
            className="flex h-9 w-9 items-center justify-center text-[#141414] active:opacity-60"
          >
            {buscaAberta ? <X size={18} /> : <Search size={18} />}
          </button>

          <button
            type="button"
            onClick={onAbrirCarrinho}
            aria-label="Ver carrinho"
            className="relative flex h-9 w-9 items-center justify-center text-[#141414] active:opacity-60"
          >
            <ShoppingBag size={18} />
            {contagemCarrinho > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#141414] px-1 text-[9px] font-black text-white">
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
            className="h-10 w-full rounded-[10px] border border-[#EAE7E1] bg-[#F5F3EF] px-3.5 text-[13px] font-medium text-[#141414] placeholder:text-[#B5AFA5] focus:border-[#141414] focus:outline-none"
          />
        </div>
      )}
    </header>
  );
}
