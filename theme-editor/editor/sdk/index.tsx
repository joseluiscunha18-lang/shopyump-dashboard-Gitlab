import { X } from "lucide-react";
import { Button } from "@/theme-editor/ui/button";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type {
  CategoryLite,
  Customization,
  Device,
  MediaAsset,
  ProductLite,
  Store,
  ThemeManifest,
} from "../contracts/types";
import { resolveColor, resolveValue, settingsForPath } from "../core/resolve";
import { pickResponsive, type NodePath } from "../core/paths";

export interface ThemeContextValue {
  manifest: ThemeManifest;
  customization: Customization;
  store: Store;
  media: MediaAsset[];
  products: ProductLite[];
  categories: CategoryLite[];
  device: Device;
  mode: "edit" | "live";
  showOverlays: boolean;
  selectedPath?: NodePath;
  onSelect?: (path: NodePath, title: string, context?: Record<string, string>) => void;
  /** Segundo toque num elemento já selecionado. O editor decide se há ação declarada. */
  onOpen?: (path: NodePath, context?: Record<string, string>) => void;
  /** Navegação do preview a partir de um link (menu lateral, barra inferior). */
  onNavigateLink?: (link: any) => void;
  onCloseOverlay?: () => void;
  readOnly?: boolean;
  previewState?: string;
  previewOverlay?: string;
  previewQuery?: string;
  previewProductId?: string;
  viewportH?: number;
  sheetInset?: number;
  pinFixedSections?: boolean;
  fixedHeight?: number;
  onFixedHeightChange?: (height: number) => void;
  /** Camada estável do editor para modais que não devem acompanhar a rolagem da loja. */
  overlayHost?: HTMLElement | null;
}

