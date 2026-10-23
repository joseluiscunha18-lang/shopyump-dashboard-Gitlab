import { createFileRoute, redirect } from "@/lib/route-compat";

// O detalhe do pedido vive num único sítio: o painel da página Pedidos.
export const Route = createFileRoute("/_dashboard/pedidos/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/pedidos", search: { pedido: params.id } });
  },
});
