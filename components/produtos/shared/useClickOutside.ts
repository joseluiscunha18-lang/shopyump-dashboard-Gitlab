import { useEffect, RefObject } from 'react';

/** Fecha algo (ex.: um menu) quando se clica fora de TODAS as refs dadas.
 * Aceita mais que uma ref porque o menu "⋮" (ProductActionsMenu) passou a
 * ter o botão e o dropdown em pontos separados do DOM (o dropdown vive
 * num portal, fora da linha do produto) — um clique dentro do dropdown
 * continua a contar como "dentro", mesmo não estando dentro do botão. */
export function useClickOutside(refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[], active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return;
    const lista = Array.isArray(refs) ? refs : [refs];
    function onClickOutside(e: MouseEvent) {
      const dentro = lista.some((ref) => ref.current && ref.current.contains(e.target as Node));
      if (!dentro) onOutside();
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
