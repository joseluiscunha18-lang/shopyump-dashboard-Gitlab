'use client';

import { useEffect, useMemo, useState } from "react";
import { Search, X, Phone, MapPin, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSearch } from "@/lib/router-compat";

import type { Pedido, PedidoStatus } from "@/types/database";
import { getUserContext } from "@/lib/auth/getUserContext";
import { getPedidosByLoja } from "@/lib/queries/pedidos";
import { updatePedidoStatus } from "@/lib/mutations/pedidos";
import { usePedidosRealtime } from "@/lib/realtime/usePedidosRealtime";
import { useToast } from "@/components/ui/Toast";

/** Estados reais da base de dados (pendente → confirmado → enviado → concluído, ou cancelado). */
export type EstadoPedido = PedidoStatus;

const POR_PAGINA = 50;

/** Código curto e legível do pedido (o id real é um UUID). */
const numero = (p: Pedido) => `#${String(p.id ?? "").replace(/-/g, "").slice(0, 6).toUpperCase()}`;
const itensDe = (p: Pedido) => (Array.isArray(p.itens) ? p.itens : []);
const subtotal = (p: Pedido) => itensDe(p).reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.quantidade) || 0), 0);
/** Entrega = o que o total tem a mais do que os produtos (o pedido não guarda a entrega à parte). */
const entregaDe = (p: Pedido) => Math.max(0, (p.total ?? 0) - subtotal(p));
const varianteDe = (i: Pedido["itens"][number]) => [i.corSelecionada, i.tamanhoSelecionado].filter(Boolean).join(" / ");

const mzn = (v: number | string | null | undefined) => `${(Number(v) || 0).toLocaleString("pt-MZ")} MZN`;
const dataCurta = (iso: string | null | undefined) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString("pt-MZ", { day: "numeric", month: "short" }) : "—";
};
const dataLonga = (iso: string | null | undefined) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleString("pt-MZ", { dateStyle: "long", timeStyle: "short" }) : "—";
};

const ESTADO: Record<EstadoPedido, { label: string; cls: string }> = {
  pendente: { label: "Novo", cls: "text-brand font-bold" },
  confirmado: { label: "Confirmado", cls: "text-foreground font-semibold" },
  enviado: { label: "Enviado", cls: "text-foreground font-semibold" },
  concluido: { label: "Concluído", cls: "text-muted-foreground font-medium" },
  cancelado: { label: "Cancelado", cls: "text-muted-foreground/70 font-medium line-through decoration-muted-foreground/40" },
};

/** Próximo passo permitido a partir de cada estado (as mesmas transições do painel original). */
const PROXIMO: Partial<Record<EstadoPedido, { para: EstadoPedido; acao: string; titulo: string; cor: string }>> = {
  pendente: { para: "confirmado", acao: "Confirmar pedido", titulo: "Confirmar pedido?", cor: "bg-success" },
  confirmado: { para: "enviado", acao: "Marcar como enviado", titulo: "Marcar como enviado?", cor: "bg-success" },
  enviado: { para: "concluido", acao: "Marcar como concluído", titulo: "Concluir pedido?", cor: "bg-success" },
};
const PODE_CANCELAR: EstadoPedido[] = ["pendente", "confirmado"];

function EstadoTag({ estado }: { estado: EstadoPedido }) {
  const e = ESTADO[estado] ?? ESTADO.pendente;
  return <span className={cn("inline-flex items-center text-xs", e.cls)}>{e.label}</span>;
}

type Filtro = "todos" | "novo" | "em_curso" | "concluido" | "cancelado";
const FILTROS: { v: Filtro; l: string }[] = [
  { v: "todos", l: "Todos" },
  { v: "novo", l: "Novos" },
  { v: "em_curso", l: "Em curso" },
  { v: "concluido", l: "Concluídos" },
  { v: "cancelado", l: "Cancelados" },
];
const casa = (f: Filtro, e: EstadoPedido) =>
  f === "todos" ||
  (f === "novo" && e === "pendente") ||
  (f === "em_curso" && (e === "confirmado" || e === "enviado")) ||
  (f === "concluido" && e === "concluido") ||
  (f === "cancelado" && e === "cancelado");

