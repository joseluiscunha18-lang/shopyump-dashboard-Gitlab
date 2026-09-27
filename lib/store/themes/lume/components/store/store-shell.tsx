'use client';

import { Link, useRouterState } from "../../router";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowLeft, Facebook, Heart, Home, Instagram, MessageCircle, Music2, Search, ShoppingCart, User, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Toaster } from "../ui/sonner";
// products import removed — now sourced from LumeLojaContext
import { CartDrawer } from "./cart-drawer";
import { ProductArt } from "./product-art";
import { StoreProvider, useStore } from "./store-context";
import { AuthProvider, getInitials, useAuth } from "./auth-context";
import { AuthModal } from "./auth-modal";
import { useLumeLoja } from "./lume-loja-context";

export function StoreShell({ children }: { children: ReactNode }) {
  return <StoreProvider><AuthProvider><ShellContent>{children}</ShellContent></AuthProvider></StoreProvider>;
}

function ShellContent({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { cartCount, cartOpen, setCartOpen } = useStore();
  const navCartRef = useCartTarget();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [institutionalHeadingPassed, setInstitutionalHeadingPassed] = useState(false);
  const { produtos: produtosContexto } = useLumeLoja();
  const results = produtosContexto.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
  const navItems = [{ to: "/" as const, label: "Início" }, { to: "/sobre" as const, label: "Sobre" }, { to: "/contacto" as const, label: "Contacto" }];
  const minimal = pathname === "/conta";
  const catalog = pathname === "/produtos";
  const productPage = pathname.startsWith("/produto/");
  const institutionalTitles: Record<string, string> = {
    "/envios-e-entregas": "Envios e Entregas",
    "/trocas-e-devolucoes": "Trocas e Devoluções",
    "/termos-e-privacidade": "Termos e Privacidade",
  };
  const institutionalTitle = institutionalTitles[pathname];
  useEffect(() => {
    setInstitutionalHeadingPassed(false);
    if (!institutionalTitle) return;

    const heading = document.querySelector<HTMLElement>("[data-institutional-title]");
    if (!heading) return;

    const updateHeader = () => {
      const headingBounds = heading.getBoundingClientRect();
      setInstitutionalHeadingPassed(headingBounds.bottom <= 64);
    };
    const observer = new IntersectionObserver(updateHeader, {
      rootMargin: "-64px 0px 0px 0px",
      threshold: [0, 1],
    });

    observer.observe(heading);
    updateHeader();
    return () => observer.disconnect();
  }, [institutionalTitle]);
  if (minimal) {
    return (
      <div className="theme-lume min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur">
          <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/"><ArrowLeft size={20} strokeWidth={2.25} style={{ width: 20, height: 20 }} /></Link></Button>
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold tracking-normal">LUME</Link>
          </div>
        </header>
        <main className="pb-16">{children}</main>
        <CartDrawer />
        <AuthModal />
        <Toaster />
      </div>
    );
  }
  return (
    <div className="theme-lume min-h-screen bg-background text-foreground">
      {pathname === "/" && <div className="bg-topbar px-4 py-3 text-center text-[10px] font-semibold uppercase text-topbar-foreground">Entregas em todo Moçambique</div>}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur">
        <div className={`relative mx-auto flex max-w-6xl items-center justify-between sm:px-6 ${productPage ? "h-[62px] px-3" : "h-16 px-4"}`}>
          {productPage || institutionalTitle ? (
            <Button variant="ghost" size="icon" aria-label="Voltar à página anterior" onClick={() => window.history.back()}>
              <ArrowLeft size={20} strokeWidth={2.25} style={{ width: 20, height: 20 }} />
            </Button>
          ) : catalog ? (
            <Button asChild variant="ghost" size="icon" aria-label="Voltar ao início">
              <Link to="/"><ArrowLeft size={20} strokeWidth={2.25} style={{ width: 20, height: 20 }} /></Link>
            </Button>
          ) : (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu"><MenuTwoLines size={20} strokeWidth={2.25} /></Button>
              </SheetTrigger>
              <SheetContent side="left" overlayClassName="menu-backdrop" className="menu-panel w-[min(84vw,340px)] border-r border-border p-5">
                <SheetTitle className="menu-stagger-title text-xl font-extrabold">LUME</SheetTitle>
                <nav className="menu-stagger-list mt-10 grid gap-0.5">
                  {navItems.map((item) => {
                    const active = pathname === item.to;
                    return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`menu-stagger-item rounded-md px-3 py-2 text-lg transition-colors ${active ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}>{item.label}</Link>;
                  })}
                  <Link to="/favoritos" aria-current={pathname === "/favoritos" ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`menu-stagger-item rounded-md px-3 py-2 text-lg transition-colors ${pathname === "/favoritos" ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}>Favoritos</Link>
                </nav>
              </SheetContent>
            </Sheet>
          )}
          {institutionalTitle ? (
            <div className="pointer-events-none absolute inset-y-0 left-16 right-16 grid place-items-center overflow-hidden text-center">
              <Link
                to="/"
                aria-hidden={institutionalHeadingPassed}
                tabIndex={institutionalHeadingPassed ? -1 : 0}
                className={`pointer-events-auto absolute text-lg font-extrabold tracking-normal transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${institutionalHeadingPassed ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
              >
                LUME
              </Link>
              <span
                aria-hidden={!institutionalHeadingPassed}
                className={`absolute max-w-full truncate text-base font-semibold tracking-normal transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${institutionalHeadingPassed ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
              >
                {institutionalTitle}
              </span>
            </div>
          ) : (
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold tracking-normal">LUME</Link>
          )}
          {productPage ? (
            <CartIconButton cartCount={cartCount} onClick={() => setCartOpen(true)} />
          ) : institutionalTitle ? (
            <AccountButton />
          ) : <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Pesquisar" onClick={() => setSearchOpen(true)} className="hidden sm:inline-flex"><Search size={18} strokeWidth={2.25} style={{ width: 18, height: 18 }} /></Button>
            <Button asChild variant="ghost" size="icon" aria-label="Favoritos" className="hidden sm:inline-flex"><Link to="/favoritos"><Heart size={18} strokeWidth={2.25} style={{ width: 18, height: 18 }} /></Link></Button>
            <AccountButton />
          </div>}
        </div>
      </header>
      <main className={pathname === "/" || productPage ? "pb-0" : "pb-12 sm:pb-0"}>{children}</main>
      <StoreFooter productPage={productPage} />
      {!productPage && <nav aria-label="Navegação principal" className="premium-nav fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center sm:hidden">
        <BottomLink to="/" label="Início" active={pathname === "/"}><Home /></BottomLink>
        <BottomAction label="Pesquisar" active={searchOpen} onClick={() => setSearchOpen(true)}><Search className="optical-lg" /></BottomAction>
        <BottomLink to="/favoritos" label="Favoritos" active={pathname === "/favoritos"}><Heart className="optical-sm" /></BottomLink>
        <BottomAction label="Carrinho" active={cartOpen} onClick={() => setCartOpen(true)} badge={cartCount} iconRef={navCartRef}><ShoppingCart className="optical-lg" /></BottomAction>
      </nav>}
      {searchOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-background p-5 sm:p-10"><div className="mx-auto max-w-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Pesquisar produtos</h2><Button variant="ghost" size="icon" aria-label="Fechar pesquisa" onClick={() => setSearchOpen(false)}><X /></Button></div><div className="mt-7 relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O que procura?" className="h-12 pl-10"/></div><div className="mt-6 grid gap-3">{results.map((product) => <Link key={product.id} to="/produto/$productId" params={{ productId: product.id }} onClick={() => setSearchOpen(false)} className="grid grid-cols-[56px_1fr] items-center gap-3 border-b border-border pb-3"><div className={`product-mini product-tone-${product.tone}`}><ProductArt kind={product.kind}/></div><div><p className="text-sm font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{product.category}</p></div></Link>)}</div></div></div>}
      <CartDrawer />
      <AuthModal />
      <Toaster />
    </div>
  );
}

function StoreFooter({ productPage }: { productPage: boolean }) {
  const { contactos } = useLumeLoja();
  const ano = new Date().getFullYear();

  // Só renderiza o botão/link se o campo estiver preenchido
  const instagramUrl = contactos.instagram
    ? `https://instagram.com/${contactos.instagram.replace(/^@/, "")}`
    : null;
  const facebookUrl = contactos.facebook
    ? `https://facebook.com/${contactos.facebook.replace(/^@/, "")}`
    : null;
  const tiktokUrl = contactos.tiktok
    ? `https://tiktok.com/@${contactos.tiktok.replace(/^@/, "")}`
    : null;

  const hasSocial = instagramUrl || facebookUrl || tiktokUrl;

  return (
    <footer className={`bg-background px-5 pt-4 text-footer-foreground sm:px-8 sm:pb-8 sm:pt-6 ${productPage ? "pb-10" : "pb-[calc(8rem+env(safe-area-inset-bottom))]"}`}>
      <div className="mx-auto max-w-6xl border-t border-border pt-6 sm:pt-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:grid-cols-2 sm:gap-8">
          <div>
            <h2 className="text-xs font-bold uppercase text-foreground">INFORMAÇÕES</h2>
            <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/envios-e-entregas" className="transition-colors hover:text-foreground">Envios e Entregas</Link></li>
              <li><Link to="/trocas-e-devolucoes" className="transition-colors hover:text-foreground">Trocas e Devoluções</Link></li>
              <li><Link to="/termos-e-privacidade" className="transition-colors hover:text-foreground">Termos e Privacidade</Link></li>
            </ul>
          </div>
          {hasSocial && (
            <div>
              <div className="flex gap-1 sm:gap-2">
                {instagramUrl && (
                  <Button variant="footer" size="icon" aria-label="Instagram" className="max-sm:size-8" asChild>
                    <a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram /></a>
                  </Button>
                )}
                {facebookUrl && (
                  <Button variant="footer" size="icon" aria-label="Facebook" className="max-sm:size-8" asChild>
                    <a href={facebookUrl} target="_blank" rel="noreferrer"><Facebook /></a>
                  </Button>
                )}
                {tiktokUrl && (
                  <Button variant="footer" size="icon" aria-label="TikTok" className="max-sm:size-8" asChild>
                    <a href={tiktokUrl} target="_blank" rel="noreferrer"><Music2 /></a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 border-t border-border/60 pt-5 text-center sm:text-left">
          <div className="flex flex-col items-center gap-1 text-xs">
            <p>© {ano} {contactos.nome}. Todos os direitos reservados.</p>
            <p className="text-footer-muted">Criado com Shopyump</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function useCartTarget() {
  const { registerCartTarget } = useStore();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => registerCartTarget(ref.current), [registerCartTarget]);
  return ref;
}

function CartIconButton({ cartCount, onClick, className = "" }: { cartCount: number; onClick: () => void; className?: string }) {
  const iconRef = useCartTarget();
  return (
    <Button variant="ghost" size="icon" aria-label="Abrir carrinho" onClick={onClick} className={`relative ${className}`}>
       <span ref={iconRef} data-cart-header="true" className="inline-flex">
        <ShoppingCart size={18} strokeWidth={2.25} style={{ width: 18, height: 18 }} />
      </span>
      {cartCount > 0 && (
        <span key={cartCount} className="cart-count-slide absolute right-0 top-0 grid size-4 place-items-center overflow-hidden rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
          {cartCount > 9 ? "9+" : cartCount}
        </span>
      )}
    </Button>
  );
}

function AccountButton() {
  const { account, setAuthOpen } = useAuth();
  if (account) {
    return (
      <Button asChild variant="ghost" size="icon" aria-label="A minha conta">
        <Link to="/conta">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{getInitials(account.name, account.email)}</span>
        </Link>
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" aria-label="Entrar na conta" onClick={() => setAuthOpen(true)}>
      <User size={18} strokeWidth={2.25} style={{ width: 18, height: 18 }} />
    </Button>
  );
}


function MenuTwoLines({ size = 22, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h16" />
      <path d="M4 15h10" />
    </svg>
  );
}

function BottomLink({ to, label, active, children }: { to: "/" | "/favoritos"; label: string; active: boolean; children: ReactNode }) {
  return <Link to={to} aria-label={label} aria-current={active ? "page" : undefined} className={`premium-nav-item ${active ? "is-active" : ""}`}><span className="premium-nav-icon">{children}</span><span className="premium-nav-label">{label}</span></Link>;
}

function BottomAction({ label, active, onClick, badge = 0, iconRef, children }: { label: string; active: boolean; onClick: () => void; badge?: number; iconRef?: RefObject<HTMLSpanElement | null>; children: ReactNode }) {
  return <Button variant="nav" aria-label={label} aria-pressed={active} onClick={onClick} className={`premium-nav-item ${active ? "is-active" : ""}`}><span ref={iconRef} className="premium-nav-icon">{children}</span><span className="premium-nav-label">{label}</span>{badge > 0 && <span key={badge} className="premium-nav-badge cart-count-slide">{badge > 9 ? "9+" : badge}</span>}</Button>;
}

