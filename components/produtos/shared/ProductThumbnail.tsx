import Image from 'next/image';
import { AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Surfaces';

/**
 * Miniatura 56x56 usada em ProductRow e PendingProductRow.
 *
 * blob: URLs (produtos pendentes) não são suportados pelo next/image —
 * usamos <img> nativo nesses casos para evitar reflow e erros de
 * optimização. URLs normais (https://...) continuam a usar next/image.
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
  const isBlob = src?.startsWith('blob:');

  return (
    <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
      {state === 'skeleton' && <Skeleton className="h-full w-full rounded-md" />}

      {state === 'error' && (
        <div className="flex h-full w-full items-center justify-center">
          <AlertTriangle size={22} strokeWidth={1.5} className="text-red-400" />
        </div>
      )}

      {state === 'image' && src && (
        isBlob ? (
          /* blob: URL — img nativo evita reflow do next/image */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image src={src} alt={alt} fill className="object-cover" sizes="56px" unoptimized loading="eager" />
        )
      )}

      {state === 'placeholder' && (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon size={26} strokeWidth={1.5} style={{ color: 'rgba(26,18,16,0.22)' }} />
        </div>
      )}

      {/* Borda só faz sentido a definir o contorno de uma FOTO real — sobre
      o shimmer do esqueleto (ou o placeholder/erro) ela só desenhava um
      quadrado extra por cima de outro elemento que já tem a sua própria
      aparência, criando inconsistência entre estados. */}
      {state === 'image' && (
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
      )}
    </div>
  );
}
