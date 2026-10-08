import { linkToPage, pageAvailable, resolveOpenTarget } from "./openAction";
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  CategoryLite,
  Customization,
  Device,
  MediaAsset,
  PageId,
  ProductLite,
  SectionInstanceDef,
  Store,
  StorePageLite,
  ThemeManifest,
} from "../contracts/types";
import { writeBagKey, type NodePath, readBag, parsePath } from "./paths";
import { blockIdsOf, defaultValue, isDefaultValue, sectionTypeOf, settingsForPath } from "./resolve";

export type Snap = "closed" | "peek" | "medium" | "expanded";

export type PanelFrame =
  | { kind: "node"; path: NodePath; title: string }
  | { kind: "sections"; title: string }
  | { kind: "settings"; title: string }
  | { kind: "settingsGroup"; groupId: string; title: string };

export interface EditorData {
  manifest: ThemeManifest;
  store: Store;
  media: MediaAsset[];
  products: ProductLite[];
  categories: CategoryLite[];
  pages: StorePageLite[];
}

export interface EditorState extends EditorData {
  saved: Customization;
  draft: Customization;
  page: PageId;
  previewProductId?: string | undefined;
  previewState?: string | undefined;
  previewOverlay?: string | undefined;
  previewQuery: string;
  device: Device;
  panel: { stack: PanelFrame[]; snap: Snap };
  selectedPath?: NodePath | undefined;
  selectedContext?: Record<string, string> | undefined;
  previewProductIdX?: undefined;
  history: { past: Customization[]; future: Customization[] };
  save: { status: "saved" | "dirty" | "saving" | "savedNow" | "error"; error?: string };
  ui: { showOverlays: boolean; hintSeen: boolean; inspectorOpen: boolean; openHintSeen?: boolean; pullHintSeen?: boolean };
}

export type Action =
  | { type: "setValue"; path: NodePath; key: string; value: unknown; gestureId?: string }
  | { type: "resetKey"; path: NodePath; key: string }
  | { type: "resetNode"; path: NodePath }
  | { type: "resetAll" }
  | { type: "applyValues"; entries: { path: NodePath; key: string; value: unknown }[] }
  | { type: "toggleHidden"; sectionId: string }
  | { type: "reorderSections"; order: string[] }
  | { type: "addSection"; sectionType: string; index?: number }
  | { type: "duplicateSection"; sectionId: string }
  | { type: "removeSection"; sectionId: string }
  | { type: "addBlock"; sectionId: string }
  | { type: "duplicateBlock"; sectionId: string; blockId: string }
  | { type: "removeBlock"; sectionId: string; blockId: string }
  | { type: "toggleBlockHidden"; sectionId: string; blockId: string }
  | { type: "reorderBlocks"; sectionId: string; order: string[] }
  | { type: "setPage"; page: PageId }
  | { type: "navigateLink"; link: any }
  | { type: "setPreviewProduct"; id: string }
  | { type: "setPreviewState"; id: string }
  | { type: "setPreviewQuery"; q: string }
  | { type: "openOverlay"; id: string }
  | { type: "closeOverlay" }
  | { type: "setDevice"; device: Device }
  | { type: "select"; path: NodePath; title: string; context?: Record<string, string> }
  | { type: "runOpen"; path: NodePath; context?: Record<string, string> }
  | { type: "markOpenHintSeen" }
  | { type: "markPullHintSeen" }
  | { type: "pushPanel"; frame: PanelFrame }
  | { type: "pushPanelRoot"; frame: PanelFrame }
  | { type: "popPanel" }
  | { type: "closePanel" }
  | { type: "setSnap"; snap: Snap }
  | { type: "toggleOverlays" }
  | { type: "markHintSeen" }
  | { type: "toggleInspector" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "saveStart" }
  | { type: "saveOk" }
  | { type: "saveSettled" }
  | { type: "saveError"; error: string }
  | { type: "addMedia"; asset: MediaAsset };

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

let lastGesture: string | undefined;

function withHistory(state: EditorState, next: Customization, gestureId?: string): EditorState {
  const sameGesture = gestureId !== undefined && gestureId === lastGesture;
  lastGesture = gestureId;
  return {
    ...state,
    draft: next,
    history: {
      past: sameGesture ? state.history.past : [...state.history.past, state.draft].slice(-50),
      future: [],
    },
    save: { status: "dirty" },
  };
}

