import { createFileRoute } from "@/lib/route-compat";
import { PedidosPage } from "@/components/pedidos/PedidosPage";

export const Route = createFileRoute("/_dashboard/pedidos/")({
  head: () => ({
    meta: [
      { title: "Pedidos | Shopyump" },
      { name: "description", content: "Acompanha e gere os pedidos da tua loja." },
      { property: "og:title", content: "Pedidos | Shopyump" },
      { property: "og:description", content: "Acompanha e gere os pedidos da tua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { filtro?: "novos"; pedido?: string } => ({
    ...(s.filtro === "novos" ? { filtro: "novos" as const } : {}),
    ...(typeof s.pedido === "string" ? { pedido: s.pedido } : {}),
  }),
  component: PedidosPage,
});