export function PedidosPage() {
  const { show } = useToast();
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estado, setEstado] = useState<"loading" | "erro" | "ok">("loading");
  const [tentativa, setTentativa] = useState(0);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const { filtro: filtroUrl, pedido: pedidoUrl } = useSearch({ strict: false }) as { filtro?: string; pedido?: string };
  useEffect(() => {
    setFiltro(filtroUrl === "novos" ? "novo" : "todos");
  }, [filtroUrl]);
  const [abertoId, setAbertoId] = useState<string | null>(pedidoUrl ?? null);
  useEffect(() => {
    if (pedidoUrl) setAbertoId(pedidoUrl);
  }, [pedidoUrl]);
  const [confirmar, setConfirmar] = useState<EstadoPedido | null>(null);
  const [aGravar, setAGravar] = useState(false);

  // Carrega os pedidos reais da loja do utilizador.
  useEffect(() => {
    let vivo = true;
    setEstado("loading");
    (async () => {
      try {
        const ctx = await getUserContext();
        if (!ctx.loja) { if (vivo) { setPedidos([]); setEstado("ok"); } return; }
        const lista = await getPedidosByLoja(ctx.loja.id);
        if (!vivo) return;
        setLojaId(ctx.loja.id);
        setPedidos(lista);
        setEstado("ok");
      } catch {
        if (vivo) setEstado("erro");
      }
    })();
    return () => { vivo = false; };
  }, [tentativa]);

  // Tempo real: pedidos novos e mudanças de estado aparecem sem recarregar.
  usePedidosRealtime(lojaId, (_evento, pedido) => {
    setPedidos((prev) => {
      const existe = prev.some((p) => p.id === pedido.id);
      return existe ? prev.map((p) => (p.id === pedido.id ? { ...p, ...pedido } : p)) : [pedido, ...prev];
    });
  });

  useEffect(() => setMostrar(POR_PAGINA), [q, filtro]);

  const ordenados = useMemo(() => [...pedidos].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")), [pedidos]);
  const visiveis = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^#/, "");
    return ordenados.filter(
      (p) =>
        casa(filtro, p.status) &&
        (!t || (p.cliente_nome ?? "").toLowerCase().includes(t) || numero(p).toLowerCase().includes(t) || (p.cliente_telefone ?? "").includes(t)),
    );
  }, [ordenados, q, filtro]);
  const aberto = pedidos.find((p) => p.id === abertoId) ?? null;

  async function aplicar(novo: EstadoPedido) {
    if (!aberto || aGravar) return;
    const anterior = aberto.status;
    setAGravar(true);
    setPedidos((prev) => prev.map((p) => (p.id === aberto.id ? { ...p, status: novo } : p))); // otimista
    setConfirmar(null);
    const r = await updatePedidoStatus(aberto.id, novo);
    setAGravar(false);
    if (!r.ok) {
      setPedidos((prev) => prev.map((p) => (p.id === aberto.id ? { ...p, status: anterior } : p)));
      show(r.error ?? "Não foi possível atualizar o pedido.", "error");
      return;
    }
    show(`Pedido ${numero(aberto)}: ${ESTADO[novo].label.toLowerCase()}.`);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-28 pt-2">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">Pedidos</h1>
      </header>

      {estado === "loading" ? (
        <p className="py-16 text-center text-sm text-muted-foreground">A carregar pedidos…</p>
      ) : estado === "erro" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os pedidos.</p>
          <button onClick={() => setTentativa((n) => n + 1)} className="h-10 rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">Tentar de novo</button>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border/70 bg-card shadow-xs px-6 py-16 text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Inbox size={34} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-brand/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Ainda não tens pedidos</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Quando os clientes fizerem encomendas na tua loja, os pedidos aparecem aqui para os acompanhares.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-transparent bg-muted px-3.5 transition-colors focus-within:border-border focus-within:bg-card">
              <Search size={17} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar pedidos"
                className="h-full w-full min-w-0 border-0 bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="flex w-full gap-1 overflow-x-auto no-scrollbar rounded-xl bg-muted p-1">
              {FILTROS.map((f) => {
                const n = pedidos.filter((p) => casa(f.v, p.status)).length;
                const ativo = filtro === f.v;
                return (
                  <button
                    key={f.v}
                    onClick={() => setFiltro(f.v)}
                    className={cn(
                      "flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-all",
                      ativo ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.l}
                    <span className={cn("rounded-md px-1.5 text-xs tabular-nums", ativo ? "bg-brand text-brand-foreground" : "text-muted-foreground")}>{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
            <div className="hidden grid-cols-[90px_1.4fr_1fr_1fr_110px] gap-4 border-b border-border/70 px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid">
              <span>Pedido</span><span>Cliente</span><span>Data</span><span className="text-right">Total</span><span className="text-right">Estado</span>
            </div>
            {visiveis.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum pedido corresponde à pesquisa.</p>
            ) : (
              visiveis.slice(0, mostrar).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAbertoId(p.id)}
                  className="block w-full border-b border-border/70 px-4 py-3.5 text-left last:border-0 hover:bg-muted md:px-5"
                >
                  {/* mobile */}
                  <div className="lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[15px] font-bold text-foreground">{p.cliente_nome}</p>
                      <p className="shrink-0 text-[15px] font-bold text-foreground">{mzn(p.total)}</p>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold">{numero(p)}</span>· {dataCurta(p.created_at)}
                      </p>
                      <EstadoTag estado={p.status} />
                    </div>
                  </div>
                  {/* desktop */}
                  <div className="hidden grid-cols-[90px_1.4fr_1fr_1fr_110px] items-center gap-4 text-sm lg:grid">
                    <span className="font-semibold text-muted-foreground">{numero(p)}</span>
                    <span className="truncate font-semibold text-foreground">{p.cliente_nome}</span>
                    <span className="text-muted-foreground">{dataCurta(p.created_at)}</span>
                    <span className="text-right font-bold text-foreground">{mzn(p.total)}</span>
                    <span className="text-right"><EstadoTag estado={p.status} /></span>
                  </div>
                </button>
              ))
            )}
            {visiveis.length > mostrar && (
              <button onClick={() => setMostrar((n) => n + POR_PAGINA)} className="block w-full border-t border-border/70 px-5 py-3.5 text-center text-sm font-semibold text-brand hover:bg-muted">
                Mostrar mais ({visiveis.length - mostrar})
              </button>
            )}
          </div>
        </>
      )}

      {aberto && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-foreground/40" onClick={() => setAbertoId(null)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-card shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
              <div>
                <p className="text-xl font-semibold text-foreground">Pedido {numero(aberto)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{dataLonga(aberto.created_at)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <EstadoTag estado={aberto.status} />
                </div>
              </div>
              <button onClick={() => setAbertoId(null)} aria-label="Fechar" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <section className="mx-5 rounded-2xl bg-muted p-4">
              <p className="text-xs font-semibold text-muted-foreground">Cliente</p>
              <p className="mt-1.5 text-[15px] font-bold text-foreground">{aberto.cliente_nome}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Phone size={14} /> {aberto.cliente_telefone}</p>
              {aberto.cliente_endereco && <p className="mt-1.5 flex items-start gap-2 text-sm text-muted-foreground"><MapPin size={14} className="mt-0.5 shrink-0" /> {aberto.cliente_endereco}</p>}
            </section>

            <section className="px-5 pt-5">
              <p className="text-xs font-semibold text-muted-foreground">Produtos</p>
              <ul className="mt-2">
                {itensDe(aberto).map((i, idx) => (
                  <li key={`${i.id}-${idx}`} className="flex justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{i.nome}</p>
                      <p className="text-xs text-muted-foreground">{varianteDe(i) ? `${varianteDe(i)} · ` : ""}{i.quantidade ?? 0} × {mzn(i.preco)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-foreground">{mzn((Number(i.preco) || 0) * (Number(i.quantidade) || 0))}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-2 space-y-1.5 border-t border-border/70 pt-3 text-sm">
                {entregaDe(aberto) > 0 && <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{mzn(subtotal(aberto))}</span></div>}
                {entregaDe(aberto) > 0 && <div className="flex justify-between text-muted-foreground"><span>Entrega</span><span>{mzn(entregaDe(aberto))}</span></div>}
                <div className="flex justify-between pt-1 text-base font-semibold text-foreground"><span>Total</span><span>{mzn(aberto.total)}</span></div>
              </div>
            </section>

            {(PROXIMO[aberto.status] || PODE_CANCELAR.includes(aberto.status)) && (
              <div className="mt-auto flex gap-2 p-5">
                {PODE_CANCELAR.includes(aberto.status) && (
                  <button onClick={() => setConfirmar("cancelado")} className="h-11 flex-1 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted">
                    Cancelar pedido
                  </button>
                )}
                {PROXIMO[aberto.status] && (
                  <button onClick={() => setConfirmar(PROXIMO[aberto.status]!.para)} className={cn("h-11 flex-1 rounded-full text-sm font-semibold text-background", PROXIMO[aberto.status]!.cor)}>
                    {PROXIMO[aberto.status]!.acao}
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {confirmar && aberto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5">
            <p className="text-lg font-bold text-foreground">
              {confirmar === "cancelado" ? "Cancelar pedido?" : PROXIMO[aberto.status]?.titulo}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              O pedido {numero(aberto)} de {aberto.cliente_nome} passará a {ESTADO[confirmar].label}.{" "}
              {confirmar === "cancelado" || confirmar === "concluido" ? "Esta ação não pode ser revertida." : ""}
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmar(null)} className="h-11 flex-1 rounded-full border border-border text-sm font-semibold text-foreground">Voltar</button>
              <button
                disabled={aGravar}
                onClick={() => void aplicar(confirmar)}
                className={cn("h-11 flex-1 rounded-full text-sm font-semibold text-background disabled:opacity-60", confirmar === "cancelado" ? "bg-danger" : "bg-success")}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
