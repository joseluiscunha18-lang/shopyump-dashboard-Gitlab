import { createFileRoute } from "@/lib/route-compat";
import { useMemo, useState } from "react";
import { MessageCircle, Mail, Search, Users } from "lucide-react";

export const Route = createFileRoute("/_dashboard/clientes")({
  head: () => ({ meta: [{ title: "Clientes | Shopyump" }, { name: "description", content: "Acompanha os clientes da tua loja Shopyump." }, { property: "og:title", content: "Clientes | Shopyump" }, { property: "og:description", content: "Acompanha os clientes da tua loja Shopyump." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

type Cliente = { id: number; nome: string; contacto: string; canal: "whatsapp" | "email"; pedidos: number; total: number; ultimo: string };
const CLIENTES: Cliente[] = [
  { id: 1, nome: "Ana Machava", contacto: "+258 84 123 4567", canal: "whatsapp", pedidos: 3, total: 4350, ultimo: "Hoje" },
  { id: 2, nome: "Carlos Sitoe", contacto: "carlos@email.com", canal: "email", pedidos: 1, total: 1200, ultimo: "Ontem" },
  { id: 3, nome: "Fátima Nhantumbo", contacto: "+258 82 765 4321", canal: "whatsapp", pedidos: 5, total: 9800, ultimo: "Há 3 dias" },
];

const mt = (v: number) => `${v.toLocaleString("pt-PT")} MT`;
const iniciais = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

function Page() {
  const [q, setQ] = useState("");
  const list = useMemo(() => CLIENTES.filter((c) => (c.nome + c.contacto).toLowerCase().includes(q.toLowerCase())), [q]);
  const totalGasto = CLIENTES.reduce((s, c) => s + c.total, 0);
  const frequentes = CLIENTES.filter((c) => c.pedidos > 1).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-28 pt-2">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">Clientes</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">Acompanha quem já comprou na tua loja.</p>
      </header>

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        {[["Clientes", String(CLIENTES.length)], ["Frequentes", String(frequentes)], ["Total gasto", mt(totalGasto)]].map(([l, v], i) => (
          <div key={l} className={`flex flex-col gap-0.5 p-4 sm:p-5 ${i > 0 ? "border-l border-border/70" : ""}`}>
            <span className="text-[13px] text-muted-foreground">{l}</span>
            <span className="truncate text-[17px] font-semibold text-foreground">{v}</span>
          </div>
        ))}
      </div>

      <label className="flex h-12 items-center gap-2.5 rounded-xl border border-border bg-card px-4 shadow-xs focus-within:border-primary">
        <Search size={18} className="text-muted-foreground" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome ou contacto"
          className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground" />
      </label>

      <section className="flex flex-col">
        <h2 className="px-1 pb-2.5 text-[15px] font-semibold tracking-tight text-foreground">Lista de clientes</h2>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Users size={22} /></span>
              <p className="text-[15px] font-semibold text-foreground">Nenhum cliente encontrado</p>
              <p className="max-w-[260px] text-sm text-muted-foreground">Os clientes aparecem aqui depois do primeiro pedido.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {list.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{iniciais(c.nome)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground">{c.nome}</p>
                    <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      {c.canal === "whatsapp" ? <MessageCircle size={14} aria-hidden /> : <Mail size={14} aria-hidden />}{c.contacto}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-semibold text-foreground">{mt(c.total)}</p>
                    <p className="text-[13px] text-muted-foreground">{c.pedidos} {c.pedidos === 1 ? "pedido" : "pedidos"} · {c.ultimo}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
