import { PlaceholderImage } from './PlaceholderImage';
import type { LojaPublica } from '@/lib/queries/lojaPublica';

export function HeroBanner({ loja }: { loja: LojaPublica }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <div className="h-48 w-full overflow-hidden rounded-[28px] sm:h-64">
        {loja.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={loja.banner_url} alt={loja.nome} className="h-full w-full object-cover" />
        ) : (
          <PlaceholderImage variante="banner" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-[family-name:'Manrope',_sans-serif] text-[26px] font-extrabold leading-tight tracking-tight text-[oklch(0.24353_0_0)]">
          {loja.nome}
        </h1>
        {loja.descricao && (
          <p className="text-[13.5px] leading-relaxed text-[oklch(0.52081_0_0)]">{loja.descricao}</p>
        )}
      </div>
    </div>
  );
}
