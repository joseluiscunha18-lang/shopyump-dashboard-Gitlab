import { createFileRoute, redirect } from '@/lib/route-compat';

export const Route = createFileRoute('/_dashboard/configuracoes/devolucoes')({
  beforeLoad: () => { throw redirect({ to: '/configuracoes/politicas/$slug', params: { slug: 'devolucoes' }, replace: true }); },
});
