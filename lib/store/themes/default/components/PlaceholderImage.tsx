/**
 * Estado vazio para banner/foto de produto — não é um erro nem um
 * espaço em branco, é um convite. Traço fino, tom neutro, sem imitar
 * uma fotografia — precisamente para não parecer "imagem partida",
 * mas sim "aqui é onde a tua foto vai ficar".
 */
export function PlaceholderImage({ variante }: { variante: 'banner' | 'produto' }) {
  const isBanner = variante === 'banner';
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-[#D9D5CF] bg-[#F5F3EF]"
      aria-hidden
    >
      <svg
        width={isBanner ? 40 : 28}
        height={isBanner ? 40 : 28}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#B5AFA5"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.1 0L5 19" />
      </svg>
      {isBanner && <span className="text-[11px] font-bold tracking-wide text-[#B5AFA5]">Adiciona um banner</span>}
    </div>
  );
}