/** Estado efémero do preview (nunca guardado). */
export function useEditorPreview() {
  const t = useTheme();
  return { productId: t.previewProductId, state: t.previewState, overlay: t.previewOverlay, query: t.previewQuery ?? "", viewportH: t.viewportH, sheetInset: t.sheetInset ?? 0, mode: t.mode, pinFixedSections: t.pinFixedSections, fixedHeight: t.fixedHeight ?? 0 };
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ value, children }: { value: ThemeContextValue; children: ReactNode }) {
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeContextValue {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useTheme fora do ThemeProvider");
  return v;
}

export function useDevice(): Device {
  return useTheme().device;
}

/** Todos os valores resolvidos de um nó (seção, elemento ou bloco). */
export function useNodeValues(path: NodePath): Record<string, any> {
  const { manifest, customization, device } = useTheme();
  return useMemo(() => {
    const defs = settingsForPath(manifest, customization, path);
    const out: Record<string, unknown> = {};
    for (const def of defs) out[def.key] = resolveValue(manifest, customization, path, def, device);
    return out;
  }, [manifest, customization, path, device]);
}

/** Cores globais já resolvidas (tokens incluídos). */
export function useColors(): Record<string, string> {
  const { manifest, customization, device } = useTheme();
  return useMemo(() => {
    const group = manifest.global.find((g) => g.id === "colors");
    const raw: Record<string, unknown> = {};
    for (const def of group?.settings ?? [])
      raw[def.key] = resolveValue(manifest, customization, "global.colors", def, device);
    const out: Record<string, string> = {};
    for (const k of Object.keys(raw)) out[k] = resolveColor(raw[k], raw);
    return out;
  }, [manifest, customization, device]);
}

export function useGlobalGroup(groupId: string): Record<string, any> {
  const { manifest, customization, device } = useTheme();
  return useMemo(() => {
    const group = manifest.global.find((g) => g.id === groupId);
    const out: Record<string, unknown> = {};
    for (const def of group?.settings ?? [])
      out[def.key] = resolveValue(manifest, customization, `global.${groupId}`, def, device);
    return out;
  }, [manifest, customization, groupId, device]);
}

export function useResponsive<T>(value: unknown): T {
  const device = useDevice();
  return pickResponsive<T>(value, device);
}

export function useMediaUrl(ref: unknown, fallback?: string): string | undefined {
  const { media } = useTheme();
  if (ref && typeof ref === "object" && "mediaId" in (ref as object)) {
    const id = (ref as { mediaId: string }).mediaId;
    return media.find((m) => m.id === id)?.url ?? fallback;
  }
  return fallback;
}

/** Envolve qualquer coisa selecionável no preview. */
export function Editable({
  path,
  label,
  children,
  className,
  style,
  as: As = "div",
  openContext,
}: {
  path: NodePath;
  label: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: any;
  /** Contexto da ação de abrir (ex.: { productId }). */
  openContext?: Record<string, string>;
}) {
  const { mode, selectedPath, onSelect, onOpen, showOverlays, readOnly } = useTheme();
  const selected = selectedPath === path;
  const handle = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "edit" || readOnly) return;
      e.preventDefault();
      e.stopPropagation();
      if (selected && onOpen) onOpen(path, openContext);
      else onSelect?.(path, label, openContext);
    },
    [mode, readOnly, onSelect, onOpen, selected, path, label, openContext],
  );

  if (mode === "live" || readOnly)
    return (
      <As data-sy-id={path} className={className} style={style}>
        {children}
      </As>
    );

  return (
    <As
      data-sy-path={path}
      onClick={handle}
      className={[
        "sy-editable",
        selected && showOverlays ? "sy-selected" : "",
        showOverlays ? "sy-hoverable" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
      {selected && showOverlays ? <span className="sy-tag">{label}</span> : null}
    </As>
  );
}

export function SectionShell({
  path,
  label,
  children,
  style,
  className,
}: {
  path: NodePath;
  label: string;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { mode, selectedPath, onSelect, showOverlays, readOnly } = useTheme();
  const selected = selectedPath === path;
  return (
    <section
      id={path}
      data-sy-path={path}
      onClick={(e) => {
        if (mode !== "edit" || readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(path, label);
      }}
      className={[
        "sy-section",
        mode === "edit" && showOverlays ? "sy-hoverable" : "",
        selected && showOverlays ? "sy-selected-section" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
      {mode === "edit" && showOverlays && selected ? <span className="sy-tag sy-tag-section">{label}</span> : null}
    </section>
  );
}

/** Seção fixa: colada ao fundo da área visível do preview (sticky no editor, fixed no live). */
export function FixedShell({ path, label, children, style }: { path: NodePath; label: string; children: ReactNode; style?: React.CSSProperties }) {
  const { mode, pinFixedSections, onFixedHeightChange, selectedPath } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  // Só a seção fixa que está a ser editada sobe com o painel (ver `--ed-fixed-lift`).
  const lifted = !!selectedPath && (selectedPath === path || selectedPath.startsWith(`${path}.`));
  useEffect(() => {
    const el = ref.current;
    if (!pinFixedSections || !el || !onFixedHeightChange) return;
    const measure = () => onFixedHeightChange(el.offsetHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => { observer.disconnect(); onFixedHeightChange(0); };
  }, [pinFixedSections, onFixedHeightChange]);
  if (mode === "edit" && pinFixedSections) {
    return (
      // Colada ao fundo do preview. Com o painel desta seção aberto (telemóvel), sobe tanto
      // quanto a sheet cresceu, para ficar visível ACIMA dela; ao fechar, volta ao fundo.
      // A sheet anima a altura e o preview acompanha-a quadro a quadro: sem transição própria.
      <div ref={ref} data-ed-fixed="" style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--ed-scroll-top, 0px) + var(--ed-fixed-viewport-h, var(--ed-viewport-h, 100vh)))", transform: lifted ? "translateY(calc(-100% - var(--ed-fixed-lift, 0px)))" : "translateY(-100%)", zIndex: 20 }}>
        <SectionShell path={path} label={label} style={style}>{children}</SectionShell>
      </div>
    );
  }
  const pos: React.CSSProperties =
    mode === "edit"
      ? { position: "sticky", bottom: "var(--ed-sheet-inset, 0px)", zIndex: 20 }
      : { position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20 };
  return (
    <SectionShell path={path} label={label} style={{ ...pos, ...style }}>
      {children}
    </SectionShell>
  );
}

/** Painel sobreposto: no editor só desenha quando aberto, ocupando a área visível. */
export function OverlayShell({
  id, path, label, side, width = 300, scrim = 40, children, style,
}: { id: string; path: NodePath; label: string; side: "left" | "right" | "bottom" | "full"; width?: number; scrim?: number; children: ReactNode; style?: React.CSSProperties }) {
  const { previewOverlay, mode, onCloseOverlay, overlayHost } = useTheme();
  if (previewOverlay !== id) return null;
  const panelPos: React.CSSProperties =
    side === "left" ? { left: 0, top: 0, bottom: 0, width } :
    side === "right" ? { right: 0, top: 0, bottom: 0, width } :
    side === "bottom" ? { left: 0, right: 0, bottom: 0, maxHeight: "80%" } : { inset: 0 };
  const content = (
    <div
      style={{ position: mode === "edit" ? "absolute" : "fixed", inset: 0, height: mode === "edit" ? "100%" : "100vh", zIndex: 40, pointerEvents: "auto" }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onCloseOverlay?.(); }}
        aria-label={`Fechar ${label} clicando fora`}
        data-overlay-scrim={id}
        style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${scrim / 100})` }}
      />
      <div className="ed-store-drawer" style={{ position: "absolute", overflowY: "auto", maxWidth: "100%", ...panelPos }}>
        <Button variant="ghost" size="icon" className="ed-store-drawer-close" aria-label={`Fechar ${label}`} onClick={(event) => { event.stopPropagation(); onCloseOverlay?.(); }}><X className="size-5" /></Button>
        <SectionShell path={path} label={label} style={{ minHeight: "100%", ...style }}>
          {children}
        </SectionShell>
      </div>
    </div>
  );
  return mode === "edit" && overlayHost ? createPortal(content, overlayHost) : content;
}
