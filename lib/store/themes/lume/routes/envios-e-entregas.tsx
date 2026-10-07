'use client';

import { createFileRoute } from "../router";
import { InstitutionalPage } from "../components/store/institutional-page";
import { institutionalPages } from "../lib/institutional-data";
import { useLumeLoja } from "../components/store/lume-loja-context";

export const Route = createFileRoute("/envios-e-entregas")({
  head: () => ({ meta: [{ title: "Envios e Entregas — LUME." }, { name: "description", content: "Informações sobre processamento, modalidades, rastreio e custos de entrega da LUME." }, { property: "og:title", content: "Envios e Entregas — LUME." }, { property: "og:description", content: "Informações sobre processamento, modalidades, rastreio e custos de entrega da LUME." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ShippingRoute,
});

function ShippingRoute() {
  const { paginas } = useLumeLoja();
  return <InstitutionalPage pageKey="shipping" data={institutionalPages.shipping} textoLoja={paginas.entrega.texto} />;
}
