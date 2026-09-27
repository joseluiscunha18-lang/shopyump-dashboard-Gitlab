'use client';

import { createFileRoute, Link, useNavigate } from "../router";
import { LogOut, MapPin, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { PageHeading } from "../components/store/page-heading";
import { ProductCard } from "../components/store/product-card";
import { useAuth, getInitials, orderStatusLabel } from "../components/store/auth-context";
import { useStore } from "../components/store/store-context";
import { formatPrice, products } from "../lib/store-data";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "A minha conta — LUME." },
      { name: "description", content: "Acompanhe pedidos, dados de entrega e favoritos na sua conta LUME." },
      { property: "og:title", content: "A minha conta — LUME." },
      { property: "og:description", content: "Acompanhe pedidos, dados de entrega e favoritos na sua conta LUME." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const commonFirstNames = [
  "alexandre", "antonio", "catarina", "daniela", "eduardo", "fernando", "francisco",
  "gabriela", "isabel", "joana", "joao", "jose", "juliana", "manuel", "mariana",
  "maria", "miguel", "patricia", "paulo", "ricardo", "sofia", "tiago",
];

function getGreetingName(name: string, email: string) {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const cleanName = name.trim();
  const source = (cleanName && cleanName.toLowerCase() !== localPart
    ? cleanName.split(/\s+/)[0]
    : localPart.split(/[._-]+/)[0]?.replace(/\d+$/g, "")) ?? "";
  const normalized = source.toLowerCase();
  const recognizedName = commonFirstNames.find((candidate) => normalized.startsWith(candidate));
  const firstName = recognizedName ?? source;

  return firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : "";
}

function AccountPage() {
  const { account, setAuthOpen, updateAccount, logout } = useAuth();
  const navigate = useNavigate();
  const { favourites } = useStore();
  const saved = products.filter((product) => favourites.includes(product.id));

  const handleLogout = () => {
    logout();
    void navigate({ to: "/", replace: true });
  };

  if (!account) {
    return (
      <>
        <PageHeading eyebrow="Área pessoal" title="A minha conta" description="Inicie sessão para ver pedidos, dados e favoritos." />
        <section className="mx-auto flex min-h-[360px] max-w-6xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
          <span className="grid size-14 place-items-center rounded-full bg-muted"><User /></span>
          <h2 className="mt-4 text-lg font-semibold">Ainda não iniciou sessão</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Entre com o seu e-mail — enviamos um código de 6 dígitos, sem palavra-passe.</p>
          <Button className="mt-5" onClick={() => setAuthOpen(true)}>Entrar ou criar conta</Button>
        </section>
      </>
    );
  }

  return (
    <>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-3 pt-5 sm:px-6 sm:pt-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{getInitials(account.name, account.email)}</span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">Olá, {getGreetingName(account.name, account.email)}</h1>
            <p className="truncate text-xs text-muted-foreground">{account.email}</p>
          </div>
        </div>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
        <Tabs defaultValue="pedidos">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1 sm:inline-flex sm:w-auto">
            <TabsTrigger value="pedidos" className="rounded-xl">Pedidos</TabsTrigger>
            <TabsTrigger value="dados" className="rounded-xl">Meus dados</TabsTrigger>
            <TabsTrigger value="favoritos" className="rounded-xl">Favoritos</TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="mt-6 grid gap-4">
            {account.orders.length ? (
              account.orders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.date} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} artigos</p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">{orderStatusLabel[order.status]}</span>
                  </div>
                  <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
                    {order.items.map((item) => <li key={item.name}>{item.quantity}× {item.name}</li>)}
                  </ul>
                  <p className="mt-4 text-sm font-bold">{formatPrice(order.total)}</p>
                </article>
              ))
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-border bg-card text-center">
                <p className="text-sm font-semibold">Ainda não realizou nenhum pedido.</p>
                <Button asChild variant="outline" className="mt-4"><Link to="/">Ir para a loja</Link></Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dados" className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-bold">Dados pessoais</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="account-name" className="text-xs font-semibold uppercase text-muted-foreground">Nome</label>
                  <Input id="account-name" value={account.name} onChange={(event) => updateAccount({ name: event.target.value })} className="h-11" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="account-email" className="text-xs font-semibold uppercase text-muted-foreground">E-mail</label>
                  <Input id="account-email" value={account.email} readOnly className="h-11 bg-muted" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-bold">Endereço de entrega</h2>
              {account.delivery ? (
                <div className="mt-4 grid gap-4">
                  <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{account.delivery.name}</p>
                      <p className="text-muted-foreground">{account.delivery.address}</p>
                      <p className="text-muted-foreground">{account.delivery.phone}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input className="h-11" value={account.delivery.name} onChange={(event) => updateAccount({ delivery: { ...account.delivery!, name: event.target.value } })} placeholder="Nome" />
                    <Input className="h-11" value={account.delivery.phone} onChange={(event) => updateAccount({ delivery: { ...account.delivery!, phone: event.target.value } })} placeholder="WhatsApp" />
                    <Input className="h-11" value={account.delivery.address} onChange={(event) => updateAccount({ delivery: { ...account.delivery!, address: event.target.value } })} placeholder="Endereço" />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Ainda não guardou um endereço. Ele é guardado automaticamente no seu primeiro pedido.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold">Novidades por e-mail</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">Receba promoções e lançamentos da LUME.</p>
                </div>
                <Switch checked={account.marketingOptIn} onCheckedChange={(checked) => updateAccount({ marketingOptIn: checked })} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="favoritos" className="mt-6">
            {saved.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {saved.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-border bg-card text-center">
                <p className="text-sm font-semibold">Ainda não tem favoritos</p>
                <Button asChild variant="outline" className="mt-4"><Link to="/">Ver produtos</Link></Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button variant="outline" className="mt-8 w-full sm:w-auto" onClick={handleLogout}>
          <LogOut className="size-4" /> Sair da conta
        </Button>
      </section>
    </>
  );
}
