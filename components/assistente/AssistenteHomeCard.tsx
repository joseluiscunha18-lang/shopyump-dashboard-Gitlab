'use client';

import { useNavigate } from '@/lib/route-compat';
import { AssistenteComposer } from './AssistenteComposer';
import { entregarPedido } from '@/lib/assistente/handoff';

/** Caixa compacta e permanente na Home. Só abre o chat quando o comerciante envia. */
const FRASES = ["Escreve o que precisas...", "Como posso melhorar a minha loja?", "Ajuda-me a criar uma descrição...", "Dá-me ideias para vender mais..."];

type Fase = "inicio" | "em_progresso" | "completo";

export function AssistenteHomeCard({ fase }: { fase: Fase }) {
  const navigate = useNavigate();
  const abrir = (texto: string, anexos: Parameters<typeof entregarPedido>[0]["anexos"] = []) => {
    entregarPedido({ texto, anexos });
    navigate({ to: "/assistente" });
  };
  return (
    <section aria-label="Assistente Shopyump" className="mb-4">
      {fase === "inicio" ? (
        <div className="mb-4 px-1">
          <h1 className="text-[26px] font-black leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[30px]">Bem-vindo à Shopyump!</h1>
          <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">Por onde queres começar?</p>
        </div>
      ) : (
        <h1 className="mb-4 px-1 text-[26px] font-black leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[30px]">
          {fase === "completo" ? "Como posso ajudar a tua loja hoje?" : "O que vamos fazer hoje?"}
        </h1>
      )}
      <AssistenteComposer onEnviar={abrir} placeholder="Escreve o que precisas..." frases={FRASES} semBorda plusSimples compacto menuAbaixo />
    </section>
  );
}
