'use client';

import { createFileRoute } from "../router";
import { InstitutionalPage } from "../components/store/institutional-page";
import { institutionalPages } from "../lib/institutional-data";

export const Route = createFileRoute("/trocas-e-devolucoes")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções — LUME." }, { name: "description", content: "Consulte os prazos, condições e passos para trocas, devoluções e reembolsos na LUME." }, { property: "og:title", content: "Trocas e Devoluções — LUME." }, { property: "og:description", content: "Consulte os prazos, condições e passos para trocas, devoluções e reembolsos na LUME." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <InstitutionalPage data={institutionalPages.returns} />,
});
