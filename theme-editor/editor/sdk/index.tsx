import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
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
  onSelect?: (path: NodePath, title: string) => void;
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
}: {
  path: NodePath;
  label: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: any;
}) {
  const { mode, selectedPath, onSelect, showOverlays } = useTheme();
  const selected = selectedPath === path;
  const handle = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "edit") return;
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(path, label);
    },
    [mode, onSelect, path, label],
  );

  if (mode === "live")
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
  const { mode, selectedPath, onSelect, showOverlays } = useTheme();
  const selected = selectedPath === path;
  return (
    <section
      id={path}
      data-sy-path={path}
      onClick={(e) => {
        if (mode !== "edit") return;
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
