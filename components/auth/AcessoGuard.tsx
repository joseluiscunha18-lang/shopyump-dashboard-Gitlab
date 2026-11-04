'use client';

import { useEffect } from 'react';

/** Intervalo mínimo entre verificações (poupa pedidos ao voltar à janela várias vezes seguidas). */
const INTERVALO_MS = 60_000;

/**
 * Obriga a senha de acesso também a quem já está DENTRO do painel.
 *
 * O middleware só corre quando há um pedido ao servidor; o painel carrega os dados direto do
 * Supabase no navegador, por isso um separador que já estava aberto não passava pelo middleware.
 * Este guarda pergunta ao servidor se o acesso está liberado ao abrir o painel e sempre que o
 * utilizador volta a este separador; se não estiver, leva-o para /login (onde a senha é pedida).
 * Sem rede não faz nada (não expulsa ninguém por uma falha de ligação).
 */
export function AcessoGuard() {
  useEffect(() => {
    let ultima = 0;

    async function verificar(forcar = false) {
      const agora = Date.now();
      if (!forcar && agora - ultima < INTERVALO_MS) return;
      ultima = agora;
      try {
        const r = await fetch('/api/acesso', { cache: 'no-store' });
        const d = (await r.json()) as { ativo: boolean; liberado: boolean };
        if (d.ativo && !d.liberado) window.location.assign('/login');
      } catch {
        /* sem ligação: não faz nada */
      }
    }

    void verificar(true);
    const aoVoltar = () => { if (document.visibilityState === 'visible') void verificar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, []);

  return null;
}
