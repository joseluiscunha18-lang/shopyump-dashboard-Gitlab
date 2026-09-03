/**
 * Estado conceitual da Home, tal como descrito em
 * SHOPYUMP_LOGICA_HOME_PLANOS_MARKETPLACE_GATEWAY.md §20-21.
 *
 * Nomeado propositadamente em inglês (o documento permite adaptar, mas
 * mantemos os nomes daqui exatamente como na spec) porque isto descreve
 * um domínio ainda NÃO real — plano, gateway, Marketplace — que ainda
 * não existe na base de dados. O resto do projeto (produtos, pedidos,
 * loja_marcos) continua em português, porque isso já é real.
 *
 * Esta camada não fala com o Supabase. É simulação pura de frontend, tal
 * como o §19 pede: "Implementar e simular o frontend da Shopyump antes
 * das APIs reais." Quando os gateways/Marketplace reais existirem, troca-se
 * SÓ o resolvedor (getActiveScenario.ts) por uma leitura real da base de
 * dados — nenhum componente que consome este tipo precisa de mudar.
 */

export type Plan = 'free' | 'paid';

/** Quem controla o dinheiro de facto — ver §7 e §21: nunca tratar
 *  'external' como saldo Shopyump. */
export type StorePaymentProvider = 'none' | 'shopyump' | 'external';

export type MarketplaceStatus = 'inactive' | 'onboarding' | 'pending' | 'active' | 'suspended';

/** Linguagem simples pedida no §7 para os estados de pagamento do Marketplace. */
export type MarketplacePayoutStatus = 'none' | 'pending' | 'requested' | 'paid';

export interface MockUserState {
  plan: Plan;
  firstProductPublished: boolean;
}

export interface MockOnboardingState {
  personalizeCompleted: boolean;
  shareCompleted: boolean;
}

/** Indicadores operacionais/comerciais — SEMPRE seguros de mostrar,
 *  independentemente de haver ou não fluxo financeiro ativo (§5, §9). */
export interface MockStoreState {
  productsCount: number;
  visits: number;
  ordersCount: number;
  /** "Vendas" — valor de pedidos registados. Nunca confundir com saldo (§6). */
  salesAmount: number;
  /** Variação percentual de `salesAmount` vs. o mês anterior — só faz
   *  sentido mostrar quando `salesAmount > 0` (ver VisaoGeral.tsx); nos
   *  cenários sem vendas fica a 0 e é simplesmente ignorado pela UI. */
  growthPercent: number;
}

/** Pagamentos da LOJA PRÓPRIA (gateway Shopyump ou externo). Distinto de
 *  `MockMarketplaceState` — são dois fluxos de dinheiro diferentes (§13). */
export interface MockStorePaymentState {
  provider: StorePaymentProvider;
  connected: boolean;
  /** Só tem significado quando provider = 'shopyump' — ver §7/§8. */
  availableAmount: number;
  processingAmount: number;
  /** Usado quando provider = 'external': confirmações via webhook/API,
   *  nunca chamadas de "saldo Shopyump" (§7, §11). */
  confirmedPayments: number;
}

export interface MockMarketplaceState {
  status: MarketplaceStatus;
  productsCount: number;
  ordersCount: number;
  salesAmount: number;
  /** "Em proteção" na UI — dinheiro vendido mas ainda não liberado (§7). */
  protectedAmount: number;
  availableAmount: number;
  payoutStatus: MarketplacePayoutStatus;
}

export type MockScenarioId =
  | 'FREE_NEW'
  | 'FREE_FIRST_PRODUCT'
  | 'FREE_ACTIVE'
  | 'FREE_MARKETPLACE_ACTIVE'
  | 'PAID_NO_GATEWAY'
  | 'PAID_EXTERNAL_GATEWAY'
  | 'PAID_SHOPYUMP_GATEWAY'
  | 'PAID_MARKETPLACE'
  | 'PAID_SHOPYUMP_GATEWAY_AND_MARKETPLACE'
  | 'PAID_EXTERNAL_GATEWAY_AND_MARKETPLACE';

export interface MockHomeScenario {
  id: MockScenarioId;
  /** Descrição curta em português, só para o seletor de cenários (§19) — nunca mostrada ao usuário final. */
  label: string;
  user: MockUserState;
  onboarding: MockOnboardingState;
  store: MockStoreState;
  storePayment: MockStorePaymentState;
  marketplace: MockMarketplaceState;
}
