'use client';

import { createFileRoute } from "../router";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { PageHeading } from "../components/store/page-heading";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { useLumePersonalizacao } from "../components/store/lume-personalizacao-context";

export const Route = createFileRoute("/contacto")({
  head: () => ({ meta: [{ title: "Contacto — LUME." }, { name: "description", content: "Fale com a equipa da loja por mensagem, WhatsApp ou email." }, { property: "og:title", content: "Contacto — LUME." }, { property: "og:description", content: "Fale com a equipa da loja por mensagem, WhatsApp ou email." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ContactPage,
});

function ContactPage() {
  const { contactos } = useLumeLoja();
  const p = useLumePersonalizacao();

  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Contacto de ${String(data.get("name") ?? "cliente")}`);
    const body = encodeURIComponent(`${String(data.get("message") ?? "")}\n\nEmail: ${String(data.get("email") ?? "")}`);
    const emailDest = contactos.email ?? `ola@${contactos.nome.toLowerCase().replace(/\s+/g, "")}.co.mz`;
    window.location.href = `mailto:${emailDest}?subject=${subject}&body=${body}`;
  };

  const whatsappUrl = contactos.whatsapp
    ? `https://wa.me/${contactos.whatsapp.replace(/\D/g, "")}`
    : null;
  const instagramUrl = contactos.instagram
    ? `https://instagram.com/${contactos.instagram.replace(/^@/, "")}`
    : null;

  return (
    <>
      <PageHeading pageKey="contact" eyebrow="Fale connosco" title="Contacto" description="Envie uma mensagem ou escolha um dos canais diretos da loja." />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-6 md:grid-cols-[1fr_.8fr]">
        <form className="grid gap-4" onSubmit={sendMessage}>
          <label className="grid gap-2 text-sm font-semibold">Nome<Input name="name" required placeholder="O seu nome" /></label>
          <label className="grid gap-2 text-sm font-semibold">Email<Input name="email" type="email" required placeholder="nome@exemplo.com" /></label>
          <label className="grid gap-2 text-sm font-semibold">Mensagem<Textarea name="message" required className="min-h-32" placeholder="Como podemos ajudar?" /></label>
          <Button size="lg" type="submit">{p?.ui.contactSubmit ?? "Enviar mensagem"}</Button>
        </form>
        <div className="grid content-start gap-3">
          {whatsappUrl && (
            <ContactItem href={whatsappUrl} icon={<MessageCircle />} title="WhatsApp" detail={contactos.whatsapp!} />
          )}
          {contactos.email && (
            <ContactItem href={`mailto:${contactos.email}`} icon={<Mail />} title="Email" detail={contactos.email} />
          )}
          {instagramUrl && (
            <ContactItem href={instagramUrl} icon={<MapPin />} title="Instagram" detail={`@${contactos.instagram!.replace(/^@/, "")}`} />
          )}
        </div>
      </section>
    </>
  );
}

function ContactItem({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-border py-4 transition-colors hover:text-muted-foreground">
      <span className="grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-4">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </a>
  );
}
