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
 *  independentemente de haver ou não fluxo financeiro ativo (§5, §9).
 *  NÃO tem mais `salesAmount`/`growthPercent`: "Vendas" deixou de viver
 *  aqui — agora é inteiramente responsabilidade do card "Pagamentos"
 *  (ver PagamentosCard.tsx / resolvePagamentosCard), que só existe
 *  quando há um canal financeiro (gateway ou Marketplace) confirmado.
 *  Mostrar o mesmo número em dois lugares diferentes era exatamente a
 *  duplicação que a nova lógica veio resolver. */
export interface MockStoreState {
  productsCount: number;
  visits: number;
  ordersCount: number;
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
  /**
   * Quebra "Hoje / Ontem / Este mês" mostrada no card Pagamentos —
   * representa volume de vendas confirmado pelo gateway, por isso é o
   * mesmo tipo de dado independentemente de `provider` ser 'external'
   * ou 'shopyump' (só o número principal do card muda de sentido; ver
   * PagamentosCard.tsx). Cada campo é opcional de propósito: quando um
   * período ainda não tem dado real (ex.: gateway ligado hoje, "ontem"
   * não existe), omite-se o campo em vez de inventar 0 — o card já
   * sabe desenhar 1, 2 ou 3 blocos sem quebrar o layout.
   */
  salesToday?: number;
  salesYesterday?: number;
  salesThisMonth?: number;
}

export interface MockMarketplaceState {
  status: MarketplaceStatus;
  productsCount: number;
  ordersCount: number;
  /** Total de vendas do Marketplace — funciona como o "Este mês" desse
   *  canal no card Pagamentos (ver resolvePagamentosCard). */
  salesAmount: number;
  /** "Em proteção" na UI — dinheiro vendido mas ainda não liberado (§7). */
  protectedAmount: number;
  /** Só ESTA parte entra no "Disponível para saque" combinado do card
   *  Pagamentos — protectedAmount nunca entra (ver §"CASO IMPORTANTE"). */
  availableAmount: number;
  /** "Em disputa" na UI — parte de `protectedAmount` que o comprador
   *  contestou (reclamação/chargeback em aberto), por isso ainda mais
   *  travada do que a proteção normal. Mostrado no MarketplaceCard ao
   *  lado de "Em proteção", nunca somado a `availableAmount`. */
  disputedAmount: number;
  payoutStatus: MarketplacePayoutStatus;
  /** Quebra diária opcional — mesma regra do storePayment: omitir
   *  quando não houver dado real, nunca inventar 0. */
  salesToday?: number;
  salesYesterday?: number;
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
