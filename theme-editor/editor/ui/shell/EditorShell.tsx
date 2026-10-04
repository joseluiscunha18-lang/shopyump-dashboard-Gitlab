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
import { useEditor, useEditorDispatch, type PanelFrame } from "@/theme-editor/editor/core/store";
import { parsePath, sectionPath } from "@/theme-editor/editor/core/paths";
import { blockIdsOf, sectionTypeOf } from "@/theme-editor/editor/core/resolve";
import { ThemeProvider } from "@/theme-editor/editor/sdk";
import { DemoCommerceRenderer, visibleSectionIds } from "@/theme-editor/themes/demo-commerce/Renderer";
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
        <Preview isDesktop={isDesktop} />
        {isDesktop ? (
          <aside className="w-[380px] shrink-0 border-l border-border bg-background">
            {state.panel.stack.length ? <PanelContent /> : <EmptySidebar />}
          </aside>
        ) : (
          <BottomSheet />
        )}
      </div>
      <BottomBar isDesktop={isDesktop} hidden={!isDesktop && state.panel.stack.length > 0 && state.panel.snap !== "closed"} />
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
          {state.manifest.pages.map((p) => (
            <DropdownMenuItem key={p.id} disabled={!p.supported} onClick={() => dispatch({ type: "setPage", page: p.id })}>
              {p.label} {!p.supported ? <span className="ml-auto text-xs text-muted-foreground">Em breve</span> : null}
            </DropdownMenuItem>
          ))}
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

function Preview({ isDesktop }: { isDesktop: boolean }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(390);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const logical = WIDTH[state.device];
  const pad = isDesktop ? 48 : 0;
  const scale = Math.min(1, (avail - pad) / logical);
  const sheetPad = !isDesktop ? (state.panel.snap === "expanded" ? "94%" : state.panel.snap === "medium" ? "70%" : state.panel.snap === "peek" ? "50%" : "0px") : "0px";

  // auto-scroll até à seleção
  useEffect(() => {
    if (!state.selectedPath || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-sy-path="${CSS.escape(state.selectedPath)}"]`) as HTMLElement | null;
    if (!el) return;
    const container = scrollRef.current;
    const visibleH = isDesktop ? container.clientHeight : container.clientHeight * (state.panel.snap === "expanded" ? 0.06 : state.panel.snap === "medium" ? 0.3 : state.panel.snap === "peek" ? 0.5 : 1);
    const r = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    const top = r.top - c.top + container.scrollTop;
    const target = top - Math.max(16, (visibleH - Math.min(r.height, visibleH)) / 2);
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [state.selectedPath, state.panel.snap, isDesktop, state.device]);

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto" onClick={() => dispatch({ type: "closePanel" })} style={{ paddingBottom: sheetPad }}>
        <div className={cn("mx-auto", isDesktop ? "py-6" : "")} style={{ width: logical * scale }}>
          <div className="origin-top-left overflow-hidden bg-background shadow-ed-frame" style={{ width: logical, transform: `scale(${scale})`, transformOrigin: "top left" }}>
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
                showOverlays: state.ui.showOverlays,
                selectedPath: state.selectedPath,
                onSelect: state.ui.showOverlays ? (path, title) => dispatch({ type: "select", path, title }) : undefined,
              }}
            >
              <DemoCommerceRenderer pageId={state.page} />
            </ThemeProvider>
          </div>
        </div>
      </div>
      {!state.ui.hintSeen ? (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs text-background shadow-lg">
          Toque numa parte da loja para editar
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ Bottom sheet ------------------------------ */

const SNAP_RATIO = { peek: 0.5, medium: 0.7, expanded: 0.94 } as const;
const SNAP_ORDER = ["peek", "medium", "expanded"] as const;
const DRAG_DISTANCE = 48;
const DRAG_VELOCITY = 0.5;

function BottomSheet() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startY: number; lastY: number; lastAt: number; velocity: number; baseHeight: number } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const open = state.panel.stack.length > 0 && state.panel.snap !== "closed";

  const onDown = (e: React.PointerEvent) => {
    if (!sheetRef.current || !open) return;
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
    const nextHeight = Math.min(parentHeight * SNAP_RATIO.expanded, Math.max(0, current.baseHeight - (e.clientY - current.startY)));
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

  const snappedHeight = state.panel.snap === "closed" ? "0%" : `${SNAP_RATIO[state.panel.snap] * 100}%`;

  return (
    <div
      ref={sheetRef}
      className={cn("absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-border bg-background shadow-ed-sheet", dragHeight === null && "ed-sheet")}
      style={{ height: open ? (dragHeight ?? snappedHeight) : 0, visibility: open ? "visible" : "hidden" }}
    >
      <div
        className="touch-none cursor-grab px-4 pb-2 pt-3 active:cursor-grabbing"
        aria-label="Arrastar painel"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/40" />
      </div>
      {open ? <PanelContent /> : null}
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

function PanelContent() {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const frame = state.panel.stack[state.panel.stack.length - 1];
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
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        {canBack ? <Button size="icon" variant="ghost" className="size-9" onClick={back}><ChevronLeft className="size-5" /></Button> : null}
        <div className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1 truncate">
              {i > 0 ? <span className="text-muted-foreground">›</span> : null}
              <button className={cn("truncate", i === crumbs.length - 1 ? "font-semibold" : "text-muted-foreground")}
                onClick={() => c.path && dispatch({ type: "select", path: c.path, title: c.label })}>{c.label}</button>
            </span>
          ))}
        </div>
        {frame.kind === "node" ? <NodeMenu path={frame.path} /> : null}
        <Button size="icon" variant="ghost" className="size-9" onClick={() => dispatch({ type: "closePanel" })}><X className="size-4" /></Button>
      </div>
      <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-3">
        {frame.kind === "node" ? <NodePanel key={frame.path} path={frame.path} /> : null}
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
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-9"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
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
  const ids = visibleSectionIds(state.manifest, state.draft, state.page);

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
