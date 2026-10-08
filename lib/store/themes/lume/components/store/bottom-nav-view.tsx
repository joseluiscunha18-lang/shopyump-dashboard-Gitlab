'use client';

import { Fragment, type CSSProperties, type ReactNode, type Ref } from "react";

/** O que o item entrega ao seu "contentor": a loja liga-o ao router/carrinho, o editor desenha um <span>. */
export interface BottomNavItemProps {
  className: string;
  children: ReactNode;
  "data-sy": string;
  "aria-label": string;
  "aria-current"?: "page";
  "aria-pressed"?: boolean;
}

export interface BottomNavEntry {
  key: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  /** Contagem na bolinha (carrinho). 0 = sem bolinha. */
  badge?: number;
  /** Onde a animação "voar para o carrinho" aterra (só a loja usa). */
  iconRef?: Ref<HTMLSpanElement>;
  /** Link (página atual) vs. botão (painel aberto): decide o atributo ARIA. */
  semantics: "link" | "button";
  "data-sy": string;
  renderItem: (props: BottomNavItemProps) => ReactNode;
}

/**
 * Barra inferior do Lume (a "pílula" do telemóvel).
 *
 * Só apresentação: sem router, sem carrinho. A loja pública liga-a em
 * `store-shell.tsx`; o editor em `theme-editor/themes/lume/Renderer.tsx`, dentro
 * de `<LumeScope>`. A posição (fixa no fundo) vem de `className`/`style`.
 * As cores vêm das variáveis `--nav-*` (ver lib/bottom-nav-style.ts).
 */
export function BottomNavView({ items, className = "", style }: { items: BottomNavEntry[]; className?: string; style?: CSSProperties }) {
  return (
    <nav data-sy="bottom-nav" aria-label="Navegação principal" className={`premium-nav flex items-center ${className}`.trim()} style={style}>
      {items.map((it) => (
        <Fragment key={it.key}>
          {it.renderItem({
            className: `premium-nav-item ${it.active ? "is-active" : ""}`.trim(),
            "data-sy": it["data-sy"],
            "aria-label": it.label,
            ...(it.semantics === "link" ? { "aria-current": it.active ? ("page" as const) : undefined } : { "aria-pressed": it.active }),
            children: (
              <>
                <span ref={it.iconRef} className="premium-nav-icon">{it.icon}</span>
                <span className="premium-nav-label">{it.label}</span>
                {it.badge && it.badge > 0 ? <span key={it.badge} className="premium-nav-badge cart-count-slide">{it.badge > 9 ? "9+" : it.badge}</span> : null}
              </>
            ),
          })}
        </Fragment>
      ))}
    </nav>
  );
}
