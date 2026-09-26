/**
 * Textos institucionais genéricos, usados como valor inicial de QUALQUER
 * loja nova (ver `completeOnboarding` em lib/mutations/loja.ts) e para
 * repor esses mesmos campos quando o lojista usa "Remover dados de
 * exemplo" (ver lib/mutations/limparDadosExemplo.ts).
 *
 * Ao contrário dos produtos de demonstração (que são só visuais, nunca
 * tocam a base de dados e desaparecem sozinhos com o 1º produto real),
 * ESTE texto é gravado como conteúdo REAL da loja desde o dia 1 —
 * funcional, genérico o suficiente para servir qualquer tipo de
 * negócio, e o lojista pode editá-lo a qualquer momento em
 * "Personalizar loja". Fica ativo para sempre, independentemente de
 * quantos produtos a loja tiver — é o que mantém o rodapé da loja
 * pública com um aspeto completo desde o primeiro dia.
 */
export const SOBRE_PADRAO =
  'Somos uma loja dedicada a oferecer produtos de qualidade com um atendimento próximo. ' +
  'Este texto é um ponto de partida — edita-o em "Personalizar loja" para contares a tua própria história.';

export const ENTREGA_PADRAO =
  'Fazemos entregas na tua zona após confirmação do pedido pelo WhatsApp. ' +
  'O prazo e o custo são combinados diretamente contigo antes da confirmação final. ' +
  'Também é possível combinar levantamento no local, mediante acordo com a loja.';

export const TERMOS_PADRAO =
  'Os pedidos são confirmados através do WhatsApp, onde combinamos contigo os detalhes de pagamento e entrega. ' +
  'Trocas e devoluções podem ser solicitadas em até 7 dias após a receção, desde que o produto esteja nas condições originais. ' +
  'Os teus dados (nome, contacto e morada) são usados apenas para processar o teu pedido.';
