'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { HOME_MOCK_SCENARIO_IDS } from './homeScenarios';
import { MOCK_SCENARIO_COOKIE } from './getActiveScenario';
import type { MockScenarioId } from './types';

/**
 * Grava o cenário escolhido no cookie e volta para a página de
 * pré-visualização. Só existe para o /dev/cenarios funcionar sem
 * JavaScript no cliente (formulário HTML simples) — não é chamada por
 * nenhuma parte "real" da aplicação.
 */
export async function setScenarioAction(formData: FormData) {
  const id = formData.get('cenario');
  if (typeof id !== 'string' || !(HOME_MOCK_SCENARIO_IDS as string[]).includes(id)) {
    redirect('/dev/cenarios');
  }

  const cookieStore = await cookies();
  cookieStore.set(MOCK_SCENARIO_COOKIE, id as MockScenarioId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias — só um confortável "lembra-te da escolha", sem significado especial
  });

  redirect('/dev/cenarios');
}
