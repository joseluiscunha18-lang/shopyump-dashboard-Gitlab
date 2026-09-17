'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeThumbnail } from '@/components/loja/preview/ThemeThumbnail';
import { THEMES } from '@/types/theme';

type Filtro = 'todos' | 'gratis' | 'premium';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'gratis', label: 'Grátis' },
  { id: 'premium', label: 'Premium' },
];

/**
 * Catálogo de temas — uma "loja de temas" dedicada, separada do editor.
 *
 * Diferente da 1ª versão: os cartões aqui são só uma miniatura estática
 * (<ThemeThumbnail />) + nome + selo Grátis/Premium — nada de
 * "Visualizar"/"Usar este tema" nem preview com aparência funcional
 * aqui. Todo o cartão é um link; a pré-visualização a sério e a ação de
 * aplicar vivem na página de detalhe (`/loja/temas/[id]`). Isto também
 * significa que o tema atualmente em uso na loja não precisa de
 * destaque nenhum aqui — esta página é só para explorar.
 */
export function ThemeCatalog() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const temas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return THEMES.filter((t) => {
      const passaFiltro = filtro === 'todos' || t.pricing === filtro;
      const passaBusca = !termo || t.name.toLowerCase().includes(termo) || t.tagline.toLowerCase().includes(termo);
      return passaFiltro && passaBusca;
    });
  }, [busca, filtro]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href="/loja" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
        <ChevronLeft size={18} /> Editar loja
      </Link>

      <div>
        <h2 className="text-lg font-black tracking-tight text-ink">Temas</h2>
        <p className="text-[12px] font-medium text-slate-400">Escolha uma aparência para sua loja.</p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar tema"
          className="h-11 w-full rounded-[13px] border border-[#E5E3E0] bg-white pl-10 pr-4 text-[13px] font-medium text-ink placeholder:text-slate-400 focus:border-[#111110] focus:outline-none"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors',
              filtro === f.id ? 'bg-[#111110] text-white' : 'bg-[#F4F4F3] text-slate-500'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid 2 colunas — cada cartão é só a miniatura + nome + selo */}
      {temas.length === 0 ? (
        <p className="py-10 text-center text-[13px] font-medium text-slate-400">Nenhum tema encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {temas.map((theme) => (
            <Link
              key={theme.id}
              href={`/loja/temas/${theme.id}`}
              className="flex flex-col overflow-hidden rounded-[16px] border border-[#E5E3E0] transition-transform active:scale-[0.98]"
            >
              <div className="h-32 w-full">
                <ThemeThumbnail theme={theme} />
              </div>
              <div className="flex flex-col gap-0.5 px-3 py-2.5">
                <span className="text-[12.5px] font-black text-ink">{theme.name}</span>
                <span
                  className={cn(
                    'w-fit rounded-full px-2 py-0.5 text-[9.5px] font-bold',
                    theme.pricing === 'gratis' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  )}
                >
                  {theme.pricing === 'gratis' ? 'Grátis' : 'Premium'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
