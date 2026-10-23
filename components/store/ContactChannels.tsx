import { Clock, Mail, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

/** Canais oficiais de contacto, já filtrados (só os preenchidos). Fonte: "Canais de contacto". */
export type ContactChannelsData = {
  whatsapp?: string;
  mensagemWhatsapp?: string;
  telefone?: string;
  email?: string;
  horario?: string;
};

export function whatsappHref(numero: string, mensagem?: string): string {
  const base = `https://wa.me/${numero.replace(/\D/g, '')}`;
  return mensagem?.trim() ? `${base}?text=${encodeURIComponent(mensagem.trim())}` : base;
}

export function hasContactChannels(c: ContactChannelsData): boolean {
  return Boolean(c.whatsapp || c.telefone || c.email);
}

/** Lista partilhada pela página pública "Contacto" e pela pré-visualização no painel. */
export function ContactChannels({ data }: { data: ContactChannelsData }) {
  const { whatsapp, mensagemWhatsapp, telefone, email, horario } = data;
  if (!hasContactChannels(data)) {
    return <p className="text-sm text-muted-foreground">Esta loja ainda não indicou contactos.</p>;
  }
  return (
    <div className="grid gap-3">
      {whatsapp && (
        <a href={whatsappHref(whatsapp, mensagemWhatsapp)} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <MessageCircle size={18} aria-hidden /> Conversar no WhatsApp
        </a>
      )}
      <div className="grid">
        {whatsapp && <Item href={whatsappHref(whatsapp, mensagemWhatsapp)} external icon={<MessageCircle />} title="WhatsApp" detail={whatsapp} />}
        {telefone && <Item href={`tel:${telefone.replace(/\s/g, '')}`} icon={<Phone />} title="Telefone" detail={telefone} />}
        {email && <Item href={`mailto:${email}`} icon={<Mail />} title="E-mail" detail={email} />}
        {horario && (
          <div className="flex items-center gap-3 border-b border-border py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted [&_svg]:size-4"><Clock /></span>
            <div><p className="text-sm font-semibold">Horário de atendimento</p><p className="text-sm text-muted-foreground">{horario}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ href, icon, title, detail, external }: { href: string; icon: ReactNode; title: string; detail: string; external?: boolean }) {
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-3 border-b border-border py-4 transition-colors hover:text-muted-foreground">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted [&_svg]:size-4">{icon}</span>
      <div className="min-w-0"><p className="text-sm font-semibold">{title}</p><p className="break-all text-sm text-muted-foreground">{detail}</p></div>
    </a>
  );
}
