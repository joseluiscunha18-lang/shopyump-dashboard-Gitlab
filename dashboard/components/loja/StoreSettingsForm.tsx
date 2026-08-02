'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Instagram, Facebook, Phone, Mail } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updateLoja } from '@/lib/mutations/loja';
import { useToast } from '@/components/ui/Toast';
import type { Loja } from '@/types/database';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-3 border-b border-slate-100 last:border-0"
    >
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <span className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

export function StoreSettingsForm({ loja }: { loja: Loja }) {
  const [nome, setNome] = useState(loja.nome);
  const [descricao, setDescricao] = useState(loja.descricao ?? '');
  const [whatsapp, setWhatsapp] = useState(loja.whatsapp ?? '');
  const [email, setEmail] = useState(loja.email ?? '');
  const [instagram, setInstagram] = useState(loja.instagram ?? '');
  const [facebook, setFacebook] = useState(loja.facebook ?? '');
  const [mostrarSobre, setMostrarSobre] = useState(loja.mostrar_sobre ?? true);
  const [mostrarEntrega, setMostrarEntrega] = useState(loja.mostrar_entrega ?? true);
  const [mostrarTermos, setMostrarTermos] = useState(loja.mostrar_termos ?? true);
  const [conteudoSobre, setConteudoSobre] = useState(loja.conteudo_sobre ?? '');
  const [conteudoEntrega, setConteudoEntrega] = useState(loja.conteudo_entrega ?? '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateLoja(loja.id, {
      nome,
      descricao,
      whatsapp,
      email,
      instagram,
      facebook,
      mostrar_sobre: mostrarSobre,
      mostrar_entrega: mostrarEntrega,
      mostrar_termos: mostrarTermos,
      conteudo_sobre: conteudoSobre,
      conteudo_entrega: conteudoEntrega,
    });
    setSaving(false);
    if (!res.ok) return show(res.error ?? 'Não foi possível guardar as alterações.', 'error');
    show('Loja atualizada.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      <section className="flex flex-col gap-4">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Informações gerais</h3>
        <Input label="Nome da loja" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Textarea label="Descrição" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Contactos</h3>
        <Input label="WhatsApp" icon={<Phone size={15} />} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <Input label="E-mail" icon={<Mail size={15} />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Instagram" icon={<Instagram size={15} />} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
          <Input label="Facebook" icon={<Facebook size={15} />} value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" />
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500 mb-2">Secções visíveis na loja</h3>
        <Toggle checked={mostrarSobre} onChange={setMostrarSobre} label="Sobre a loja" />
        <Toggle checked={mostrarEntrega} onChange={setMostrarEntrega} label="Política de entrega" />
        <Toggle checked={mostrarTermos} onChange={setMostrarTermos} label="Termos e condições" />
      </section>

      {mostrarSobre && (
        <Textarea label="Texto — Sobre a loja" rows={4} value={conteudoSobre} onChange={(e) => setConteudoSobre(e.target.value)} />
      )}
      {mostrarEntrega && (
        <Textarea label="Texto — Política de entrega" rows={4} value={conteudoEntrega} onChange={(e) => setConteudoEntrega(e.target.value)} />
      )}

      <Button type="submit" loading={saving} className="self-start">
        Guardar alterações
      </Button>
    </form>
  );
}
