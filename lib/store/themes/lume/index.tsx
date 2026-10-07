import type { StoreThemeProps } from '../types';
import { LumeThemeClient } from './LumeTheme';
import { buildLumePersonalizacao } from './lib/personalizacao';

/**
 * Entrada do tema 'lume' para o registo de temas (lib/store/themes/registry.tsx).
 *
 * É um componente de SERVIDOR de propósito: converte a customização guardada
 * pelo lojista (`loja.tema_personalizacao`) num objeto simples e leve aqui, no
 * servidor, para o manifesto e o código do editor nunca irem para o navegador
 * do cliente da loja. Customização ausente ou inválida → `null` → o Lume
 * original, sem nenhuma alteração (a loja nunca parte por causa disto).
 */
export function LumeTheme({ loja, produtos }: StoreThemeProps) {
  const personalizacao = buildLumePersonalizacao(loja.tema_personalizacao);
  return <LumeThemeClient loja={loja} produtos={produtos} personalizacao={personalizacao} />;
}
