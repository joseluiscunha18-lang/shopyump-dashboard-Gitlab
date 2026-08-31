import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import type { Pedido } from '@/types/database';
import { cn } from '@/lib/cn';

/**
 * Aparece no TOPO da Início — acima de tudo, incluindo os cards de
 * onboarding — sempre que houver pelo menos 1 pedido por confirmar.
 * Diferente do "Resumo da loja" (que é uma métrica passiva), isto é uma
 * TAREFA pendente: por isso quebra a hierarquia normal em vez de ficar
 * arrumado dentro do resumo (ver conversa de UX — "pedido recebido" pode
 * exigir resposta, "visitas" pode esperar).
 *
 * Só é renderizado quando `pedidosPendentes > 0` — nunca aparece a dizer
 * "Sem pedidos novos" ou parecido; a ausência do bloco já é o sinal de
 * que não há nada pendente.
 */
export function NewOrderAlert({ pedidoRecente, pedidosPendentes }: { pedidoRecente: Pedido; pedidosPendentes: number }) {
  const numero = pedidoRecente.id.slice(0, 4).toUpperCase();

  return (
    <div className={cn('relative overflow-hidden rounded-[24px] p-4 sm:p-5', ELEVATED_SURFACE)}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Bell size={16} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            {pedidosPendentes > 1 ? `${pedidosPendentes} pedidos por confirmar` : 'Novo pedido recebido'}
          </p>
          <p className="mt-0.5 truncate text-[14px] font-bold text-ink">
            Pedido #{numero} · {pedidoRecente.cliente_nome}
          </p>
          <p className="text-[12px] font-medium text-slate-400">Aguardando confirmação</p>
        </div>
      </div>

      <Link
        href="/pedidos"
        className="group mt-3.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[12px] font-semibold text-white transition-all active:scale-[0.97]"
      >
        Ver pedidos
        <ArrowRight size={12} strokeWidth={2.25} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
