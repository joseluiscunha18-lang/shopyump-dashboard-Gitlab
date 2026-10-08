/**
 * Cores da barra inferior do Lume — fonte única para a loja pública
 * (`buildLumePersonalizacao` emite estas declarações em `[data-sy=bottom-nav]`)
 * e para o editor (aplica-as inline no mesmo componente). Sem React.
 *
 * Só redefine as variáveis `--nav-*` (ver app/theme-lume.css); tudo o resto da
 * barra (forma, animação, ícones) continua a vir do tema. "dark" é o desenho
 * original e não emite nada — uma loja sem personalização fica idêntica.
 * Os valores referem variáveis da paleta do lojista (`--card`, `--primary`…),
 * por isso acompanham as cores que ele escolheu.
 */
export type BottomNavTone = "dark" | "light" | "brand";

export const BOTTOM_NAV_TONES: readonly BottomNavTone[] = ["dark", "light", "brand"];

export function isBottomNavTone(v: unknown): v is BottomNavTone {
  return typeof v === "string" && (BOTTOM_NAV_TONES as readonly string[]).includes(v);
}

const SHADOW_SOFT = "0 12px 28px oklch(0.2 0 0 / 14%), 0 3px 8px oklch(0.2 0 0 / 8%)";
const SHADOW_DEEP = "0 18px 30px oklch(0.12 0.004 85 / 30%), 0 5px 10px oklch(0.12 0.004 85 / 22%)";

export function bottomNavVars(tone: BottomNavTone): Record<string, string> {
  switch (tone) {
    case "light":
      return {
        "--nav": "var(--card)",
        "--nav-shell": "var(--card)",
        "--nav-shell-edge": "var(--border)",
        "--nav-foreground": "var(--muted-foreground)",
        "--nav-active": "var(--primary)",
        "--nav-active-foreground": "var(--primary-foreground)",
        "--nav-hover": "color-mix(in oklab, var(--foreground) 8%, transparent)",
        "--nav-indicator": "var(--destructive)",
        "--nav-badge-foreground": "#fff",
        "--nav-shadow": SHADOW_SOFT,
      };
    case "brand":
      return {
        "--nav": "var(--primary)",
        "--nav-shell": "var(--primary)",
        "--nav-shell-edge": "color-mix(in oklab, var(--primary-foreground) 22%, transparent)",
        "--nav-foreground": "color-mix(in oklab, var(--primary-foreground) 78%, transparent)",
        "--nav-active": "var(--primary-foreground)",
        "--nav-active-foreground": "var(--primary)",
        "--nav-hover": "color-mix(in oklab, var(--primary-foreground) 14%, transparent)",
        "--nav-indicator": "var(--destructive)",
        "--nav-badge-foreground": "#fff",
        "--nav-shadow": SHADOW_DEEP,
      };
    default:
      return {};
  }
}
