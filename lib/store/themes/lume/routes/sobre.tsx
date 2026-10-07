'use client';

import { createFileRoute } from "../router";
import { PageHeading } from "../components/store/page-heading";
import { useLumeLoja } from "../components/store/lume-loja-context";

export const Route = createFileRoute("/sobre")({
  head: () => ({ meta: [{ title: "Sobre Nós — LUME." }, { name: "description", content: "Conheça a proposta e os valores da loja." }, { property: "og:title", content: "Sobre Nós — LUME." }, { property: "og:description", content: "Conheça a proposta e os valores da loja." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AboutPage,
});

function AboutPage() {
  const { contactos, paginas } = useLumeLoja();
  const nome = contactos.nome;

  // Se o lojista preencheu conteúdo personalizado de "Sobre" no dashboard
  // (loja.conteudo_sobre), mostra-o tal como escrito; caso contrário usa
  // o texto modelo genérico com o nome da loja.
  const textoPersonalizado = paginas.sobre.texto;

  return (
    <>
      <PageHeading pageKey="about" eyebrow="A marca" title="Sobre nós" description={`Conheça a ${nome} — quem somos, o que fazemos e como pode contar connosco.`} />
      {textoPersonalizado ? (
        <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {textoPersonalizado.split(/\n{2,}/).map((paragrafo, index) => (
              <p key={index} className="whitespace-pre-line">{paragrafo}</p>
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 sm:px-6 sm:py-14">
          <div>
            <h2 className="text-xl font-bold">Essenciais para todos os dias</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A {nome} nasce com uma proposta direta: reunir peças versáteis, atendimento próximo
              e uma experiência de compra sem complicações.
            </p>
          </div>
          <div className="grid gap-5 border-l-0 border-border sm:border-l sm:pl-8">
            <div>
              <h3 className="font-semibold">Selecção cuidada</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Produtos escolhidos para combinar qualidade, conforto e uso diário.</p>
            </div>
            <div>
              <h3 className="font-semibold">Compra simples</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Da descoberta ao pedido, cada etapa foi pensada para ser clara.</p>
            </div>
            <div>
              <h3 className="font-semibold">Atendimento próximo</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Canais diretos para esclarecer dúvidas e acompanhar cada compra.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
