import { ORDEM_MARCOS_ONBOARDING, type LojaMarco, type MarcoOnboarding } from '@/types/database';

/**
 * Lógica ÚNICA das orientações de primeiro acesso do Início.
 *
 * Três conceitos, sempre separados (todos persistidos em `loja_marcos`, por loja):
 *  - concluída: `concluido_em` preenchido — a tarefa foi mesmo feita (triggers da base de dados ou ação do utilizador);
 *  - dispensada: `dispensado = true` — o utilizador fechou o cartão (×). NÃO é conclusão;
 *  - pendente: sem linha, ou linha sem nenhum dos dois.
 * Uma orientação concluída prevalece sobre uma dispensada (o utilizador pode dispensar e fazer depois).
 *
 * As quatro são independentes: não há ordem obrigatória nem pré-requisitos.
 */

export type EstadoOrientacao = 'concluida' | 'dispensada' | 'pendente';

/** A: primeiro acesso (nada concluído) · B: já concluiu alguma · C: já não há cartões a mostrar. */
export type FaseOnboarding = 'primeiro_acesso' | 'em_progresso' | 'concluido';

export type MarcosPorNome = Partial<Record<MarcoOnboarding, Pick<LojaMarco, 'concluido_em' | 'dispensado'>>>;

export interface CabecalhoOnboarding {
  /** Texto pequeno e discreto por cima do título (só no primeiro acesso). */
  sobretitulo: string | null;
  titulo: string;
}

export interface EstadoOnboarding {
  fase: FaseOnboarding;
  /** Cartões a mostrar, pela ordem fixa de ORDEM_MARCOS_ONBOARDING. */
  cartoes: MarcoOnboarding[];
  estados: Record<MarcoOnboarding, EstadoOrientacao>;
  cabecalho: CabecalhoOnboarding;
}

export const CABECALHOS: Record<FaseOnboarding, CabecalhoOnboarding> = {
  primeiro_acesso: { sobretitulo: 'Bem-vindo à Shopyump!', titulo: 'Por onde queres começar?' },
  em_progresso: { sobretitulo: null, titulo: 'Continua a preparar a tua loja' },
  concluido: { sobretitulo: null, titulo: 'Acompanha o teu negócio' },
};

export function estadoOrientacao(m: MarcosPorNome[MarcoOnboarding]): EstadoOrientacao {
  if (m?.concluido_em) return 'concluida';
  if (m?.dispensado) return 'dispensada';
  return 'pendente';
}

export function calcularOnboarding(marcos: MarcosPorNome): EstadoOnboarding {
  const estados = Object.fromEntries(
    ORDEM_MARCOS_ONBOARDING.map((m) => [m, estadoOrientacao(marcos[m])]),
  ) as Record<MarcoOnboarding, EstadoOrientacao>;

  const cartoes = ORDEM_MARCOS_ONBOARDING.filter((m) => estados[m] === 'pendente');
  const algumaConcluida = ORDEM_MARCOS_ONBOARDING.some((m) => estados[m] === 'concluida');

  const fase: FaseOnboarding = cartoes.length === 0 ? 'concluido' : algumaConcluida ? 'em_progresso' : 'primeiro_acesso';
  return { fase, cartoes, estados, cabecalho: CABECALHOS[fase] };
}
