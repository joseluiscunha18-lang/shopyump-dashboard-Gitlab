/**
 * loading.tsx — (dashboard)
 *
 * Skeleton minimalista. Não reproduz os cards de conteúdo — apenas
 * reserva o espaço visual para evitar layout shift. Quanto mais simples,
 * menos risco de confundir com conteúdo real durante o streaming.
 */

function Bone({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className ?? ''}`} />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* Saudação */}
      <div className="flex flex-col gap-2">
        <Bone className="h-8 w-44 rounded-xl" />
        <Bone className="h-4 w-60 rounded-lg" />
      </div>

      {/* Card Carteira — altura fixa, cor escura para combinar */}
      <Bone className="h-[188px] w-full rounded-[20px] bg-[#0f1629]/20" />

      {/* Resumo da loja */}
      <div className="grid grid-cols-2 gap-4">
        <Bone className="h-[72px] rounded-2xl" />
        <Bone className="h-[72px] rounded-2xl" />
      </div>

      {/* Secção de passos */}
      <div className="flex flex-col gap-3">
        <Bone className="h-3.5 w-32 rounded-lg" />
        <Bone className="h-[140px] w-full rounded-[20px]" />
      </div>
    </div>
  );
}
