'use client';

import { createFileRoute, Link } from '@/lib/route-compat';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText, History, RotateCcw, Square, SquarePen, Trash2, X } from 'lucide-react';
import { AssistenteComposer } from '@/components/assistente/AssistenteComposer';
import { recolherPedido, type Anexo } from '@/lib/assistente/handoff';
import {
  carregar, classificarErro, DETALHE_ERRO, gerarTitulo, guardar, MENSAGEM_ERRO, novaConversa, responder,
  type Conversa, type Msg,
} from '@/lib/assistente/conversas';

const SUGESTOES = ["Dar ideias", "Melhorar a loja", "Analisar a loja"];
const TIMEOUT_MS = 30000;

export const Route = createFileRoute('/_dashboard/assistente')({
  head: () => ({ meta: [
    { title: "Assistente Shopyump" },
    { name: "description", content: "Conversa com o assistente Shopyump para preparar e melhorar a tua loja." },
    { property: "og:title", content: "Assistente Shopyump" },
    { property: "og:description", content: "Conversa com o assistente Shopyump para preparar e melhorar a tua loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AssistentePage,
});

const iconBtn = "grid h-10 w-10 place-items-center rounded-full transition hover:bg-muted active:scale-95 active:bg-muted";

function AssistentePage() {
  const [conversas, setConversas] = useState<Conversa[]>(() => carregar());
  const [ativaId, setAtivaId] = useState<string>(() => novaConversa().id);
  const [historico, setHistorico] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  const ativa = conversas.find((c) => c.id === ativaId);
  const msgs = ativa?.msgs ?? [];
  const ocupado = msgs.some((m) => m.estado === "processando" || m.estado === "respondendo");

  useEffect(() => { guardar(conversas); }, [conversas]);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const mudar = useCallback((convId: string, f: (msgs: Msg[]) => Msg[]) => {
    setConversas((l) => l.map((c) => c.id === convId ? { ...c, msgs: f(c.msgs), atualizadaEm: Date.now() } : c));
  }, []);
  const mudarMsg = useCallback((convId: string, id: string, p: Partial<Msg> | ((m: Msg) => Partial<Msg>)) =>
    mudar(convId, (ms) => ms.map((m) => m.id === id ? { ...m, ...(typeof p === "function" ? p(m) : p) } : m)), [mudar]);

  /** Pede a resposta para um pedido já guardado. A resposta da IA reutiliza sempre o mesmo id (sem duplicar). */
  const pedir = useCallback(async (convId: string, pedidoId: string, texto: string, anexos: Anexo[]) => {
    ctrl.current?.abort();
    const ac = new AbortController(); ctrl.current = ac;
    const iaId = `ia-${pedidoId}`;
    mudar(convId, (ms) => {
      const base = ms.filter((m) => m.id !== iaId);
      return [...base.map((m) => m.pedidoId === pedidoId && m.autor === "eu" ? { ...m, estado: "concluido" as const } : m),
        { id: iaId, pedidoId, autor: "ia", texto: "", anexos: [], estado: "processando" }];
    });
    let expirou = false;
    const t = setTimeout(() => { expirou = true; ac.abort(); }, TIMEOUT_MS);
    try {
      await responder({ pedidoId, texto, anexos }, {
        signal: ac.signal,
        onToken: (tok) => mudarMsg(convId, iaId, (m) => ({ texto: m.texto + tok, estado: "respondendo" })),
      });
      mudarMsg(convId, iaId, { estado: "concluido" });
    } catch (e) {
      if (expirou) mudarMsg(convId, iaId, { estado: "erro", erro: "timeout" });
      else if ((e as Error)?.name === "AbortError") mudarMsg(convId, iaId, { estado: "cancelado" });
      else mudarMsg(convId, iaId, { estado: "erro", erro: classificarErro(e) });
    } finally {
      clearTimeout(t);
      if (ctrl.current === ac) ctrl.current = null;
    }
  }, [mudar, mudarMsg]);

  const enviar = (texto: string, anexos: Anexo[]) => {
    if (ocupado) return;
    const pedidoId = crypto.randomUUID();
    const eu: Msg = { id: pedidoId, pedidoId, autor: "eu", texto, anexos, estado: "enviando" };
    // Guarda a mensagem antes de pedir a resposta.
    setConversas((l) => {
      if (l.some((c) => c.id === ativaId)) return l.map((c) => c.id === ativaId ? { ...c, msgs: [...c.msgs, eu], atualizadaEm: Date.now() } : c);
      const c = novaConversa();
      return [{ ...c, id: ativaId, titulo: gerarTitulo(texto || anexos[0]?.nome || ""), msgs: [eu] }, ...l];
    });
    void pedir(ativaId, pedidoId, texto, anexos);
  };

  const repetir = (m: Msg) => {
    const orig = msgs.find((x) => x.autor === "eu" && x.pedidoId === m.pedidoId);
    if (!orig || !m.pedidoId || ocupado) return;
    void pedir(ativaId, m.pedidoId, orig.texto, orig.anexos);
  };

  const parar = () => ctrl.current?.abort();
  const iniciarNova = () => { parar(); setAtivaId(novaConversa().id); setHistorico(false); };
  const abrir = (id: string) => { parar(); setAtivaId(id); setHistorico(false); };
  const apagar = (id: string) => { setConversas((l) => l.filter((c) => c.id !== id)); if (id === ativaId) setAtivaId(novaConversa().id); };

  const primeiro = useRef(false);
  useEffect(() => { if (primeiro.current) return; primeiro.current = true; const p = recolherPedido(); if (p) enviar(p.texto, p.anexos); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lista = [...conversas].filter((c) => c.msgs.length).sort((a, b) => b.atualizadaEm - a.atualizadaEm);

  return (
    <div className="dashboard-shell flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center gap-1 border-b border-border/60 bg-background px-2 py-2">
        <Link to="/dashboard" aria-label="Voltar ao painel" className={iconBtn}><ArrowLeft className="h-5 w-5" /></Link>
        <span className="flex-1 truncate pl-1 text-[16px] font-semibold">Assistente</span>
        <button type="button" onClick={() => setHistorico(true)} aria-label="Histórico de conversas" title="Histórico" className={iconBtn}>
          <History className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={iniciarNova} aria-label="Nova conversa" title="Nova conversa" className={iconBtn}>
          <SquarePen className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <div className="pt-24 text-center">
            <p className="text-[22px] font-bold">Olá!</p>
            <p className="mt-2 text-[15px] text-muted-foreground">Como posso ajudar a melhorar a tua loja?</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGESTOES.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s, [])}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium transition hover:bg-muted active:scale-95 active:bg-muted">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-5">
          {msgs.map((m) => m.autor === "eu" ? (
            <div key={m.id} className="ml-auto max-w-[85%] rounded-3xl border border-border bg-card px-4 py-3 text-[15px] shadow-sm">
              {m.anexos.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {m.anexos.map((a) => a.tipo.startsWith("image/") && a.url
                    ? <img key={a.id} src={a.url} alt={a.nome} className="h-24 w-24 rounded-xl object-cover" />
                    : <span key={a.id} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"><FileText className="h-3.5 w-3.5" />{a.nome}</span>)}
                </div>
              )}
              {m.texto && <p className="whitespace-pre-wrap">{m.texto}</p>}
            </div>
          ) : (
            <div key={m.id} className="max-w-[92%] text-[15px] leading-relaxed" aria-live="polite">
              {m.estado === "processando" && <Bolinhas />}
              {m.texto && <p className="whitespace-pre-wrap">{m.texto}</p>}
              {m.estado === "cancelado" && <p className="mt-1 text-[13px] text-muted-foreground">Resposta interrompida.</p>}
              {m.estado === "erro" && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                  <span>{MENSAGEM_ERRO}{m.erro && <span className="block text-[12px] opacity-80">{DETALHE_ERRO[m.erro]}</span>}</span>
                  <button type="button" onClick={() => repetir(m)} disabled={ocupado}
                    className="flex items-center gap-1 rounded-full border border-border px-3 py-1 font-medium text-foreground transition hover:bg-muted active:scale-95 disabled:opacity-40">
                    <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={fim} />
      </main>

      <div className="relative mx-auto w-full max-w-2xl px-3 pb-4">
        {ocupado && (
          <button type="button" onClick={parar} aria-label="Parar resposta"
            className="absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-medium shadow-sm transition hover:bg-muted active:scale-95">
            <Square className="h-3 w-3 fill-current" /> Parar
          </button>
        )}
        <AssistenteComposer key={ativaId} onEnviar={enviar} />
      </div>

      {historico && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-label="Histórico de conversas">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-foreground/30" onClick={() => setHistorico(false)} />
          <aside className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col bg-background shadow-xl">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <span className="flex-1 text-[16px] font-semibold">Histórico</span>
              <button type="button" onClick={() => setHistorico(false)} aria-label="Fechar histórico" className={iconBtn}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {lista.length === 0 && <p className="px-3 py-8 text-center text-[14px] text-muted-foreground">Ainda não tens conversas.</p>}
              {lista.map((c) => (
                <div key={c.id} className={`group flex items-center rounded-xl ${c.id === ativaId ? "bg-muted" : "hover:bg-muted"}`}>
                  <button type="button" onClick={() => abrir(c.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                    <span className="block truncate text-[15px] font-medium">{c.titulo}</span>
                    <span className="block text-[12px] text-muted-foreground">{new Date(c.atualizadaEm).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</span>
                  </button>
                  <button type="button" aria-label={`Apagar ${c.titulo}`} onClick={() => apagar(c.id)} className="mr-1 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-background">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Bolinhas() {
  return (
    <span className="flex h-6 items-center gap-1.5" role="status" aria-label="A processar">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-muted-foreground/70" style={{ animation: "assistente-bolinha 1.2s ease-in-out infinite", animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  );
}
