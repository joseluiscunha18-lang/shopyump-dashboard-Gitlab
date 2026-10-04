import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff, Copy, Trash2, Plus, MoreHorizontal, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/theme-editor/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/theme-editor/ui/dropdown-menu";
import { useEditor, useEditorDispatch } from "@/theme-editor/editor/core/store";
import { blockElementPath, blockPath, elementPath, parsePath, sectionPath, type NodePath } from "@/theme-editor/editor/core/paths";
import {
  blockIdsOf,
  blockTypeOf,
  hasOverride,
  isSettingVisible,
  resolveValue,
  sectionTypeOf,
  settingsForPath,
} from "@/theme-editor/editor/core/resolve";
import type { SettingDef } from "@/theme-editor/editor/contracts/types";
import { ControlRow } from "../controls/Controls";

const GROUP_LABELS: Record<string, string> = {
  layout: "Layout",
  spacing: "Espaçamento",
  typography: "Tipografia",
  appearance: "Aparência",
  responsive: "Responsivo",
  behavior: "Comportamento",
  advanced: "Avançado",
  content: "Conteúdo",
};
const GROUP_ORDER = ["layout", "spacing", "typography", "appearance", "responsive", "behavior", "advanced", "content"];

export function SettingsList({ path }: { path: NodePath }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const [moreOpen, setMoreOpen] = useState(false);
  const defs = settingsForPath(state.manifest, state.draft, path);
  const p = parsePath(path);
  const blockCount = p?.sectionId ? blockIdsOf(state.manifest, state.draft, p.sectionId).length : 0;
  const values: Record<string, unknown> = {};
  for (const d of defs) values[d.key] = resolveValue(state.manifest, state.draft, path, d, state.device);
  const visible = defs.filter((d) => isSettingVisible(d, state.manifest, values, blockCount));
  const basic = visible.filter((d) => d.tier === "basic" && d.control !== "colorScheme");
  const basicColorSchemes = visible.filter((d) => d.tier === "basic" && d.control === "colorScheme");
  const advanced = visible.filter((d) => d.tier === "advanced");
  const groups = GROUP_ORDER.map((g) => ({ g, items: advanced.filter((d) => (d.group ?? "advanced") === g) })).filter(
    (x) => x.items.length,
  );

  return (
    <div>
      {basic.map((d) => (
        <ControlRow key={d.key} def={d} path={path} />
      ))}
      {basicColorSchemes.map((d) => (
        <ControlRow key={d.key} def={d} path={path} />
      ))}
      {groups.length ? (
        <div className="mt-3 border-t border-border pt-2">
          <button
            className="flex w-full items-center gap-2 py-2 text-sm font-semibold"
            onClick={() => {
              const opening = !moreOpen;
              setMoreOpen(opening);
              if (opening && state.panel.snap === "peek") dispatch({ type: "setSnap", snap: "medium" });
            }}
          >
            {moreOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />} Mais opções
          </button>
          {moreOpen
            ? groups.map(({ g, items }) => (
                <Group key={g} label={GROUP_LABELS[g]} items={items} path={path} onReset={() => {
                  for (const d of items) dispatch({ type: "resetKey", path, key: d.key });
                }} />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

function Group({ label, items, path, onReset }: { label: string; items: SettingDef[]; path: NodePath; onReset: () => void }) {
  const { manifest, draft } = useEditor();
  const [open, setOpen] = useState(false);
  const changed = items.some((d) => hasOverride(manifest, draft, path, d));
  return (
    <div className="border-b border-border/60">
      <div className="flex items-center justify-between">
        <button className="flex flex-1 items-center gap-2 py-2.5 text-sm" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          {label}
          {changed ? <span className="size-1.5 rounded-full bg-primary" /> : null}
        </button>
        {changed ? (
          <button className="text-xs text-muted-foreground underline" onClick={onReset}>
            Restaurar grupo
          </button>
        ) : null}
      </div>
      {open ? <div className="pb-2 pl-1">{items.map((d) => <ControlRow key={d.key} def={d} path={path} />)}</div> : null}
    </div>
  );
}

function elementPreview(state: ReturnType<typeof useEditor>, path: NodePath, kind: string) {
  const defs = settingsForPath(state.manifest, state.draft, path);
  if (kind === "image" || kind === "logo") {
    const imageDef = defs.find((def) => def.key === "image");
    const ref = imageDef ? resolveValue<{ mediaId?: string } | null>(state.manifest, state.draft, path, imageDef, state.device) : null;
    return { imageUrl: ref?.mediaId ? state.media.find((asset) => asset.id === ref.mediaId)?.url : undefined, text: "Imagem" };
  }
  const key = kind === "button" ? "label" : "text";
  const def = defs.find((item) => item.key === key);
  const value = def ? resolveValue(state.manifest, state.draft, path, def, state.device) : undefined;
  return { text: typeof value === "string" && value.trim() ? value : undefined };
}

function ElementRow({ path, label, kind }: { path: NodePath; label: string; kind: string }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const preview = elementPreview(state, path, kind);
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left hover:bg-accent"
      onClick={() => dispatch({ type: "select", path, title: label })}
    >
      {kind === "image" || kind === "logo" ? (
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded border border-border bg-muted">
          {preview.imageUrl ? <img src={preview.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4 text-muted-foreground" />}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {preview.text ? <span className="block truncate text-xs text-muted-foreground">{preview.text}</span> : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Painel de um nó selecionado (seção, elemento, bloco). */
export function NodePanel({ path }: { path: NodePath }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const p = parsePath(path);
  if (!p) return null;

  const content = <SettingsList path={path} />;

  if (p.kind === "section") {
    const type = sectionTypeOf(state.manifest, state.draft, p.sectionId!);
    if (!type) return null;
    const ids = blockIdsOf(state.manifest, state.draft, p.sectionId!);
    return (
      <div className="space-y-4">
        {type.elements.length ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Elementos</p>
            <div className="space-y-1">
              {type.elements.map((el) => <ElementRow key={el.id} path={elementPath(p.sectionId!, el.id)} label={el.label} kind={el.kind} />)}
            </div>
          </div>
        ) : null}
        {type.blocks ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {type.blocks.itemLabelPlural} ({ids.length} de {type.blocks.max})
            </p>
            <div className="space-y-1">
              {ids.map((b, i) => {
                const hidden = state.draft.sections[p.sectionId!]?.blocks?.items?.[b]?.hidden;
                const bt = blockTypeOf(state.manifest, state.draft, p.sectionId!, b);
                const label = `${type.blocks!.itemLabel} ${i + 1}`;
                let summary = "";
                let thumbnail: string | undefined;
                const imageEl = bt?.elements.find((el) => el.kind === "image" || el.kind === "logo");
                if (imageEl) {
                  const imagePath = blockElementPath(p.sectionId!, b, imageEl.id);
                  thumbnail = elementPreview(state, imagePath, imageEl.kind).imageUrl;
                }
                if (bt?.labelKey) {
                  const el = bt.elements.find((e) => e.id === bt.labelKey);
                  const defs = el ? settingsForPath(state.manifest, state.draft, blockElementPath(p.sectionId!, b, el.id)) : [];
                  const td = defs.find((d) => d.key === "text");
                  if (td) {
                    const t = resolveValue<string>(state.manifest, state.draft, blockElementPath(p.sectionId!, b, el!.id), td, state.device);
                    if (t) summary = t;
                  }
                }
                return (
                  <div
                    key={b}
                    className={`flex items-center gap-1 rounded-md border border-border px-2 ${hidden ? "opacity-50" : ""}`}
                    draggable={ids.length > 1}
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", b)}
                    onDragOver={(event) => ids.length > 1 && event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const from = event.dataTransfer.getData("text/plain");
                      if (!from || from === b) return;
                      const order = [...ids];
                      const fromIndex = order.indexOf(from);
                      const toIndex = order.indexOf(b);
                      if (fromIndex < 0 || toIndex < 0) return;
                      order.splice(fromIndex, 1);
                      order.splice(toIndex, 0, from);
                      dispatch({ type: "reorderBlocks", sectionId: p.sectionId!, order });
                    }}
                  >
                    {ids.length > 1 ? <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-label="Arrastar" /> : null}
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                      onClick={() => dispatch({ type: "select", path: blockPath(p.sectionId!, b), title: label })}
                    >
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded border border-border bg-muted">
                        {thumbnail ? <img src={thumbnail} alt="" className="size-full object-cover" /> : <span className="text-xs font-semibold text-muted-foreground">{i + 1}</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{label}</span>
                        {summary ? <span className="block truncate text-xs text-muted-foreground">{summary}</span> : null}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-8 shrink-0" aria-label="Opções"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => dispatch({ type: "toggleBlockHidden", sectionId: p.sectionId!, blockId: b })}>{hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />} {hidden ? "Mostrar" : "Ocultar"}</DropdownMenuItem>
                        <DropdownMenuItem disabled={ids.length >= type.blocks!.max} onClick={() => dispatch({ type: "duplicateBlock", sectionId: p.sectionId!, blockId: b })}><Copy className="size-4" /> Duplicar</DropdownMenuItem>
                        <DropdownMenuItem disabled={ids.length <= type.blocks!.min} onClick={() => dispatch({ type: "removeBlock", sectionId: p.sectionId!, blockId: b })}><Trash2 className="size-4" /> Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              disabled={ids.length >= type.blocks.max}
              onClick={() => dispatch({ type: "addBlock", sectionId: p.sectionId! })}
            >
              <Plus className="size-4" /> {ids.length >= type.blocks.max ? `Máximo de ${type.blocks.max}` : type.blocks.addLabel}
            </Button>
          </div>
        ) : null}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opções da seção</p>
          {content}
        </div>
      </div>
    );
  }

  if (p.kind === "block") {
    const bt = blockTypeOf(state.manifest, state.draft, p.sectionId!, p.blockId!);
    return (
      <div className="space-y-1">
        {bt?.elements.map((el) => <ElementRow key={el.id} path={blockElementPath(p.sectionId!, p.blockId!, el.id)} label={el.label} kind={el.kind} />)}
        {content}
      </div>
    );
  }

  return content;
}

export { sectionPath };
