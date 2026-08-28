import { useEffect, RefObject } from 'react';

/** Fecha algo (ex.: um menu) quando se clica fora do `ref`. Usado pelo
 * menu "⋮" tanto em ProductRow como em PendingProductRow — antes cada
 * ficheiro tinha a sua própria cópia deste efeito. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
