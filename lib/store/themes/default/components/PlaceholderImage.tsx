/**
 * Estado vazio para banner/foto de produto — paleta e raio herdados do
 * LUME (product-gallery bg + traço fino), para ficar visualmente
 * coerente com o resto do tema em vez de destoar.
 */
export function PlaceholderImage({ variante }: { variante: 'banner' | 'produto' }) {
  const isBanner = variante === 'banner';
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-[oklch(0.88224_0_0)] bg-[oklch(0.965_0_0)]"
      aria-hidden
    >
      <svg
        width={isBanner ? 40 : 28}
        height={isBanner ? 40 : 28}
        viewBox="0 0 24 24"
        fill="none"
        stroke="oklch(0.52081 0 0)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.1 0L5 19" />
      </svg>
      {isBanner && (
        <span className="text-[11px] font-bold tracking-wide text-[oklch(0.52081_0_0)]">Adiciona um banner</span>
      )}
    </div>
  );
}
