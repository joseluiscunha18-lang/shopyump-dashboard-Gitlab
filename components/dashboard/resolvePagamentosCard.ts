// components/dashboard/resolvePagamentosCard.ts
// SEM 'use client' — importado pela page.tsx no servidor.

interface PagamentosBreakdownItem {
  label: string;
  value: number;
}

interface PagamentosBreakdownSource {
  salesToday?: number;
  salesYesterday?: number;
  salesThisMonth?: number;
}

export function buildPagamentosBreakdown(source: PagamentosBreakdownSource): PagamentosBreakdownItem[] {
  const itens: PagamentosBreakdownItem[] = [];
  if (source.salesToday !== undefined) itens.push({ label: 'Hoje', value: source.salesToday });
  if (source.salesYesterday !== undefined) itens.push({ label: 'Ontem', value: source.salesYesterday });
  if (source.salesThisMonth !== undefined) itens.push({ label: 'Este mês', value: source.salesThisMonth });
  return itens;
}

interface StorePaymentSource {
  provider: 'none' | 'shopyump' | 'external';
  connected: boolean;
  availableAmount: number;
  salesToday?: number;
  salesYesterday?: number;
  salesThisMonth?: number;
}

interface MarketplaceSource {
  status: string;
  availableAmount: number;
  salesAmount: number;
  salesToday?: number;
  salesYesterday?: number;
}

export interface ResolvedPagamentosCard {
  amount: number;
  amountLabel: string;
  breakdown: PagamentosBreakdownItem[];
  hint?: string;
}

function somarDefinidos(...valores: Array<number | undefined>): number | undefined {
  const definidos = valores.filter((v): v is number => v !== undefined);
  if (definidos.length === 0) return undefined;
  return definidos.reduce((total, v) => total + v, 0);
}

export function resolvePagamentosCard(
  storePayment: StorePaymentSource,
  marketplace: MarketplaceSource
): ResolvedPagamentosCard {
  const gatewayShopyumpAtivo = storePayment.provider === 'shopyump' && storePayment.connected;
  const gatewayExternoAtivo = storePayment.provider === 'external' && storePayment.connected;
  const marketplaceAtivo = marketplace.status === 'active';
  const temSaldoShopyump = gatewayShopyumpAtivo || marketplaceAtivo;

  const breakdown = buildPagamentosBreakdown({
    salesToday: somarDefinidos(
      gatewayShopyumpAtivo || gatewayExternoAtivo ? storePayment.salesToday : undefined,
      marketplaceAtivo ? marketplace.salesToday : undefined
    ),
    salesYesterday: somarDefinidos(
      gatewayShopyumpAtivo || gatewayExternoAtivo ? storePayment.salesYesterday : undefined,
      marketplaceAtivo ? marketplace.salesYesterday : undefined
    ),
    salesThisMonth: somarDefinidos(
      gatewayShopyumpAtivo || gatewayExternoAtivo ? storePayment.salesThisMonth : undefined,
      marketplaceAtivo ? marketplace.salesAmount : undefined
    ),
  });

  if (temSaldoShopyump) {
    const saldoGateway = gatewayShopyumpAtivo ? storePayment.availableAmount : 0;
    const saldoMarketplace = marketplaceAtivo ? marketplace.availableAmount : 0;
    return { amount: saldoGateway + saldoMarketplace, amountLabel: 'Disponível para saque', breakdown };
  }

  if (gatewayExternoAtivo) {
    return { amount: storePayment.salesThisMonth ?? 0, amountLabel: 'Vendas este mês', breakdown };
  }

  return {
    amount: 0,
    amountLabel: 'Disponível para saque',
    breakdown: buildPagamentosBreakdown({ salesToday: 0, salesYesterday: 0, salesThisMonth: 0 }),
    hint: 'Configure pagamentos para começar a receber',
  };
}
