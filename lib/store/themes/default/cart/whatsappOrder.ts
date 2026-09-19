import type { CartItem } from './CartContext';

export function formatMzn(valor: number): string {
  return `${valor.toLocaleString('pt-MZ')} MZN`;
}

export interface DadosCliente {
  nome: string;
  telefone: string;
  morada: string;
}

/**
 * Monta o texto do pedido para o WhatsApp — itens, total e dados do
 * cliente. Isolado da UI de propósito: se um dia precisarmos de mudar
 * o formato da mensagem (ou gerar isto de outra forma), é só aqui.
 */
export function montarMensagemPedido(loja: { nome: string }, items: CartItem[], cliente: DadosCliente): string {
  const linhas = items.map((i) => `• ${i.quantidade}x ${i.nome} — ${formatMzn(i.preco * i.quantidade)}`);
  const total = items.reduce((soma, i) => soma + i.preco * i.quantidade, 0);

  return [
    `Olá! Gostaria de fazer um pedido na *${loja.nome}*:`,
    '',
    ...linhas,
    '',
    `*Total: ${formatMzn(total)}*`,
    '',
    'Meus dados:',
    `Nome: ${cliente.nome}`,
    `Telefone: ${cliente.telefone}`,
    `Morada: ${cliente.morada}`,
  ].join('\n');
}

export function whatsappHref(numero: string | null | undefined, mensagem: string): string | null {
  if (!numero) return null;
  const digits = numero.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`;
}
