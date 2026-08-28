import Image from 'next/image';
import { AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Surfaces';

/**
 * Miniatura 56x56 usada em ProductRow e PendingProductRow. Um único lugar
 * para o tamanho, o cantos arredondados e a moldura (inset shadow) — antes
 * cada ficheiro tinha a sua própria cópia deste bloco, com risco de as
 * duas se desalinharem ao longo do tempo.
 *
 * `state` cobre os 4 casos que já existiam espalhados pelos dois
 * ficheiros: a carregar (skeleton), com foto, sem foto (placeholder) e em
 * erro de publicação (só acontece na linha pendente).
 */
export function ProductThumbnail({
  state,
  src,
  alt,
}: {
  state: 'skeleton' | 'image' | 'placeholder' | 'error';
  src?: string;
  alt: string;
}) {
  return (
    <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
      {state === 'skeleton' && <Skeleton className="h-full w-full rounded-md" />}

      {state === 'error' && (
        <div className="flex h-full w-full items-center justify-center">
          <AlertTriangle size={22} strokeWidth={1.5} className="text-red-400" />
        </div>
      )}

      {state === 'image' && src && (
        <Image src={src} alt={alt} fill className="object-cover" sizes="56px" unoptimized loading="eager" />
      )}

      {state === 'placeholder' && (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon size={26} strokeWidth={1.5} style={{ color: 'rgba(26,18,16,0.22)' }} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
    </div>
  );
}
