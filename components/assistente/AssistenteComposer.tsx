import { useEffect, useRef, useState } from "react";
import { ArrowUp, Camera, FileText, Image as ImageIcon, Paperclip, Plus, X } from "lucide-react";
import { ficheirosParaAnexos, type Anexo } from "@/lib/assistente/handoff";

interface Props {
  placeholder?: string;
  onEnviar: (texto: string, anexos: Anexo[]) => void;
  autoFocus?: boolean;
  semBorda?: boolean;
  plusSimples?: boolean;
  compacto?: boolean;
  menuAbaixo?: boolean;
  frases?: string[];
}

/** Caixa de escrita do assistente: botão + abre menu (câmara, galeria, ficheiro) e seta para enviar. */
export function AssistenteComposer({ placeholder = "Escreve a tua mensagem...", onEnviar, autoFocus, semBorda, plusSimples, compacto, menuAbaixo, frases }: Props) {
  const [focado, setFocado] = useState(false);
  const [texto, setTexto] = useState("");
  const animado = useDigitacao(frases, !focado && !texto);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [menu, setMenu] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const pode = texto.trim().length > 0 || anexos.length > 0;

  useEffect(() => {
    if (!menu) return;
    const fechar = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("pointerdown", fechar);
    return () => document.removeEventListener("pointerdown", fechar);
  }, [menu]);

  const enviar = () => {
    if (!pode) return;
    onEnviar(texto.trim(), anexos);
    setTexto("");
    setAnexos([]);
  };

  const escolher = (ref: React.RefObject<HTMLInputElement | null>) => { setMenu(false); ref.current?.click(); };
  const aoEscolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnexos((l) => [...l, ...ficheirosParaAnexos(e.target.files)]);
    e.target.value = "";
  };

  const opcoes = [
    { label: "Câmara", icon: Camera, ref: camRef },
    { label: "Galeria de fotografias", icon: ImageIcon, ref: galRef },
    { label: "Ficheiro", icon: Paperclip, ref: fileRef },
  ];

  return (
    <div ref={boxRef} className={`relative rounded-[24px] border ${semBorda ? "border-border/70 shadow-xs" : "border-border shadow-[0_6px_24px_oklch(0.2_0_0/0.07)]"} bg-card ${compacto ? "p-2.5" : "p-3"}`}>
      {menu && (
        <div role="menu" className={`absolute ${menuAbaixo ? "top-full mt-2" : "bottom-full mb-2"} left-0 z-30 w-60 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg`}>
          {opcoes.map(({ label, icon: Icon, ref }) => (
            <button key={label} role="menuitem" type="button" onClick={() => escolher(ref)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition hover:bg-muted active:scale-[0.98] active:bg-muted">
              <Icon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.5} />{label}
            </button>
          ))}
        </div>
      )}
      {anexos.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 px-1">
          {anexos.map((a) => (
            <div key={a.id} className="relative">
              {a.tipo.startsWith("image/") ? (
                <img src={a.url} alt={a.nome} className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 max-w-[160px] items-center gap-1.5 rounded-xl bg-muted px-2 text-xs font-medium text-foreground">
                  <FileText className="h-4 w-4 shrink-0" /><span className="truncate">{a.nome}</span>
                </div>
              )}
              <button type="button" aria-label={`Remover ${a.nome}`} onClick={() => setAnexos((l) => l.filter((x) => x.id !== a.id))}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
      {frases && !focado && !texto && (
        <span aria-hidden className="pointer-events-none absolute left-2 top-1 text-[15px] text-muted-foreground">{animado}<span className="ml-px inline-block h-[1.05em] w-px translate-y-[2px] animate-pulse bg-muted-foreground/60" /></span>
      )}
      <textarea
        value={texto}
        autoFocus={autoFocus}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) { e.preventDefault(); enviar(); } }}
        placeholder={frases ? (focado ? frases[0] : "") : placeholder}
        rows={compacto ? 1 : 2}
        aria-label="Mensagem para o assistente"
        style={{ outline: "none", border: 0, boxShadow: "none" }}
        className="block w-full resize-none appearance-none rounded-none border-0 bg-transparent px-2 py-1 text-[15px] text-foreground shadow-none outline-none ring-0 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
      />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <button type="button" aria-label="Anexar" aria-expanded={menu} onClick={() => setMenu((v) => !v)}
          className={`grid h-10 w-10 place-items-center rounded-full ${plusSimples ? "" : "border border-border"} text-foreground transition-colors hover:bg-muted`}>
          <Plus className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoEscolher} />
        <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={aoEscolher} />
        <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,image/*" className="hidden" onChange={aoEscolher} />
        <button type="button" aria-label="Enviar" onClick={enviar} disabled={!pode}
          className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30">
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Escreve frases letra a letra, pausa, apaga e passa à seguinte. */
function useDigitacao(frases: string[] | undefined, ativo: boolean) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    if (!frases?.length || !ativo) return;
    let i = 0, n = 0, apagar = false, t: ReturnType<typeof setTimeout>;
    const passo = () => {
      const f = frases[i % frases.length];
      if (!apagar) { n++; setTxt(f.slice(0, n)); if (n >= f.length) { apagar = true; t = setTimeout(passo, 1800); return; } t = setTimeout(passo, 55); }
      else { n--; setTxt(f.slice(0, n)); if (n <= 0) { apagar = false; i++; t = setTimeout(passo, 400); return; } t = setTimeout(passo, 28); }
    };
    t = setTimeout(passo, 400);
    return () => clearTimeout(t);
  }, [frases, ativo]);
  return txt;
}
