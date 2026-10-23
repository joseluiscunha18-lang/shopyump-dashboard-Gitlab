import { createFileRoute, redirect } from '@/lib/route-compat';

export const Route = createFileRoute('/_dashboard/configuracoes/informacoes')({
  beforeLoad: () => { throw redirect({ to: '/configuracoes/dados', replace: true }); },
});
