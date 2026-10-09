import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, Undo2, Redo2, Monitor, Tablet, Smartphone, Layers, Settings2, ChevronLeft, X,
  Eye, EyeOff, Lock, ArrowUp, ArrowDown, Copy, Trash2, Plus, MoreHorizontal, RotateCcw,
  Palette, Type, Sparkles, LayoutTemplate, Zap, Wrench, Check, Loader2, AlertCircle, Bug,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/theme-editor/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/theme-editor/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/theme-editor/ui/alert-dialog";
import { cn } from "@/theme-editor/lib/utils";
import { useEditor, useEditorDispatch, isReadOnlyPreview, type PanelFrame } from "@/theme-editor/editor/core/store";
import { parsePath, sectionPath } from "@/theme-editor/editor/core/paths";
import { blockIdsOf, sectionTypeOf, visibleSectionIds } from "@/theme-editor/editor/core/resolve";
import { ThemeProvider } from "@/theme-editor/editor/sdk";
import { openActionOf } from "@/theme-editor/editor/core/openAction";
import { ThemeRenderer } from "@/theme-editor/themes/registry";
import { mockAdapter, setFailNextSave } from "@/theme-editor/mocks/adapter";
import { NodePanel, SettingsList } from "../panels/NodePanel";
import type { Device } from "@/theme-editor/editor/contracts/types";

const WIDTH: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const f = () => setD(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return d;
}

export function EditorShell() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const isDesktop = useIsDesktop();
  const [sheetHeight, setSheetHeight] = useState(72);
  const [fixedReserve, setFixedReserve] = useState(0);
  const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

  // atalhos
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [dispatch]);

  // abrir com ?select=
  useEffect(() => {
    const sel = new URLSearchParams(window.location.search).get("select");
    if (sel && parsePath(sel)) dispatch({ type: "select", path: sel.includes(".settings") || sel.split(".").length > 2 ? sel : sectionPath(sel.split(".")[1]), title: "Selecionado" });
  }, [dispatch]);

  return (
    <div className="ed-root flex h-dvh flex-col bg-ed-canvas text-foreground">
      <TopBar isDesktop={isDesktop} debug={debug} />
      <div className="relative flex min-h-0 flex-1">
        <Preview isDesktop={isDesktop} sheetHeight={sheetHeight} onFixedReserve={setFixedReserve} />
        {isDesktop ? (
          <aside className="w-[380px] shrink-0 border-l border-border bg-background">
            {state.panel.stack.length ? <PanelContent /> : <EmptySidebar />}
          </aside>
        ) : (
          <BottomSheet onHeightChange={setSheetHeight} fixedReserve={fixedReserve} />
        )}
      </div>
      {isDesktop ? <BottomBar isDesktop={isDesktop} hidden={false} /> : null}
      {debug && state.ui.inspectorOpen ? <Inspector /> : null}
    </div>
  );
}

/* ------------------------------ TopBar ------------------------------ */

function SaveButton() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const s = state.save.status;
  const save = async () => {
    dispatch({ type: "saveStart" });
    try {
      await mockAdapter.saveCustomization(state.draft);
      dispatch({ type: "saveOk" });
      setTimeout(() => dispatch({ type: "saveSettled" }), 1500);
    } catch (e) {
      dispatch({ type: "saveError", error: (e as Error).message });
      toast.error("Erro ao salvar", { description: (e as Error).message, action: { label: "Tentar de novo", onClick: save } });
    }
  };
  return (
    <Button size="sm" variant={s === "dirty" || s === "error" ? "default" : "secondary"} disabled={s === "saved" || s === "saving"} onClick={save}>
      {s === "saving" ? <Loader2 className="size-4 animate-spin" /> : s === "savedNow" ? <Check className="size-4" /> : s === "error" ? <AlertCircle className="size-4" /> : s === "dirty" ? <span className="size-2 rounded-full bg-primary-foreground" /> : null}
      {s === "saving" ? "A salvar" : s === "savedNow" ? "Salvo" : s === "error" ? "Tentar de novo" : s === "dirty" ? "Salvar" : "Salvo"}
    </Button>
  );
}

