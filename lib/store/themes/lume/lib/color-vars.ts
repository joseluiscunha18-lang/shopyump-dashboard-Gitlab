/**
 * Mapa "cor do editor → variáveis CSS do tema Lume".
 *
 * Fonte única para as DUAS maneiras de aplicar a paleta do lojista:
 *  - loja pública: `buildLumePersonalizacao` (personalizacao.ts) emite só o que
 *    difere do tema por omissão, no wrapper `.theme-lume`;
 *  - editor: `lumeColorVars` emite TODAS as variáveis, para os componentes
 *    partilhados da loja (que usam classes semânticas do Tailwind:
 *    bg-card, text-muted-foreground, border-border…) terem as cores do lojista
 *    dentro de `.ed-root`, onde essas variáveis têm os valores do editor.
 *
 * Sem React e sem dependências — pode ser importado do servidor e do cliente.
 */
export const LUME_COLOR_VARS: Record<string, string[]> = {
  background: ["--background", "--popover", "--footer"],
  text: ["--foreground", "--card-foreground", "--popover-foreground", "--secondary-foreground", "--accent-foreground", "--footer-foreground", "--hero-foreground"],
  secondary: ["--muted-foreground", "--footer-muted", "--hero-muted", "--ring"],
  buttonBg: ["--primary"],
  buttonText: ["--primary-foreground"],
  border: ["--border", "--input", "--product-line", "--footer-border"],
  cardBg: ["--card", "--subtle", "--surface-strong"],
  surfaceAlt: ["--muted", "--accent", "--footer-hover"],
};

/** Todas as variáveis CSS para uma paleta já resolvida (hex). */
export function lumeColorVars(colors: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, names] of Object.entries(LUME_COLOR_VARS)) {
    const value = colors[key];
    if (value) for (const name of names) out[name] = value;
  }
  return out;
}
