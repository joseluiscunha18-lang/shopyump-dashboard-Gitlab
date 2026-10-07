'use client';

import { createFileRoute } from "../router";
import { InstitutionalPage } from "../components/store/institutional-page";
import { institutionalPages } from "../lib/institutional-data";
import { useLumeLoja } from "../components/store/lume-loja-context";

export const Route = createFileRoute("/termos-e-privacidade")({
  head: () => ({ meta: [{ title: "Termos e Privacidade — LUME." }, { name: "description", content: "Consulte os termos de utilização, proteção de dados e segurança de pagamentos da LUME." }, { property: "og:title", content: "Termos e Privacidade — LUME." }, { property: "og:description", content: "Consulte os termos de utilização, proteção de dados e segurança de pagamentos da LUME." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: TermsRoute,
});

function TermsRoute() {
  const { paginas } = useLumeLoja();
  return <InstitutionalPage pageKey="terms" data={institutionalPages.privacy} textoLoja={paginas.termos.texto} />;
}