function pruneEmpty(c: Customization, path: NodePath) {
  const p = parsePath(path);
  if (!p) return;
  if (p.kind === "global") {
    if (c.global[p.groupId!] && Object.keys(c.global[p.groupId!]!).length === 0) delete c.global[p.groupId!];
    return;
  }
  const sec = c.sections[p.sectionId!];
  if (!sec) return;
  if (sec.settings && Object.keys(sec.settings).length === 0) delete sec.settings;
  if (sec.elements) {
    for (const k of Object.keys(sec.elements))
      if (Object.keys(sec.elements[k]).length === 0) delete sec.elements[k];
    if (Object.keys(sec.elements).length === 0) delete sec.elements;
  }
  if (sec.blocks?.items) {
    for (const item of Object.values(sec.blocks.items)) {
      if (item.settings && Object.keys(item.settings).length === 0) delete item.settings;
      if (item.elements) {
        for (const key of Object.keys(item.elements)) {
          if (Object.keys(item.elements[key]).length === 0) delete item.elements[key];
        }
        if (Object.keys(item.elements).length === 0) delete item.elements;
      }
    }
  }
}

function normalizeValue(manifest: ThemeManifest, custom: Customization, path: NodePath, key: string, value: unknown) {
  const def = settingsForPath(manifest, custom, path).find((setting) => setting.key === key);
  return def && isDefaultValue(value, def, defaultValue(manifest, custom, path, def)) ? undefined : value;
}

