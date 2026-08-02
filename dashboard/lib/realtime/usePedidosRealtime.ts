'use client';

import { useEffect, useRef } from 'react';
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
  handlerRef.current = onChange;

  useEffect(() => {
    if (!lojaId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`pedidos-${lojaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `loja_id=eq.${lojaId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            handlerRef.current(payload.eventType, payload.new as Pedido);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lojaId]);
}
