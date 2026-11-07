'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics/track';

/** Liga o analytics do browser à loja pública. Não desenha nada. */
export function StoreAnalytics() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
