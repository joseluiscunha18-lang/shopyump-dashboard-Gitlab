'use client';

import { useToast } from '@/components/ui/Toast';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { cn } from '@/lib/cn';

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-ink text-[12px] font-semibold tracking-tight border border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] self-start whitespace-nowrap';

/**
 * Card promocional do Marketplace — uma "descoberta opcional", nunca um
 * quinto passo obrigatório. É por isso que:
 * - Vive na sua PRÓPRIA secção ("Marketplace"), separada de "Próximos
 *   passos" — a hierarquia (heading diferente, secção diferente) é o
 *   que comunica "oportunidade" em vez de "tarefa pendente", não um
 *   estilo visual diferente.
 * - Não tem botão de dispensar (X) como os cards de onboarding: não é
 *   uma tarefa que se marca como feita ou se ignora, é uma porta que
 *   fica aberta até o vendedor decidir entrar.
 * - O CTA nunca diz "Ative agora" — "Conhecer" convida a explorar, não
 *   pressiona a agir.
 *
 * Mostrado por `page.tsx` sempre que já existe pelo menos 1 produto
 * publicado E o Marketplace ainda não está ativo. Assim que for
 * ativado, este card some e dá lugar ao `MarketplaceCard` funcional
 * (saldo em proteção/disputa) dentro do `HomeCardCarousel` — os dois
 * nunca aparecem ao mesmo tempo.
 */
export function MarketplacePromoCard() {
  const { show } = useToast();

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Marketplace</h2>

      <button
        type="button"
        onClick={() => show('O Marketplace Shopyump chega em breve.')}
        className="block w-full text-left transition-transform active:scale-[0.99]"
      >
        <div
          className={cn('relative mx-auto min-h-[192px] w-full max-w-[560px] overflow-hidden rounded-[28px] p-3.5 sm:p-4 @container', ELEVATED_SURFACE)}
          style={{ overflow: 'hidden', borderRadius: 28, minHeight: 192 }}
        >
          <div className="relative z-10 flex h-full min-h-[130px] w-[58%] flex-col items-start" style={{ minHeight: 130 }}>
            <p className="text-[clamp(13px,4.6cqw,17px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink whitespace-nowrap">
              Venda para mais clientes
            </p>
            <p className="mt-1.5 max-w-[210px] text-[clamp(11.5px,3.5cqw,13.5px)] font-medium leading-[1.4] text-slate-500">
              Leve seus produtos para o Marketplace da Shopyump.
            </p>
            <span className={cn(cta, 'mt-auto')}>Conhecer</span>
          </div>

          {/* Ilustração decorativa embutida (SVG, sem depender de upload
          — trocar por uma foto real quando houver uma, mesmo padrão dos
          outros cards guia). */}
          <div
            className="absolute right-3 top-2 bottom-2 flex w-[38%] max-w-[152px] items-center justify-center overflow-hidden rounded-[22px]"
            style={{ overflow: 'hidden', borderRadius: 22 }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full" style={{ width: '100%', height: '100%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="28" y="72" width="144" height="98" rx="16" fill="#EEF2FF" />
              <path d="M54 72 L70 32 H130 L146 72" stroke="#6366F1" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="78" cy="112" r="11" fill="#6366F1" />
              <circle cx="122" cy="112" r="11" fill="#818CF8" />
              <rect x="58" y="136" width="84" height="9" rx="4.5" fill="#C7D2FE" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}
