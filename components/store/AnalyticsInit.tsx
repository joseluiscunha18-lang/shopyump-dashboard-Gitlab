'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics/track';

/**
 * Liga o tracking de visitas (ver lib/analytics/track.ts e ANALYTICS_SPEC.md).
 * Montado uma vez em StoreRenderer — não desenha nada.
 */
export function AnalyticsInit({ lojaId }: { lojaId: string }) {
  useEffect(() => {
    initAnalytics(lojaId);
  }, [lojaId]);
  return null;
}
