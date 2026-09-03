import { cookies } from 'next/headers';
import { HOME_MOCK_SCENARIOS, HOME_MOCK_SCENARIO_IDS, DEFAULT_MOCK_SCENARIO } from './homeScenarios';
import type { MockHomeScenario, MockScenarioId } from './types';

export const MOCK_SCENARIO_COOKIE = 'shopyump_mock_cenario';

function isValidScenarioId(value: string | undefined): value is MockScenarioId {
  return !!value && (HOME_MOCK_SCENARIO_IDS as string[]).includes(value);
}

/**
 * Único ponto de acesso ao "estado do plano/pagamento/Marketplace" da
 * loja. Hoje lê de um cookie (definido em /dev/cenarios, ver página de
 * pré-visualização) porque nenhuma dessas funcionalidades existe ainda
 * de verdade. QUANDO existirem (gateway, Marketplace, planos reais),
 * troca-se só esta função por uma leitura real do Supabase — nenhum
 * componente que consome `MockHomeScenario` precisa de mudar, porque o
 * tipo de retorno é o mesmo.
 */
export async function getActiveScenario(): Promise<MockHomeScenario> {
  const cookieStore = await cookies();
  const value = cookieStore.get(MOCK_SCENARIO_COOKIE)?.value;
  const id = isValidScenarioId(value) ? value : DEFAULT_MOCK_SCENARIO;
  return HOME_MOCK_SCENARIOS[id];
}
