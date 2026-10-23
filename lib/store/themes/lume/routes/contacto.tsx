'use client';

import { createFileRoute } from "../router";
import { PageHeading } from "../components/store/page-heading";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { ContactChannels } from "@/components/store/ContactChannels";

export const Route = createFileRoute("/contacto")({
  head: () => ({ meta: [{ title: "Contacto — LUME." }, { name: "description", content: "Fale com a loja por WhatsApp, telefone ou e-mail." }, { property: "og:title", content: "Contacto — LUME." }, { property: "og:description", content: "Fale com a loja por WhatsApp, telefone ou e-mail." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ContactPage,
});

/**
 * Sem formulário: não existe mecanismo para entregar mensagens ao lojista,
 * por isso só mostramos os canais diretos reais (de "Canais de contacto").
 */
function ContactPage() {
  const { contactos } = useLumeLoja();
  return (
    <>
      <PageHeading pageKey="contact" eyebrow="Fale connosco" title="Contacto" description="Escolha um dos canais diretos da loja." />
      <section className="mx-auto max-w-xl px-5 py-10 sm:px-6">
        <ContactChannels data={{ whatsapp: contactos.whatsapp, mensagemWhatsapp: contactos.mensagemWhatsapp, telefone: contactos.telefone, email: contactos.email, horario: contactos.horario }} />
      </section>
    </>
  );
}
