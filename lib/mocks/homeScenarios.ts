import type { MockHomeScenario, MockScenarioId } from './types';

const SEM_PAGAMENTO_LOJA = {
  provider: 'none' as const,
  connected: false,
  availableAmount: 0,
  processingAmount: 0,
  confirmedPayments: 0,
};

const MARKETPLACE_INATIVO = {
  status: 'inactive' as const,
  productsCount: 0,
  ordersCount: 0,
  salesAmount: 0,
  protectedAmount: 0,
  availableAmount: 0,
  payoutStatus: 'none' as const,
};

/**
 * Os 9 cenários pedidos no §19. Os valores dos cenários 7, 9 e 13 (gateway
 * Shopyump / Marketplace consolidado) são copiados literalmente dos
 * exemplos do documento (SHOPYUMP_LOGICA_HOME_PLANOS_MARKETPLACE_GATEWAY.md
 * §12, §9, §13) — os restantes foram inventados com valores plausíveis,
 * mas seguindo sempre a mesma regra de ouro do §6: nunca inventar saldo
 * onde a spec diz que não deve existir.
 */
export const HOME_MOCK_SCENARIOS: Record<MockScenarioId, MockHomeScenario> = {
  // §9 do .txt / Estado A do .md — loja acabou de nascer, nada ainda.
  FREE_NEW: {
    id: 'FREE_NEW',
    label: 'Grátis · loja nova, sem produtos',
    user: { plan: 'free', firstProductPublished: false },
    onboarding: { personalizeCompleted: false, shareCompleted: false },
    store: { productsCount: 0, visits: 0, ordersCount: 0, salesAmount: 0 },
    storePayment: SEM_PAGAMENTO_LOJA,
    marketplace: MARKETPLACE_INATIVO,
  },

  // Estado B do .md — primeiro produto já publicado, resto do onboarding por fazer.
  FREE_FIRST_PRODUCT: {
    id: 'FREE_FIRST_PRODUCT',
    label: 'Grátis · primeiro produto publicado',
    user: { plan: 'free', firstProductPublished: true },
    onboarding: { personalizeCompleted: false, shareCompleted: false },
    store: { productsCount: 1, visits: 3, ordersCount: 0, salesAmount: 0 },
    storePayment: SEM_PAGAMENTO_LOJA,
    marketplace: MARKETPLACE_INATIVO,
  },

  // §5 do .txt — grátis sem gateway, loja já com alguma atividade real.
  FREE_ACTIVE: {
    id: 'FREE_ACTIVE',
    label: 'Grátis · loja ativa, sem gateway',
    user: { plan: 'free', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 12, visits: 248, ordersCount: 5, salesAmount: 0 },
    storePayment: SEM_PAGAMENTO_LOJA,
    marketplace: MARKETPLACE_INATIVO,
  },

  // §6/§10 do .txt — só Marketplace ativo, loja própria sem gateway.
  // Note-se `store.visits: 0` de propósito (§10: "os clientes estão a
  // chegar pelo Marketplace" — é honesto, não é um erro mostrar 0 aqui).
  FREE_MARKETPLACE_ACTIVE: {
    id: 'FREE_MARKETPLACE_ACTIVE',
    label: 'Grátis · Marketplace ativo',
    user: { plan: 'free', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 8, visits: 0, ordersCount: 6, salesAmount: 0 },
    storePayment: SEM_PAGAMENTO_LOJA,
    marketplace: {
      status: 'active',
      productsCount: 8,
      ordersCount: 6,
      salesAmount: 7500,
      protectedAmount: 2500,
      availableAmount: 5000,
      payoutStatus: 'none',
    },
  },

  // §11 do .md — pago, mas ainda não ligou nenhum gateway.
  PAID_NO_GATEWAY: {
    id: 'PAID_NO_GATEWAY',
    label: 'Pago · sem gateway ligado',
    user: { plan: 'paid', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 15, visits: 420, ordersCount: 9, salesAmount: 0 },
    storePayment: SEM_PAGAMENTO_LOJA,
    marketplace: MARKETPLACE_INATIVO,
  },

  // §8/§11 do .txt e .md — gateway externo: confirmações sim, saldo Shopyump não.
  PAID_EXTERNAL_GATEWAY: {
    id: 'PAID_EXTERNAL_GATEWAY',
    label: 'Pago · gateway externo conectado',
    user: { plan: 'paid', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 18, visits: 610, ordersCount: 14, salesAmount: 12500 },
    storePayment: {
      provider: 'external',
      connected: true,
      availableAmount: 0, // nunca preenchido para 'external' — ver §7/§11.
      processingAmount: 0,
      confirmedPayments: 12500,
    },
    marketplace: MARKETPLACE_INATIVO,
  },

  // §7/§12 do .md — gateway próprio Shopyump, valores copiados do exemplo do documento.
  PAID_SHOPYUMP_GATEWAY: {
    id: 'PAID_SHOPYUMP_GATEWAY',
    label: 'Pago · gateway Shopyump ativo',
    user: { plan: 'paid', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 20, visits: 850, ordersCount: 17, salesAmount: 12500 },
    storePayment: {
      provider: 'shopyump',
      connected: true,
      availableAmount: 8000,
      processingAmount: 4500,
      confirmedPayments: 0,
    },
    marketplace: MARKETPLACE_INATIVO,
  },

  // §6/§10 do .txt, com plano pago — Marketplace sozinho, mas em conta paga.
  PAID_MARKETPLACE: {
    id: 'PAID_MARKETPLACE',
    label: 'Pago · Marketplace ativo, sem gateway próprio',
    user: { plan: 'paid', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 22, visits: 90, ordersCount: 11, salesAmount: 0 },
    storePayment: SEM_PAGAMENTO_LOJA,
    marketplace: {
      status: 'active',
      productsCount: 20,
      ordersCount: 11,
      salesAmount: 9800,
      protectedAmount: 1200,
      availableAmount: 6400,
      payoutStatus: 'requested',
    },
  },

  // §9/§13 do .md — cenário mais completo, valores copiados do exemplo do documento.
  PAID_SHOPYUMP_GATEWAY_AND_MARKETPLACE: {
    id: 'PAID_SHOPYUMP_GATEWAY_AND_MARKETPLACE',
    label: 'Pago · gateway Shopyump + Marketplace',
    user: { plan: 'paid', firstProductPublished: true },
    onboarding: { personalizeCompleted: true, shareCompleted: true },
    store: { productsCount: 25, visits: 1240, ordersCount: 32, salesAmount: 24800 },
    storePayment: {
      provider: 'shopyump',
      connected: true,
      availableAmount: 14200,
      processingAmount: 10600,
      confirmedPayments: 0,
    },
    marketplace: {
      status: 'active',
      productsCount: 25,
      ordersCount: 32,
      salesAmount: 10000,
      protectedAmount: 0,
      availableAmount: 0, // já refletido no bloco Financeiro consolidado — ver §13, evitar dupla contagem.
      payoutStatus: 'paid',
    },
  },
};

export const HOME_MOCK_SCENARIO_IDS = Object.keys(HOME_MOCK_SCENARIOS) as MockScenarioId[];

export const DEFAULT_MOCK_SCENARIO: MockScenarioId = 'FREE_NEW';
