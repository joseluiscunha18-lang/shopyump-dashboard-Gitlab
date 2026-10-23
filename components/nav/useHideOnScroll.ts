'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Esconde a barra inferior ao deslizar para baixo e mostra-a ao deslizar para cima.
 *
 * Regras:
 *  - começa visível, e volta a estar visível ao mudar de página (`resetKey`);
 *  - só reage a um deslocamento acumulado relevante (`THRESHOLD`), para pequenos
 *    movimentos não provocarem animações constantes;
 *  - parar de deslizar mantém o estado atual;
 *  - perto do topo da página fica sempre visível;
 *  - depois de mudar, ignora o scroll durante a animação (`LOCK_MS`) — evita oscilar;
 *  - páginas que mal fazem scroll não escondem a barra;
 *  - enquanto um campo de texto tem foco (teclado aberto) o estado não muda;
 *  - desligado (`enabled=false`) fica sempre visível.
 */
const THRESHOLD = 24;      // px de deslocação acumulada na mesma direção
const TOP_ZONE = 64;       // px do topo onde a barra fica sempre visível
const LOCK_MS = 320;       // tempo em que o scroll é ignorado após a barra mudar
const MIN_SCROLLABLE = 160; // a página tem de ter pelo menos isto de scroll para esconder

function campoEmEdicao() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
}

export function useHideOnScroll(enabled: boolean, resetKey: string): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const acumulado = useRef(0);
  const bloqueadoAte = useRef(0);

  // Nova página: barra visível e contagem reiniciada.
  useEffect(() => {
    setHidden(false);
    lastY.current = window.scrollY;
    acumulado.current = 0;
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) { setHidden(false); return; }
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.max(0, window.scrollY);
        const delta = y - lastY.current;
        lastY.current = y;

        if (campoEmEdicao()) { acumulado.current = 0; return; }

        const noTopo = y < TOP_ZONE;
        if (noTopo) { acumulado.current = 0; setHidden(false); return; }

        // Durante a animação o scroll é ignorado (a barra do browser a mexer também gera eventos).
        if (performance.now() < bloqueadoAte.current) { acumulado.current = 0; return; }

        // Página quase sem scroll: não vale a pena esconder.
        if (document.documentElement.scrollHeight - window.innerHeight < MIN_SCROLLABLE) { acumulado.current = 0; return; }

        // Mudou de direção: recomeça a contagem.
        if (acumulado.current !== 0 && Math.sign(delta) !== Math.sign(acumulado.current)) acumulado.current = 0;
        acumulado.current += delta;

        if (acumulado.current > THRESHOLD) { setHidden(true); acumulado.current = 0; bloqueadoAte.current = performance.now() + LOCK_MS; }
        else if (acumulado.current < -THRESHOLD) { setHidden(false); acumulado.current = 0; bloqueadoAte.current = performance.now() + LOCK_MS; }
      });
    };

    lastY.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [enabled]);

  return hidden;
}
