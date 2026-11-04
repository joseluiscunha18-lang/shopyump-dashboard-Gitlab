'use client';

import { Route } from '@/lib/routes/_dashboard';
import { RoutePage } from '@/lib/route-compat';
import { AcessoGuard } from '@/components/auth/AcessoGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AcessoGuard />
      <RoutePage route={Route}>{children}</RoutePage>
    </>
  );
}
