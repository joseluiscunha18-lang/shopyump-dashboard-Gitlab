'use client';

import { useEffect, useId, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Pedido } from '@/types/database';

type ChangeHandler = (event: 'INSERT' | 'UPDATE', pedido: Pedido) => void;

/**
 * Replaces the single global, unfiltered Realtime channel in the legacy
 * global.js (which delivers every seller's orders to every open
 * dashboard tab and discards non-matches client-side). This subscribes
 * once per mounted screen, filtered server-side to one loja — see
 * architecture doc §6.3.
 */
export function usePedidosRealtime(lojaId: string | null, onChange: ChangeHandler) {
  const handlerRef = useRef(onChange);
  // Cada utilizador do hook precisa do SEU canal. Com o mesmo nome, o supabase-js devolve o canal já
  // subscrito (ex.: o do DashboardState, sempre montado) e `.on('postgres_changes')` lança
  // "cannot add postgres_changes callbacks ... after subscribe()" → cai no error.tsx.
  const instancia = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  handlerRef.current = onChange;

  useEffect(() => {
    if (!lojaId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`pedidos-${lojaId}-${instancia}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `loja_id=eq.${lojaId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            handlerRef.current(payload.eventType, payload.new as Pedido);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lojaId, instancia]);
}
