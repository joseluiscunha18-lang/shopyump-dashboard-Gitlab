import { PlaceholderImage } from './PlaceholderImage';
import type { LojaPublica } from '@/lib/queries/lojaPublica';

export function HeroBanner({ loja }: { loja: LojaPublica }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <div className="h-48 w-full overflow-hidden rounded-[14px] sm:h-64">
        {loja.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={loja.banner_url} alt={loja.nome} className="h-full w-full object-cover" />
        ) : (
          <PlaceholderImage variante="banner" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-bold leading-tight tracking-tight text-[#141414]">
          {loja.nome}
        </h1>
        {loja.descricao && <p className="text-[13.5px] leading-relaxed text-[#78716C]">{loja.descricao}</p>}
      </div>
    </div>
  );
}