function TopBar({ isDesktop, debug }: { isDesktop: boolean; debug: boolean }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border bg-background px-2">
      <Button size="icon" variant="ghost" aria-label="Voltar" onClick={() => (state.save.status === "dirty" ? setConfirmExit(true) : mockAdapter.navigate("back"))}>
        <ArrowLeft className="size-5" />
      </Button>
      {isDesktop ? <span className="mr-2 font-display text-sm font-semibold">Editar loja</span> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="font-medium">
            {state.manifest.pages.find((p) => p.id === state.page)?.label} ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(["main", "info"] as const).map((g) => {
            const list = state.manifest.pages.filter((p) => (p.group ?? "main") === g && (p.supported || debug) && (!p.requires || state.manifest.capabilities[p.requires]));
            if (!list.length) return null;
            return (
              <div key={g}>
                <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g === "main" ? "Principais" : "Informativas"}</p>
                {list.map((p) => (
                  <DropdownMenuItem key={p.id} disabled={!p.supported} onClick={() => dispatch({ type: "setPage", page: p.id })}>
                    {p.label} {!p.supported ? <span className="ml-auto text-xs text-muted-foreground">Em breve</span> : null}
                  </DropdownMenuItem>
                ))}
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {isDesktop ? <div className="mx-auto"><DeviceSwitch /></div> : <div className="flex-1" />}

      <Button size="icon" variant="ghost" aria-label="Desfazer" disabled={!state.history.past.length} onClick={() => dispatch({ type: "undo" })}>
        <Undo2 className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Refazer" disabled={!state.history.future.length} onClick={() => dispatch({ type: "redo" })}>
        <Redo2 className="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Mais"><MoreHorizontal className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => dispatch({ type: "toggleOverlays" })}>
            {state.ui.showOverlays ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {state.ui.showOverlays ? "Ver sem editar" : "Voltar a editar"}
          </DropdownMenuItem>
          {!isDesktop ? (
            <>
              <DropdownMenuSeparator />
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dispositivo</p>
              {([["mobile", "Telemóvel", Smartphone], ["tablet", "Tablet", Tablet], ["desktop", "Computador", Monitor]] as const).map(([id, label, Icon]) => (
                <DropdownMenuItem key={id} onClick={() => dispatch({ type: "setDevice", device: id })}>
                  <Icon className="size-4" /> {label} {state.device === id ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={() => setConfirmReset(true)}><RotateCcw className="size-4" /> Restaurar tudo</DropdownMenuItem>
          {debug ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => dispatch({ type: "toggleInspector" })}><Bug className="size-4" /> Inspetor JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFailNextSave(true); toast("O próximo salvamento vai falhar (teste)."); }}>Simular erro ao salvar</DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveButton />

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>Se sair agora, perde as alterações feitas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar a editar</AlertDialogCancel>
            <AlertDialogAction onClick={() => mockAdapter.navigate("back")}>Sair sem salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar tudo?</AlertDialogTitle>
            <AlertDialogDescription>Todas as personalizações voltam ao padrão do tema. Pode desfazer depois.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { dispatch({ type: "resetAll" }); toast("Tudo restaurado", { action: { label: "Desfazer", onClick: () => dispatch({ type: "undo" }) } }); }}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

function DeviceSwitch() {
  const { device } = useEditor();
  const dispatch = useEditorDispatch();
  const items: [Device, ReactNode, string][] = [
    ["desktop", <Monitor key="d" className="size-4" />, "Computador"],
    ["tablet", <Tablet key="t" className="size-4" />, "Tablet"],
    ["mobile", <Smartphone key="m" className="size-4" />, "Telemóvel"],
  ];
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {items.map(([id, icon, label]) => (
        <button key={id} title={label} onClick={() => dispatch({ type: "setDevice", device: id })}
          className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs", device === id ? "bg-background shadow-sm" : "text-muted-foreground")}>
          {icon}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ BottomBar ------------------------------ */

function BottomBar({ isDesktop, hidden }: { isDesktop: boolean; hidden: boolean }) {
  const dispatch = useEditorDispatch();
  const { panel, device } = useEditor();
  const top = panel.stack[0];
  const [devOpen, setDevOpen] = useState(false);
  if (hidden) return null;
  return (
    <nav className="relative z-30 flex h-14 shrink-0 items-center justify-around border-t border-border bg-background">
      <BarBtn active={top?.kind === "sections"} icon={<Layers className="size-5" />} label="Seções"
        onClick={() => dispatch({ type: "pushPanelRoot", frame: { kind: "sections", title: "Seções" } })} />
      {!isDesktop ? (
        <div className="relative">
          <BarBtn icon={device === "mobile" ? <Smartphone className="size-5" /> : device === "tablet" ? <Tablet className="size-5" /> : <Monitor className="size-5" />} label="Dispositivo" onClick={() => setDevOpen(!devOpen)} />
          {devOpen ? (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-popover p-1 shadow-lg" onClick={() => setDevOpen(false)}>
              <DeviceSwitch />
            </div>
          ) : null}
        </div>
      ) : null}
      <BarBtn active={top?.kind === "settings" || top?.kind === "settingsGroup"} icon={<Settings2 className="size-5" />} label="Configurações"
        onClick={() => dispatch({ type: "pushPanelRoot", frame: { kind: "settings", title: "Configurações" } })} />
    </nav>
  );
}

function BarBtn({ icon, label, onClick, active }: { icon: ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex min-w-20 flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[11px]", active ? "text-primary" : "text-muted-foreground")}>
      {icon}
      {label}
    </button>
  );
}

/* ------------------------------ Preview ------------------------------ */

function MobileDeviceChip() {
  const { device } = useEditor();
  const dispatch = useEditorDispatch();
  const devices = [
    { id: "mobile", label: "Telemóvel", Icon: Smartphone },
    { id: "tablet", label: "Tablet", Icon: Tablet },
    { id: "desktop", label: "Computador", Icon: Monitor },
  ] as const;
  const current = devices.find((item) => item.id === device) ?? devices[0];
  return (
    <div className="absolute right-2 top-2 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-background/95 shadow-sm" aria-label={`Dispositivo de pré-visualização: ${current.label}`}>
            <current.Icon /> {current.label} ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {devices.map(({ id, label, Icon }) => (
            <DropdownMenuItem key={id} onSelect={() => dispatch({ type: "setDevice", device: id })}>
              <Icon className="size-4" /> {label} {device === id ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Preview({ isDesktop, sheetHeight, onFixedReserve }: { isDesktop: boolean; sheetHeight: number; onFixedReserve: (height: number) => void }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);
  const [avail, setAvail] = useState(390);
  const [boxH, setBoxH] = useState(800);
  const [fixedHeight, setFixedHeight] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setAvail(el.clientWidth); setBoxH(el.clientHeight); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const logical = WIDTH[state.device];
  const pad = isDesktop ? 48 : 0;
  const scale = Math.min(1, (avail - pad) / logical);
  const sheetRatio = isDesktop ? 0 : Math.min(1, sheetHeight / boxH);
  const sheetInsetPx = (boxH * sheetRatio) / scale;
  const viewportH = (boxH * (1 - sheetRatio)) / scale;
  const fixedViewportH = (boxH - (isDesktop ? 0 : 72)) / scale;
  useEffect(() => { onFixedReserve(isDesktop ? 0 : fixedHeight * scale); }, [fixedHeight, scale, isDesktop, onFixedReserve]);
  const page = state.manifest.pages.find((p) => p.id === state.page);
  const overlay = state.manifest.overlays?.find((o) => o.id === state.previewOverlay);
  useEffect(() => {
    if (!state.previewOverlay) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") dispatch({ type: "closeOverlay" }); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [state.previewOverlay, dispatch]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [state.page]);
  const sheetPad = isDesktop ? "0px" : `${sheetHeight}px`;
  // Seção fixa em edição (barra inferior): sobe tanto quanto a sheet cresceu acima do tamanho
  // recolhido (72 px), para ficar acima dela. Só com o painel DESSE nó aberto — com Seções,
  // Definições ou outro nó, o preview fica como sempre.
  const topFrame = state.panel.stack[state.panel.stack.length - 1];
  const fixedLiftPx = isDesktop || topFrame?.kind !== "node" || state.panel.snap === "closed" ? 0 : Math.max(0, sheetHeight - 72) / scale;

  // auto-scroll até à seleção
  useEffect(() => {
    if (!state.selectedPath || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-sy-path="${CSS.escape(state.selectedPath)}"]`) as HTMLElement | null;
    if (!el) return;
    // Seção fixa fixada ao fundo (telemóvel) nunca rola com a página: não há nada para
    // levar à vista — quem a mostra é a subida junto da sheet (FixedShell).
    if (!isDesktop && el.closest("[data-ed-fixed]")) return;
    const container = scrollRef.current;
    const visibleH = isDesktop ? container.clientHeight : Math.max(0, container.clientHeight - sheetHeight - fixedHeight * scale);
    const r = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    const top = r.top - c.top + container.scrollTop;
    const target = top - Math.max(16, (visibleH - Math.min(r.height, visibleH)) / 2);
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [state.selectedPath, state.panel.snap, isDesktop, state.device]);

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto"
        onScroll={(e) => {
          const offset = Math.max(0, e.currentTarget.scrollTop / scale - (isDesktop ? 24 / scale : 0));
          frameRef.current?.style.setProperty("--ed-scroll-top", `${offset}px`);
          if (!state.ui.hintSeen) dispatch({ type: "markHintSeen" });
        }}
        onClick={() => dispatch({ type: "closePanel" })}
        style={{ paddingBottom: sheetPad }}
      >
        <div className={cn("mx-auto", isDesktop ? "py-6" : "")} style={{ width: logical * scale }}>
          <div ref={frameRef} className="relative origin-top-left bg-background shadow-ed-frame" style={{ width: logical, transform: `scale(${scale})`, transformOrigin: "top left", ["--ed-viewport-h" as string]: `${viewportH}px`, ["--ed-fixed-lift" as string]: `${fixedLiftPx}px`, ["--ed-fixed-viewport-h" as string]: `${fixedViewportH}px`, ["--ed-sheet-inset" as string]: `${sheetInsetPx}px`, ["--ed-scroll-top" as string]: "0px" } as React.CSSProperties}>
            <ThemeProvider
              value={{
                manifest: state.manifest,
                customization: state.draft,
                store: state.store,
                media: state.media,
                products: state.products,
                categories: state.categories,
                device: state.device,
                mode: "edit",
                showOverlays: state.ui.showOverlays && !isReadOnlyPreview(state),
                readOnly: isReadOnlyPreview(state),
                onCloseOverlay: () => dispatch({ type: "closeOverlay" }),
                selectedPath: state.selectedPath,
                onSelect: state.ui.showOverlays ? (path, title, context) => dispatch({ type: "select", path, title, context }) : undefined,
                onNavigateLink: (link: any) => dispatch({ type: "navigateLink", link }),
                onOpen: state.ui.showOverlays && !isDesktop ? (path, context) => dispatch({ type: "runOpen", path, context }) : undefined,
                previewState: state.previewState,
                previewOverlay: state.previewOverlay,
                previewQuery: state.previewQuery,
                previewProductId: state.previewProductId,
                viewportH,
                sheetInset: sheetInsetPx,
                pinFixedSections: !isDesktop,
                fixedHeight,
                onFixedHeightChange: setFixedHeight,
                overlayHost,
              }}
            >
              <ThemeRenderer themeId={state.manifest.id} pageId={state.page} />
            </ThemeProvider>
          </div>
        </div>
      </div>
      <div
        className={cn("pointer-events-none absolute z-40 overflow-hidden", isDesktop ? "top-6" : "top-0")}
        style={{ left: "50%", width: logical * scale, height: (isDesktop ? boxH - 48 : boxH - sheetHeight + 24), transform: "translateX(-50%)" }}
      >
        <div
          ref={setOverlayHost}
          style={{ position: "relative", width: logical, height: viewportH + (isDesktop ? 0 : 24 / scale), transform: `scale(${scale})`, transformOrigin: "top left" }}
        />
      </div>
      {page?.previewStates?.length || page?.previewNeeds === "search" ? (
        <div className={cn("absolute left-2 z-10 flex flex-col items-start gap-1.5", isDesktop ? "top-2" : "top-12")} onClick={(e) => e.stopPropagation()}>
          {page.previewStates?.length ? (
            <div className="flex gap-1 rounded-lg bg-background/95 p-1 shadow-md">
              {page.previewStates.map((ps) => (
                <button key={ps.id} onClick={() => dispatch({ type: "setPreviewState", id: ps.id })}
                  className={cn("rounded-md px-2.5 py-1 text-xs", state.previewState === ps.id ? "bg-foreground text-background" : "text-muted-foreground")}>{ps.label}</button>
              ))}
            </div>
          ) : null}
          {page.previewNeeds === "search" ? (
            <label className="flex items-center gap-1 rounded-lg bg-background/95 px-2 py-1 text-xs shadow-md">
              Pré-visualizar a pesquisa:
              <input className="w-24 rounded border border-border bg-background px-1" value={state.previewQuery} onChange={(e) => dispatch({ type: "setPreviewQuery", q: e.target.value })} />
            </label>
          ) : null}
        </div>
      ) : null}
      {overlay ? (
        <button className={cn("absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-foreground px-4 py-1.5 text-xs text-background shadow-lg", isDesktop ? "top-3" : "top-12")}
          onClick={(e) => { e.stopPropagation(); dispatch({ type: "closeOverlay" }); }}>
          Fechar {overlay.label.toLowerCase()} ✕
        </button>
      ) : null}
      {!isDesktop ? <OpenHint /> : null}
      {!state.ui.hintSeen && (isDesktop || state.panel.snap === "closed") ? (
        <div className={cn("pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs text-background shadow-lg", isDesktop ? "top-4" : "top-12")}>
          Toque numa parte da loja para editar
        </div>
      ) : null}
    </div>
  );
}

/** Dica única por sessão: aparece na primeira seleção de um elemento com ação de abrir. */
function OpenHint() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const has = !!openActionOf(state.manifest, state.draft, state.selectedPath);
  const show = has && !state.ui.openHintSeen;
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => dispatch({ type: "markOpenHintSeen" }), 3000);
    return () => clearTimeout(t);
  }, [show, dispatch]);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-12 z-30 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs text-background shadow-lg">
      Toque de novo para abrir
    </div>
  );
}

/* ------------------------------ Bottom sheet ------------------------------ */

const SNAP_RATIO = { peek: 0.4, medium: 0.7, expanded: 0.94 } as const;
const SNAP_ORDER = ["peek", "medium", "expanded"] as const;
const DRAG_DISTANCE = 48;
const DRAG_VELOCITY = 0.5;

function BottomSheet({ onHeightChange, fixedReserve }: { onHeightChange: (height: number) => void; fixedReserve: number }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startY: number; lastY: number; lastAt: number; velocity: number; baseHeight: number } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const open = state.panel.stack.length > 0 && state.panel.snap !== "closed";
  const activeTab = state.panel.stack[0]?.kind === "sections" || !state.panel.stack.length ? "sections" : "settings";
  const lateralPeek = Boolean(state.previewOverlay && state.panel.snap === "peek");
  const showContent = open || dragHeight !== null;
  const compact = lateralPeek && (dragHeight === null || dragHeight <= 76);
  const showPullHint = open && !state.ui.pullHintSeen;
  useEffect(() => {
    if (!showPullHint) return;
    const timer = window.setTimeout(() => dispatch({ type: "markPullHintSeen" }), 3000);
    return () => window.clearTimeout(timer);
  }, [showPullHint, dispatch]);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => onHeightChange(el.getBoundingClientRect().height));
    observer.observe(el);
    onHeightChange(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const onDown = (e: React.PointerEvent) => {
    if (!sheetRef.current) return;
    const now = performance.now();
    drag.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastAt: now,
      velocity: 0,
      baseHeight: sheetRef.current.getBoundingClientRect().height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const current = drag.current;
    const parentHeight = sheetRef.current?.parentElement?.clientHeight;
    if (!current || current.pointerId !== e.pointerId || !parentHeight) return;
    const now = performance.now();
    const elapsed = Math.max(1, now - current.lastAt);
    current.velocity = (e.clientY - current.lastY) / elapsed;
    current.lastY = e.clientY;
    current.lastAt = now;
    const nextHeight = Math.min(parentHeight * SNAP_RATIO.expanded, Math.max(72, current.baseHeight - (e.clientY - current.startY)));
    setDragHeight(nextHeight);
  };

  const onUp = (e: React.PointerEvent) => {
    const current = drag.current;
    if (!current || current.pointerId !== e.pointerId) return;
    const dy = e.clientY - current.startY;
    const intentional = Math.abs(dy) >= DRAG_DISTANCE || Math.abs(current.velocity) >= DRAG_VELOCITY;
    drag.current = null;
    setDragHeight(null);
    if (!intentional) return;

    if (!open) {
      if (dy < 0) dispatch({ type: "pushPanelRoot", frame: { kind: "sections", title: "Seções" } });
      return;
    }
    const idx = SNAP_ORDER.indexOf(state.panel.snap === "closed" ? "peek" : state.panel.snap);
    if (dy > 0 || current.velocity > DRAG_VELOCITY) {
      if (idx === 0) dispatch({ type: "closePanel" });
      else dispatch({ type: "setSnap", snap: SNAP_ORDER[idx - 1] });
      return;
    }
    dispatch({ type: "setSnap", snap: SNAP_ORDER[Math.min(SNAP_ORDER.length - 1, idx + 1)] });
  };

  const onCancel = () => {
    drag.current = null;
    setDragHeight(null);
  };

  const snappedHeight = lateralPeek ? "76px" : state.panel.snap === "closed" ? "0%" : `${SNAP_RATIO[state.panel.snap] * 100}%`;

  return (
    <div
      ref={sheetRef}
      className={cn("absolute inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl bg-background shadow-ed-sheet", dragHeight === null && "ed-sheet", !open && state.previewOverlay && "hidden")}
      style={{ height: dragHeight ?? (open ? snappedHeight : 72), minHeight: 72, maxHeight: `calc(100% - ${fixedReserve + 44}px)` }}
    >
      <div
        className="relative grid h-7 min-h-7 shrink-0 touch-none cursor-grab place-items-center active:cursor-grabbing"
        aria-label="Arrastar painel"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <div className={cn("h-1.5 w-7 rounded-full bg-muted-foreground/40", showPullHint && "ed-pull-hint")} />
        {showPullHint ? <span className="pointer-events-none absolute top-4 text-[10px] text-muted-foreground">Puxe para cima</span> : null}
      </div>
      {(!open || state.panel.stack[0]?.kind !== "node") ? (
        <>
          {open ? <Button size="icon" variant="ghost" className="ed-sheet-top-close size-7" aria-label="Fechar painel" onClick={() => dispatch({ type: "closePanel" })}><X className="size-4" /></Button> : null}
          <div className="grid h-9 min-h-9 shrink-0 grid-cols-2 items-center gap-1 px-10" role="tablist" aria-label="Editor da loja">
            {([ ["sections", "Secções"], ["settings", "Definições"] ] as const).map(([kind, title]) => (
              <Button key={kind} variant="ghost" role="tab" aria-selected={activeTab === kind} className={cn("h-9 rounded-lg px-1 text-sm", activeTab === kind ? "bg-accent text-primary font-semibold" : "text-muted-foreground")}
                onClick={() => dispatch({ type: "pushPanelRoot", frame: { kind, title } })}>{title}</Button>
            ))}
          </div>
        </>
      ) : null}
      {showContent ? <PanelContent mobileSheet compact={compact} previewClosed={!open} /> : null}
    </div>
  );
}

/* ------------------------------ Panel content ------------------------------ */

function EmptySidebar() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
      <Layers className="size-8 opacity-40" />
      Clique numa parte da loja para a editar, ou abra Seções / Configurações.
    </div>
  );
}

function breadcrumb(state: ReturnType<typeof useEditor>, frame: PanelFrame): { label: string; path?: string }[] {
  if (frame.kind !== "node") return [{ label: frame.title }];
  const p = parsePath(frame.path);
  if (!p || p.kind === "global") return [{ label: frame.title }];
  const type = sectionTypeOf(state.manifest, state.draft, p.sectionId!);
  const crumbs: { label: string; path?: string }[] = [{ label: type?.label ?? "Seção", path: sectionPath(p.sectionId!) }];
  const showItem = !!p.sectionId && blockIdsOf(state.manifest, state.draft, p.sectionId).length > 1;
  if ((p.kind === "block" || p.kind === "blockElement") && showItem) crumbs.push({ label: type?.blocks?.itemLabel ?? "Item", path: `sections.${p.sectionId}.blocks.${p.blockId}` });
  if (p.kind === "element" || p.kind === "blockElement") crumbs.push({ label: frame.title });
  return crumbs;
}

function goUpPath(state: ReturnType<typeof useEditor>, path: string): string | null {
  const p = parsePath(path);
  if (!p) return null;
  if (p.kind === "element") return sectionPath(p.sectionId!);
  if (p.kind === "block") return sectionPath(p.sectionId!);
  if (p.kind === "blockElement") {
    const count = blockIdsOf(state.manifest, state.draft, p.sectionId!).length;
    return count > 1 ? `sections.${p.sectionId}.blocks.${p.blockId}` : sectionPath(p.sectionId!);
  }
  return null;
}

function PanelContent({ mobileSheet = false, compact = false, previewClosed = false }: { mobileSheet?: boolean; compact?: boolean; previewClosed?: boolean } = {}) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const frame: PanelFrame | undefined = previewClosed ? { kind: "sections", title: "Secções" } : state.panel.stack[state.panel.stack.length - 1];
  if (!frame) return null;
  const crumbs = breadcrumb(state, frame);
  const canBack = state.panel.stack.length > 1 || (frame.kind === "node" && goUpPath(state, frame.path));

  const back = () => {
    if (state.panel.stack.length > 1) return dispatch({ type: "popPanel" });
    if (frame.kind === "node") {
      const up = goUpPath(state, frame.path);
      if (up) {
        const p = parsePath(up)!;
        const label = p.kind === "section" ? sectionTypeOf(state.manifest, state.draft, p.sectionId!)?.label ?? "Seção" : "Item";
        dispatch({ type: "select", path: up, title: label });
      }
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {frame.kind !== "sections" && frame.kind !== "settings" ? (
        <div className={cn("ed-panel-heading", mobileSheet && "ed-panel-heading-sheet")}>
          <div className="ed-panel-leading">{canBack ? <Button size="icon" variant="ghost" className="size-9" aria-label="Voltar" onClick={back}><ChevronLeft className="size-5" /></Button> : null}</div>
          <span className="truncate text-center text-sm font-semibold">{compact && state.previewOverlay ? state.manifest.overlays?.find((item) => item.id === state.previewOverlay)?.label.replace(" lateral", "") : crumbs[crumbs.length - 1]?.label}</span>
          <div className="ed-panel-actions">
            {frame.kind === "node" ? <NodeMenu path={frame.path} /> : null}
            <Button size="icon" variant="ghost" className="size-9" aria-label="Fechar painel" onClick={() => dispatch({ type: "closePanel" })}><X className="size-4" /></Button>
          </div>
        </div>
      ) : null}
      <div className={cn("min-h-0 flex-1 touch-pan-y overscroll-contain overflow-y-auto px-4 py-3", mobileSheet && "pb-[calc(2rem+env(safe-area-inset-bottom))]", mobileSheet && compact && "hidden")}>
        {frame.kind === "node" ? <NodePanel key={frame.path} path={frame.path} mobileSheet={mobileSheet} /> : null}
        {frame.kind === "sections" ? <SectionsPanel /> : null}
        {frame.kind === "settings" ? <SettingsMenu /> : null}
        {frame.kind === "settingsGroup" ? <GlobalGroupPanel groupId={frame.groupId} /> : null}
      </div>
    </div>
  );
}

function NodeMenu({ path }: { path: string }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const p = parsePath(path);
  const type = p?.sectionId ? sectionTypeOf(state.manifest, state.draft, p.sectionId) : undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-9" aria-label="Opções do elemento"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { dispatch({ type: "resetNode", path }); toast("Restaurado", { action: { label: "Desfazer", onClick: () => dispatch({ type: "undo" }) } }); }}>
          <RotateCcw className="size-4" /> Restaurar padrão
        </DropdownMenuItem>
        {p?.kind === "section" && type ? (
          <>
            {type.hideable ? <DropdownMenuItem onClick={() => dispatch({ type: "toggleHidden", sectionId: p.sectionId! })}><EyeOff className="size-4" /> Ocultar / mostrar</DropdownMenuItem> : null}
            {type.duplicable ? <DropdownMenuItem onClick={() => dispatch({ type: "duplicateSection", sectionId: p.sectionId! })}><Copy className="size-4" /> Duplicar</DropdownMenuItem> : null}
            {type.removable ? <DropdownMenuItem onClick={() => { dispatch({ type: "removeSection", sectionId: p.sectionId! }); dispatch({ type: "closePanel" }); toast("Seção removida", { action: { label: "Desfazer", onClick: () => dispatch({ type: "undo" }) } }); }}><Trash2 className="size-4" /> Remover</DropdownMenuItem> : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------ Sections panel ------------------------------ */

function SectionsPanel() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const [adding, setAdding] = useState(false);
  if (isReadOnlyPreview(state)) return <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Lock className="size-4" />{state.manifest.pages.find((page) => page.id === state.page)?.label}</div>;
  const ids = visibleSectionIds(state.manifest, state.draft, state.page);
  const overlays = (state.manifest.overlays ?? []).filter((o) => !o.requires || state.manifest.capabilities[o.requires]);

  const row = (id: string, locked: boolean, index?: number) => {
    const type = sectionTypeOf(state.manifest, state.draft, id);
    if (!type) return null;
    const hidden = state.draft.sections[id]?.hidden;
    const move = (dir: -1 | 1) => {
      const order = [...ids.page];
      const i = order.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      dispatch({ type: "reorderSections", order });
    };
    return (
      <div key={id} className={cn("flex items-center gap-1 rounded-lg border border-border bg-card px-2", hidden && "opacity-50")}>
        <button className="flex flex-1 items-center gap-2 py-2.5 text-left text-sm" onClick={() => dispatch({ type: "select", path: sectionPath(id), title: type.label })}>
          {type.label} {type.required ? <Lock className="size-3 text-muted-foreground" /> : null}
        </button>
        {!locked && index !== undefined ? (
          <>
            <Button size="icon" variant="ghost" className="size-8" disabled={index === 0} onClick={() => move(-1)} aria-label="Mover para cima"><ArrowUp className="size-4" /></Button>
            <Button size="icon" variant="ghost" className="size-8" disabled={index === ids.page.length - 1} onClick={() => move(1)} aria-label="Mover para baixo"><ArrowDown className="size-4" /></Button>
          </>
        ) : null}
        {type.hideable ? (
          <Button size="icon" variant="ghost" className="size-8" onClick={() => dispatch({ type: "toggleHidden", sectionId: id })} aria-label="Mostrar/ocultar">
            {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        ) : null}
        {type.removable ? (
          <Button size="icon" variant="ghost" className="size-8" aria-label="Remover" onClick={() => { dispatch({ type: "removeSection", sectionId: id }); toast("Seção removida", { action: { label: "Desfazer", onClick: () => dispatch({ type: "undo" }) } }); }}>
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    );
  };

  if (adding) return <AddSectionGallery onDone={() => setAdding(false)} />;

  return (
    <div className="space-y-4">
      <Group label="Topo">{ids.top.map((id) => row(id, true))}</Group>
      <Group label="Página">{ids.page.map((id, i) => row(id, false, i))}</Group>
      <Group label="Rodapé">{ids.bottom.map((id) => row(id, true))}</Group>
      {ids.fixed.length ? <Group label="Fixos">{ids.fixed.map((id) => row(id, true))}</Group> : null}
      {overlays.length ? (
        <Group label="Painéis">
          {overlays.map((o) => (
            <button key={o.id} className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm"
              onClick={() => dispatch({ type: "openOverlay", id: o.id })}>
              {o.label} <span className="text-muted-foreground">›</span>
            </button>
          ))}
        </Group>
      ) : null}
      <Button className="w-full" variant="outline" onClick={() => setAdding(true)}><Plus className="size-4" /> Adicionar seção</Button>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function AddSectionGallery({ onDone }: { onDone: () => void }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const ids = visibleSectionIds(state.manifest, state.draft, state.page);
  const count = (t: string) => ids.page.filter((id) => sectionTypeOf(state.manifest, state.draft, id)?.type === t).length;
  const types = state.manifest.sectionTypes.filter(
    (t) => t.scope === "page" && (!t.allowedPages || t.allowedPages.includes(state.page)) && (!t.requires || state.manifest.capabilities[t.requires]),
  );
  const sel = state.selectedPath ? parsePath(state.selectedPath) : null;
  const insertAt = sel?.sectionId && ids.page.includes(sel.sectionId) ? ids.page.indexOf(sel.sectionId) + 1 : undefined;

  return (
    <div className="space-y-3">
      <button className="flex items-center gap-1 text-sm text-muted-foreground" onClick={onDone}><ChevronLeft className="size-4" /> Voltar às seções</button>
      <div className="grid grid-cols-2 gap-2">
        {types.map((t) => {
          const full = t.maxInstances !== undefined && count(t.type) >= t.maxInstances;
          return (
            <button key={t.type} disabled={full}
              onClick={() => { dispatch({ type: "addSection", sectionType: t.type, index: insertAt }); toast("Seção adicionada", { action: { label: "Desfazer", onClick: () => dispatch({ type: "undo" }) } }); }}
              className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary disabled:opacity-40">
              <div className="mb-2 h-14 rounded-md bg-ed-thumb" />
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{full ? `Máximo de ${t.maxInstances}` : t.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

const GROUP_ICONS: Record<string, ReactNode> = {
  colors: <Palette className="size-4" />, typography: <Type className="size-4" />, style: <Sparkles className="size-4" />,
  layout: <LayoutTemplate className="size-4" />, behavior: <Zap className="size-4" />, responsive: <Smartphone className="size-4" />,
};

function SettingsMenu() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  return (
    <div className="space-y-1.5">
      {state.manifest.global.map((g) => (
        <button key={g.id} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left text-sm hover:bg-accent"
          onClick={() => dispatch({ type: "pushPanel", frame: { kind: "settingsGroup", groupId: g.id, title: g.label } })}>
          {GROUP_ICONS[g.id] ?? <Wrench className="size-4" />} {g.label}
        </button>
      ))}
    </div>
  );
}

function GlobalGroupPanel({ groupId }: { groupId: string }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  return (
    <div className="space-y-4">
      {groupId === "colors" ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paletas prontas</p>
          <div className="grid grid-cols-3 gap-2">
            {state.manifest.palettes.map((p) => (
              <button key={p.id} className="rounded-lg border border-border p-2 text-left hover:border-primary"
                onClick={() => {
                  dispatch({ type: "applyValues", entries: Object.entries(p.colors).map(([key, value]) => ({ path: "global.colors", key, value })) });
                  toast("Paleta aplicada", { action: { label: "Desfazer", onClick: () => dispatch({ type: "undo" }) } });
                }}>
                <div className="mb-1 flex h-6 overflow-hidden rounded">
                  {["background", "primary", "secondary", "surfaceAlt"].map((k) => <span key={k} className="flex-1" style={{ background: p.colors[k] }} />)}
                </div>
                <span className="text-xs">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <SettingsList path={`global.${groupId}`} />
    </div>
  );
}

/* ------------------------------ Inspector ------------------------------ */

function Inspector() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  return (
    <div className="fixed bottom-16 left-2 z-50 max-h-[50dvh] w-[min(420px,95vw)] overflow-auto rounded-lg border border-border bg-popover p-3 text-xs shadow-xl">
      <div className="mb-2 flex items-center justify-between font-semibold">
        Customização (só alterações)
        <button onClick={() => dispatch({ type: "toggleInspector" })}><X className="size-4" /></button>
      </div>
      <pre className="whitespace-pre-wrap break-all font-mono">{JSON.stringify(state.draft, null, 2)}</pre>
    </div>
  );
}