function normalizeCustomization(manifest: ThemeManifest, source: Customization): Customization {
  const custom = clone(source);
  const paths: NodePath[] = manifest.global.map((group) => `global.${group.id}`);
  for (const [sectionId, section] of Object.entries(custom.sections)) {
    paths.push(`sections.${sectionId}.settings`);
    for (const elementId of Object.keys(section.elements ?? {})) paths.push(`sections.${sectionId}.elements.${elementId}`);
    for (const [blockId, block] of Object.entries(section.blocks?.items ?? {})) {
      paths.push(`sections.${sectionId}.blocks.${blockId}`);
      for (const elementId of Object.keys(block.elements ?? {})) {
        paths.push(`sections.${sectionId}.blocks.${blockId}.elements.${elementId}`);
      }
    }
  }
  for (const path of paths) {
    const bag = readBag(custom, path);
    if (!bag) continue;
    const defs = settingsForPath(manifest, custom, path);
    for (const [key, value] of Object.entries(bag)) {
      const def = defs.find((setting) => setting.key === key);
      if (def && isDefaultValue(value, def, defaultValue(manifest, custom, path, def))) writeBagKey(custom, path, key, undefined);
    }
    pruneEmpty(custom, path);
  }
  return custom;
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

function pageOrder(state: EditorState, draft: Customization, page: PageId): string[] {
  const existing = draft.structure.pages[page]?.order;
  if (existing) return existing;
  const def = state.manifest.pages.find((p) => p.id === page);
  return (def?.sections ?? []).map((s) => s.id);
}

export function isReadOnlyPreview(state: Pick<EditorState, "page" | "previewOverlay" | "manifest">): boolean {
  if (state.previewOverlay) return false;
  const page = state.manifest.pages.find((item) => item.id === state.page);
  return page?.kind === "account" || page?.kind === "cart" || state.page === "profile";
}

export function reducer(state: EditorState, action: Action): EditorState {
  const editingActions = ["select", "setValue", "applyValues", "resetKey", "resetNode", "resetAll", "toggleHidden", "reorderSections", "addSection", "duplicateSection", "removeSection", "addBlock", "duplicateBlock", "removeBlock", "toggleBlockHidden", "reorderBlocks"];
  if (isReadOnlyPreview(state) && editingActions.includes(action.type)) return state;
  switch (action.type) {
    case "setValue": {
      const next = clone(state.draft);
      writeBagKey(next, action.path, action.key, normalizeValue(state.manifest, next, action.path, action.key, action.value));
      pruneEmpty(next, action.path);
      return withHistory(state, next, action.gestureId);
    }
    case "applyValues": {
      const next = clone(state.draft);
      for (const e of action.entries) {
        writeBagKey(next, e.path, e.key, normalizeValue(state.manifest, next, e.path, e.key, e.value));
        pruneEmpty(next, e.path);
      }
      return withHistory(state, next);
    }
    case "resetKey": {
      const next = clone(state.draft);
      writeBagKey(next, action.path, action.key, undefined);
      pruneEmpty(next, action.path);
      return withHistory(state, next);
    }
    case "resetNode": {
      const next = clone(state.draft);
      const bag = readBag(next, action.path);
      if (bag) for (const k of Object.keys(bag ?? {})) writeBagKey(next, action.path, k, undefined);
      pruneEmpty(next, action.path);
      return withHistory(state, next);
    }
    case "resetAll": {
      const next: Customization = {
        schemaVersion: 1,
        themeId: state.manifest.id,
        themeVersion: state.manifest.version,
        global: {},
        structure: { pages: {} },
        sections: {},
      };
      return withHistory(state, next);
    }
    case "toggleHidden": {
      const next = clone(state.draft);
      const sec = (next.sections[action.sectionId] = next.sections[action.sectionId] ?? {});
      sec.hidden = !sec.hidden;
      return withHistory(state, next);
    }
    case "reorderSections": {
      const next = clone(state.draft);
      next.structure.pages[state.page] = {
        ...(next.structure.pages[state.page] ?? {}),
        order: action.order,
      };
      return withHistory(state, next);
    }
    case "addSection": {
      const next = clone(state.draft);
      const id = newId(action.sectionType);
      const entry: SectionInstanceDef = { id, type: action.sectionType };
      const page = (next.structure.pages[state.page] = next.structure.pages[state.page] ?? {});
      page.added = [...(page.added ?? []), entry];
      const order = pageOrder(state, next, state.page);
      const at = action.index ?? order.length;
      page.order = [...order.slice(0, at), id, ...order.slice(at)];
      next.sections[id] = { type: action.sectionType };
      return {
        ...withHistory(state, next),
        selectedPath: `sections.${id}.settings`,
        panel: { stack: [{ kind: "node", path: `sections.${id}.settings`, title: "Nova seção" }], snap: "peek" },
      };
    }
    case "duplicateSection": {
      const next = clone(state.draft);
      const type = sectionTypeOf(state.manifest, state.draft, action.sectionId);
      if (!type) return state;
      const id = newId(type.type);
      next.sections[id] = { ...clone(next.sections[action.sectionId] ?? {}), type: type.type };
      const page = (next.structure.pages[state.page] = next.structure.pages[state.page] ?? {});
      page.added = [...(page.added ?? []), { id, type: type.type }];
      const order = pageOrder(state, next, state.page);
      const at = order.indexOf(action.sectionId) + 1;
      page.order = [...order.slice(0, at), id, ...order.slice(at)];
      return withHistory(state, next);
    }
    case "removeSection": {
      const next = clone(state.draft);
      const page = (next.structure.pages[state.page] = next.structure.pages[state.page] ?? {});
      page.order = pageOrder(state, next, state.page).filter((i) => i !== action.sectionId);
      page.added = (page.added ?? []).filter((s) => s.id !== action.sectionId);
      page.removed = [...new Set([...(page.removed ?? []), action.sectionId])];
      return { ...withHistory(state, next), selectedPath: undefined };
    }
    case "addBlock": {
      const next = clone(state.draft);
      const ids = blockIdsOf(state.manifest, next, action.sectionId);
      const sec = (next.sections[action.sectionId] = next.sections[action.sectionId] ?? {});
      sec.blocks = sec.blocks ?? {};
      sec.blocks.order = [...ids, newId("item")];
      return withHistory(state, next);
    }
    case "duplicateBlock": {
      const next = clone(state.draft);
      const ids = blockIdsOf(state.manifest, next, action.sectionId);
      const sec = (next.sections[action.sectionId] = next.sections[action.sectionId] ?? {});
      sec.blocks = sec.blocks ?? {};
      sec.blocks.items = sec.blocks.items ?? {};
      const id = newId("item");
      sec.blocks.items[id] = clone(sec.blocks.items[action.blockId] ?? {});
      const at = ids.indexOf(action.blockId) + 1;
      sec.blocks.order = [...ids.slice(0, at), id, ...ids.slice(at)];
      return withHistory(state, next);
    }
    case "removeBlock": {
      const next = clone(state.draft);
      const ids = blockIdsOf(state.manifest, next, action.sectionId);
      const sec = (next.sections[action.sectionId] = next.sections[action.sectionId] ?? {});
      sec.blocks = sec.blocks ?? {};
      sec.blocks.order = ids.filter((i) => i !== action.blockId);
      if (sec.blocks.items) delete sec.blocks.items[action.blockId];
      return withHistory(state, next);
    }
    case "toggleBlockHidden": {
      const next = clone(state.draft);
      const sec = (next.sections[action.sectionId] = next.sections[action.sectionId] ?? {});
      sec.blocks = sec.blocks ?? {};
      sec.blocks.order = sec.blocks.order ?? blockIdsOf(state.manifest, next, action.sectionId);
      sec.blocks.items = sec.blocks.items ?? {};
      const item = (sec.blocks.items[action.blockId] = sec.blocks.items[action.blockId] ?? {});
      item.hidden = !item.hidden;
      return withHistory(state, next);
    }
    case "reorderBlocks": {
      const next = clone(state.draft);
      const sec = (next.sections[action.sectionId] = next.sections[action.sectionId] ?? {});
      sec.blocks = sec.blocks ?? {};
      sec.blocks.order = action.order;
      return withHistory(state, next);
    }
    case "setPage": {
      const pg = state.manifest.pages.find((p) => p.id === action.page);
      return { ...state, page: action.page, previewState: pg?.previewStates?.[0]?.id, previewOverlay: undefined, selectedPath: undefined, selectedContext: undefined, panel: { stack: [], snap: "closed" } };
    }
    case "setPreviewState":
      return { ...state, previewState: action.id };
    case "setPreviewQuery":
      return { ...state, previewQuery: action.q };
    case "openOverlay": {
      const overlay = state.manifest.overlays?.find((item) => item.id === action.id);
      const sectionId = overlay?.sectionIds[0];
      if (!overlay || !sectionId) return state;
      const path = `sections.${sectionId}.settings`;
      return {
        ...state,
        previewOverlay: action.id,
        selectedPath: path,
        selectedContext: undefined,
        ui: { ...state.ui, hintSeen: true },
        panel: { stack: [{ kind: "node", path, title: overlay.label }], snap: "peek" },
      };
    }
    case "closeOverlay":
      return { ...state, previewOverlay: undefined, selectedPath: undefined, selectedContext: undefined, panel: { stack: [], snap: "closed" } };
    case "setPreviewProduct":
      return { ...state, previewProductId: action.id };
    case "setDevice":
      return { ...state, device: action.device };
    case "select": {
      let overlay = state.previewOverlay;
      if (overlay) {
        const ov = state.manifest.overlays?.find((o) => o.id === overlay);
        const sid = parsePath(action.path)?.sectionId;
        if (!ov || !sid || !ov.sectionIds.includes(sid)) overlay = undefined;
      }
      return {
        ...state,
        previewOverlay: overlay,
        selectedPath: action.path,
        selectedContext: action.context,
        ui: { ...state.ui, hintSeen: true },
        panel: { stack: [{ kind: "node", path: action.path, title: action.title }], snap: "peek" },
      };
    }
    case "pushPanel":
      return { ...state, panel: { stack: [...state.panel.stack, action.frame], snap: state.panel.stack.length ? state.panel.snap : "peek" } };
    case "pushPanelRoot":
      return { ...state, panel: { stack: [action.frame], snap: "peek" } };
    case "popPanel": {
      const stack = state.panel.stack.slice(0, -1);
      const top = stack[stack.length - 1];
      return {
        ...state,
        selectedPath: top && top.kind === "node" ? top.path : undefined,
        panel: { stack, snap: stack.length ? state.panel.snap : "closed" },
      };
    }
    case "closePanel":
      return { ...state, selectedPath: undefined, previewOverlay: undefined, panel: { stack: [], snap: "closed" } };
    case "setSnap":
      return { ...state, panel: { ...state.panel, snap: action.snap } };
    case "toggleOverlays":
      return { ...state, ui: { ...state.ui, showOverlays: !state.ui.showOverlays } };
    case "runOpen": {
      const t = resolveOpenTarget(state.manifest, state.draft, action.path, state.device, action.context ?? state.selectedContext);
      if (!t || t.kind === "unavailable") return state;
      if (t.kind === "overlay") return reducer(state, { type: "openOverlay", id: t.id });
      const next = reducer(state, { type: "setPage", page: t.page });
      const pid = t.productId ?? next.previewProductId ?? state.products[0]?.id;
      return { ...next, previewProductId: pid };
    }
    case "navigateLink": {
      const d = linkToPage(action.link);
      if (!d || !pageAvailable(state.manifest, d.page)) return state;
      const next = reducer({ ...state, previewOverlay: undefined }, { type: "setPage", page: d.page });
      return { ...next, previewOverlay: undefined, previewProductId: d.productId ?? next.previewProductId ?? state.products[0]?.id };
    }
    case "markOpenHintSeen":
      return { ...state, ui: { ...state.ui, openHintSeen: true } };
    case "markPullHintSeen":
      return { ...state, ui: { ...state.ui, pullHintSeen: true } };
    case "markHintSeen":
      return { ...state, ui: { ...state.ui, hintSeen: true } };
    case "toggleInspector":
      return { ...state, ui: { ...state.ui, inspectorOpen: !state.ui.inspectorOpen } };
    case "undo": {
      const past = state.history.past;
      if (!past.length) return state;
      lastGesture = undefined;
      return {
        ...state,
        draft: past[past.length - 1],
        history: { past: past.slice(0, -1), future: [state.draft, ...state.history.future] },
        save: { status: "dirty" },
      };
    }
    case "redo": {
      const [first, ...rest] = state.history.future;
      if (!first) return state;
      lastGesture = undefined;
      return {
        ...state,
        draft: first,
        history: { past: [...state.history.past, state.draft], future: rest },
        save: { status: "dirty" },
      };
    }
    case "saveStart":
      return { ...state, save: { status: "saving" } };
    case "saveOk":
      return { ...state, saved: state.draft, save: { status: "savedNow" } };
    case "saveSettled":
      return state.save.status === "savedNow" ? { ...state, save: { status: "saved" } } : state;
    case "saveError":
      return { ...state, save: { status: "error", error: action.error } };
    case "addMedia":
      return { ...state, media: [action.asset, ...state.media] };
    default:
      return state;
  }
}

/**
 * Dispositivo com que o editor arranca: o do próprio aparelho de quem edita.
 * Telemóvel → pré-visualização de telemóvel e controlos só de telemóvel; ecrã
 * grande → computador. Os outros continuam a um toque (seletor do topo).
 * Mesmos limites do shell (`useIsDesktop` = 1024px).
 */
export function detectDevice(): Device {
  if (typeof window === "undefined") return "mobile";
  const w = window.innerWidth;
  return w >= 1024 ? "desktop" : w >= 640 ? "tablet" : "mobile";
}

export function initialState(data: EditorData, customization: Customization): EditorState {
  const firstSupported = data.manifest.pages.find((p) => p.supported)?.id ?? "home";
  const normalized = normalizeCustomization(data.manifest, customization);
  return {
    ...data,
    saved: normalized,
    draft: normalized,
    page: firstSupported,
    previewProductId: data.products[0]?.id,
    previewState: data.manifest.pages.find((p) => p.id === firstSupported)?.previewStates?.[0]?.id,
    previewQuery: "camisa",
    device: detectDevice(),
    panel: { stack: [], snap: "closed" },
    history: { past: [], future: [] },
    save: { status: "saved" },
    ui: { showOverlays: true, hintSeen: false, inspectorOpen: false },
  };
}

// Contexts estáveis entre recargas (HMR) para o Provider e os consumidores partilharem a mesma instância.
const ctxStore = globalThis as unknown as {
  __syEditorStateCtx?: import("react").Context<EditorState | null>;
  __syEditorDispatchCtx?: import("react").Context<Dispatch<Action> | null>;
};
const StateCtx = (ctxStore.__syEditorStateCtx ??= createContext<EditorState | null>(null));
const DispatchCtx = (ctxStore.__syEditorDispatchCtx ??= createContext<Dispatch<Action> | null>(null));

export function EditorProvider({
  data,
  customization,
  children,
}: {
  data: EditorData;
  customization: Customization;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { data, customization }, (a) =>
    initialState(a.data, a.customization),
  );
  const value = useMemo(() => state, [state]);
  return (
    <StateCtx.Provider value={value}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useEditor(): EditorState {
  const s = useContext(StateCtx);
  if (!s) throw new Error("useEditor fora do EditorProvider");
  return s;
}

export function useEditorDispatch(): Dispatch<Action> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error("useEditorDispatch fora do EditorProvider");
  return d;
}
