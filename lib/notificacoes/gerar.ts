import type { DashboardNotification } from '@/components/dashboard/DashboardState';

/**
 * Notificações geradas a partir de dados REAIS da loja (nada simulado):
 *  - boas-vindas: nasce com a loja (created_at);
 *  - stock: produtos publicados com controlo de stock a zero ou abaixo do limite;
 *  - pedidos: tratados em DashboardState (pedidos pendentes).
 * Os ids são estáveis (derivados da loja/produto/nível), por isso «lida» e «eliminada» persistem.
 */

/** A partir de quantas unidades se avisa de stock baixo (inclusive). */
export const LIMITE_STOCK_BAIXO = 5;
/** Máximo de avisos de stock mostrados ao mesmo tempo. */
export const MAX_AVISOS_STOCK = 20;

export interface AlertaStock {
  id: string;
  nome: string;
  qtd: number;
}

/** Hash estável (FNV-1a, 32 bits) para ids numéricos de notificações. */
export function hashId(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function quandoRel(iso: string, agora = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const m = Math.max(0, Math.round((agora - t) / 60000));
  if (m < 1) return 'agora mesmo';
  if (m < 60) return 'há ' + m + ' min';
  const h = Math.round(m / 60);
  if (h < 24) return 'há ' + h + ' h';
  return 'há ' + Math.round(h / 24) + ' dias';
}

export function notificacaoBoasVindas(
  loja: { id: string; nome: string | null; created_at: string },
  lidas: Set<number>,
  removidas: Set<number>,
  agora = Date.now(),
): DashboardNotification[] {
  const id = hashId('boas_vindas:' + loja.id);
  if (removidas.has(id)) return [];
  const nome = (loja.nome ?? '').trim();
  return [{
    id,
    tipo: 'boas_vindas',
    titulo: 'Bem-vindo à Shopyump!',
    texto: nome
      ? 'A tua loja «' + nome + '» está criada. Adiciona produtos e personaliza-a para começar a vender.'
      : 'A tua loja está criada. Adiciona produtos e personaliza-a para começar a vender.',
    quando: quandoRel(loja.created_at, agora),
    lida: lidas.has(id),
    link: '/produtos',
  }];
}

export function notificacoesStock(
  alertas: AlertaStock[],
  lidas: Set<number>,
  removidas: Set<number>,
): DashboardNotification[] {
  return alertas
    .filter((a) => a.qtd <= LIMITE_STOCK_BAIXO)
    .sort((a, b) => a.qtd - b.qtd)
    .slice(0, MAX_AVISOS_STOCK)
    .map((a) => {
      const esgotado = a.qtd <= 0;
      // O nível faz parte do id: passar de «baixo» a «esgotado» é um aviso novo (volta a ficar por ler).
      const id = hashId('stock:' + a.id + ':' + (esgotado ? 'zero' : 'baixo'));
      return {
        id,
        tipo: 'stock' as const,
        titulo: esgotado ? '«' + a.nome + '» está esgotado' : 'Stock baixo: «' + a.nome + '»',
        texto: esgotado
          ? 'Atualiza o stock para voltares a vender este produto.'
          : 'Restam ' + a.qtd + (a.qtd === 1 ? ' unidade.' : ' unidades.'),
        quando: '',
        lida: lidas.has(id),
        link: '/produtos' as const,
      };
    })
    .filter((n) => !removidas.has(n.id));
}
