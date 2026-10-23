'use client';

import { Route } from '@/lib/routes/_dashboard';
import { RoutePage } from '@/lib/route-compat';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoutePage route={Route}>{children}</RoutePage>;
}
