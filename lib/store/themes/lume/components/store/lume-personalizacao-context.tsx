'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { LumePersonalizacao } from '../../lib/personalizacao';

/**
 * Personalização do lojista (vinda do editor) para a loja pública.
 * `null` = loja sem personalização → o tema usa os seus valores originais.
 * Ver lib/personalizacao.ts (construído no servidor, aqui só se consome).
 */
const Ctx = createContext<LumePersonalizacao | null>(null);

export function LumePersonalizacaoProvider({ value, children }: { value: LumePersonalizacao | null; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLumePersonalizacao(): LumePersonalizacao | null {
  return useContext(Ctx);
}

/**
 * Folha de estilo + fontes da personalização. `css` é construído no servidor só
 * com valores validados (hex, números limitados, fontes do manifesto), por isso
 * é seguro injetá-lo como HTML cru — e tem de ser cru: o React escaparia o `>`
 * dos seletores dentro de <style>.
 */
export function LumePersonalizacaoStyle({ p }: { p: LumePersonalizacao }) {
  return (
    <>
      {p.fontsHref ? <link rel="stylesheet" href={p.fontsHref} /> : null}
      {p.css ? <style dangerouslySetInnerHTML={{ __html: p.css }} /> : null}
    </>
  );
}
