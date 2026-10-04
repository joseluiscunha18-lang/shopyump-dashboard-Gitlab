"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/theme-editor/lib/utils";
import { PortalContainerContext } from "./portal-container";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700&family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Space+Grotesk:wght@400;500;700&family=Playfair+Display:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap";

/**
 * Raiz de tudo o que é do editor/personalizar. Define o âmbito dos estilos
 * (`.ed-root`) e o contentor dos pop-ups. `page` = ocupa o ecrã todo (editor);
 * sem `page` = integra-se na página do painel (Personalizar loja).
 */
export function EditorRoot({ children, page = false, className }: { children: ReactNode; page?: boolean; className?: string }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <div ref={setEl} className={cn("ed-root", page && "ed-root-page", className)}>
      {/* Fontes do tema de demonstração (o React 19 coloca isto no <head>). */}
      <link rel="stylesheet" href={FONTS_HREF} precedence="default" />
      <PortalContainerContext.Provider value={el}>{children}</PortalContainerContext.Provider>
    </div>
  );
}
