import type { CabecalhoOnboarding } from '@/lib/onboarding/orientacoes';

/**
 * Cabeçalho do Início. Os textos vêm de `calcularOnboarding` (lib/onboarding/orientacoes.ts):
 * sem "Olá, nome", sem identificador "INÍCIO" e sem subtítulos.
 * Só o primeiro acesso leva o pequeno texto de boas-vindas por cima do título.
 */
export function DashboardHeader({ cabecalho }: { cabecalho: CabecalhoOnboarding }) {
  return (
    <header className="dashboard-greeting px-1">
      {cabecalho.sobretitulo && (
        <p className="text-[14px] font-medium text-muted-foreground">{cabecalho.sobretitulo}</p>
      )}
      <h1
        className={
          'text-[28px] font-black leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[32px]' +
          (cabecalho.sobretitulo ? ' mt-1' : '')
        }
      >
        {cabecalho.titulo}
      </h1>
    </header>
  );
}
