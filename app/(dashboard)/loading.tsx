/**
 * loading.tsx — (dashboard)
 *
 * Skeleton exibido pelo Next.js enquanto a `page.tsx` ainda está a
 * resolver os dados (Supabase + cookies). Previne o layout shift e o
 * "briga de cards" visível no primeiro carregamento/refresh.
 *
 * Reproduz fielmente a estrutura da Home real:
 *   1. Saudação (nome + subtítulo)
 *   2. Card Carteira (financeiro principal)
 *   3. Resumo da loja (Pedidos / Visitas)
 *   4. Secção "Próximos passos" com um card
 */

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 ${className ?? ''}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* ── Saudação ── */}
      <div className="flex flex-col gap-2 px-1">
        <Bone className="h-8 w-40 rounded-xl" />
        <Bone className="h-4 w-56" />
      </div>

      {/* ── Card Carteira ── */}
      <div className="h-[188px] w-full animate-pulse rounded-[20px] bg-[#0f1629]/30" />

      {/* ── Resumo da loja ── */}
      <div className="flex flex-col gap-3">
        <Bone className="h-3.5 w-36" />
        <div className="flex gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <Bone className="h-8 w-8 rounded-xl" />
            <div className="flex flex-col gap-1.5">
              <Bone className="h-5 w-6" />
              <Bone className="h-3 w-12" />
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <Bone className="h-8 w-8 rounded-xl" />
            <div className="flex flex-col gap-1.5">
              <Bone className="h-5 w-6" />
              <Bone className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Próximos passos ── */}
      <div className="flex flex-col gap-3">
        <Bone className="h-3.5 w-28" />
        <div className="overflow-hidden rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2 flex-1">
              <Bone className="h-3 w-24" />
              <Bone className="h-5 w-48" />
              <Bone className="h-4 w-full max-w-[220px]" />
              <Bone className="h-4 w-3/4 max-w-[160px]" />
              <Bone className="mt-2 h-9 w-28 rounded-full" />
            </div>
            <Bone className="h-[100px] w-[100px] shrink-0 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
