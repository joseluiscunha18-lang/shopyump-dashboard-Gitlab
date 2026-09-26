'use client';

import { useState } from 'react';
import { formatMzn, montarMensagemPedido, whatsappHref } from '../cart/whatsappOrder';
import { useCart } from '../cart/CartContext';
import type { LojaPublica } from '@/lib/queries/lojaPublica';

export function CheckoutView({ loja }: { loja: LojaPublica }) {
  const { items, total, limpar } = useCart();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [morada, setMorada] = useState('');
  const [enviado, setEnviado] = useState(false);

  const lojaSemWhatsapp = !loja.whatsapp;
  const formularioValido = nome.trim() && telefone.trim() && morada.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formularioValido || lojaSemWhatsapp) return;

    const mensagem = montarMensagemPedido(loja, items, { nome, telefone, morada });
    const href = whatsappHref(loja.whatsapp, mensagem);
    if (!href) return;

    setEnviado(true);
    limpar();
    window.location.href = href;
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      {/* Resumo do pedido */}
      <div className="flex flex-col gap-2 rounded-[12px] border border-[oklch(0.88224_0_0)] p-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-[oklch(0.52081_0_0)]">Resumo</span>
        {items.map((i) => (
          <div key={i.produtoId} className="flex justify-between text-[12.5px] text-[oklch(0.24353_0_0)]">
            <span className="truncate pr-2">
              {i.quantidade}x {i.nome}
            </span>
            <span className="shrink-0 font-semibold">{formatMzn(i.preco * i.quantidade)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-[oklch(0.88224_0_0)] pt-2 text-[13px] font-black text-[oklch(0.24353_0_0)]">
          <span>Total</span>
          <span>{formatMzn(total)}</span>
        </div>
      </div>

      {lojaSemWhatsapp ? (
        <p className="rounded-[10px] bg-[oklch(0.95213_0_0)] p-4 text-[12.5px] font-medium text-[#78716C]">
          Esta loja ainda não configurou um número de WhatsApp para receber pedidos.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <span className="text-[11px] font-black uppercase tracking-widest text-[oklch(0.52081_0_0)]">Os teus dados</span>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[oklch(0.24353_0_0)]">Nome</span>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="O teu nome completo"
              className="h-11 rounded-[10px] border border-[oklch(0.88224_0_0)] bg-white px-3.5 text-[13px] font-medium text-[oklch(0.24353_0_0)] placeholder:text-[oklch(0.52081_0_0)] focus:border-[oklch(0.24353_0_0)] focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[oklch(0.24353_0_0)]">Número de telefone</span>
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="84 000 0000"
              className="h-11 rounded-[10px] border border-[oklch(0.88224_0_0)] bg-white px-3.5 text-[13px] font-medium text-[oklch(0.24353_0_0)] placeholder:text-[oklch(0.52081_0_0)] focus:border-[oklch(0.24353_0_0)] focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[oklch(0.24353_0_0)]">Morada de entrega</span>
            <textarea
              required
              rows={2}
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
              placeholder="Bairro, rua, referência…"
              className="rounded-[10px] border border-[oklch(0.88224_0_0)] bg-white px-3.5 py-2.5 text-[13px] font-medium text-[oklch(0.24353_0_0)] placeholder:text-[oklch(0.52081_0_0)] focus:border-[oklch(0.24353_0_0)] focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={!formularioValido || enviado}
            className="mt-1.5 flex items-center justify-center gap-2 rounded-[10px] bg-[#25D366] py-3.5 text-[13.5px] font-bold text-white active:opacity-80 disabled:opacity-40"
          >
            Enviar pedido pelo WhatsApp
          </button>
          <p className="text-center text-[11px] font-medium text-[oklch(0.52081_0_0)]">
            Vais ser encaminhado para o WhatsApp para confirmares o pedido.
          </p>
        </form>
      )}
    </div>
  );
}
