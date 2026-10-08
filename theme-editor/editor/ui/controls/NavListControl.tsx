import { useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/theme-editor/ui/button";
import { Input } from "@/theme-editor/ui/input";
import { Switch } from "@/theme-editor/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/theme-editor/ui/dropdown-menu";
import { cn } from "@/theme-editor/lib/utils";
import type { NavItem, SettingDef } from "@/theme-editor/editor/contracts/types";
import { useEditor } from "@/theme-editor/editor/core/store";
import { mockAdapter } from "@/theme-editor/mocks/adapter";
import { IconControl, LinkControl } from "./Controls";

function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const key = name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const C = (Icons as unknown as Record<string, React.ComponentType<any>>)[key] ?? Icons.Circle;
  return <C className={className} />;
}

const uid = () => `n${Math.random().toString(36).slice(2, 8)}`;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Editor genérico de listas de navegação (1 ou 2 níveis). Guarda sempre o array completo. */
export function NavListControl({ def, value, onChange }: { def: SettingDef; value: NavItem[]; onChange: (v: unknown) => void }) {
  const spec = def.navList!;
  const defaults = (def.default as NavItem[]) ?? [];
  const items = value;
  const [open, setOpen] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const visibleCount = items.filter((i) => !i.hidden).length;

  const update = (fn: (list: NavItem[]) => void) => {
    const next = clone(items);
    fn(next);
    onChange(next);
  };
  const locate = (list: NavItem[], id: string): { arr: NavItem[]; i: number } | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { arr: list, i };
      const c = list[i].children ? locate(list[i].children!, id) : null;
      if (c) return c;
    }
    return null;
  };
  const move = (id: string, dir: -1 | 1) =>
    update((l) => {
      const f = locate(l, id);
      if (!f) return;
      const j = f.i + dir;
      if (j < 0 || j >= f.arr.length) return;
      [f.arr[f.i], f.arr[j]] = [f.arr[j], f.arr[f.i]];
    });
  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    update((l) => {
      const a = locate(l, dragId);
      const b = locate(l, targetId);
      if (!a || !b || a.arr !== b.arr) return;
      const [it] = a.arr.splice(a.i, 1);
      a.arr.splice(b.arr.indexOf(b.arr[b.i]) >= 0 ? b.i : b.arr.length, 0, it);
    });
    setDragId(null);
  };

  const row = (it: NavItem, depth: number, parent?: NavItem) => {
    const isOpen = open === it.id;
    const blockHide = !it.hidden && depth === 0 && spec.minVisible !== undefined && visibleCount <= spec.minVisible;
    const hasChildren = !!it.children?.length || !!it.auto;
    const parents = items.filter((p) => p.id !== parent?.id && !p.auto && !p.link);
    return (
      <div key={it.id} className={cn(depth > 0 && "ml-5")}>
        <div
          draggable
          onDragStart={() => setDragId(it.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dropOn(it.id)}
          className={cn("flex items-center gap-1 rounded-lg border border-border bg-card px-1.5", it.hidden && "opacity-50")}
        >
          <Icons.GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
          <button className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm" onClick={() => setOpen(isOpen ? null : it.id)}>
            {spec.iconEnabled ? <Icon name={it.icon} className="size-4 shrink-0" /> : null}
            <span className="truncate">{depth > 0 ? "↳ " : ""}{it.label}</span>
            {it.locked && !spec.fixed ? <Icons.Lock className="size-3 text-muted-foreground" /> : null}
          </button>
          <Button size="icon" variant="ghost" className="size-8" disabled={blockHide} title={blockHide ? `Mínimo de ${spec.minVisible} itens visíveis` : undefined}
            onClick={() => update((l) => { const f = locate(l, it.id); if (f) f.arr[f.i].hidden = !f.arr[f.i].hidden; })}>
            {it.hidden ? <Icons.EyeOff className="size-4" /> : <Icons.Eye className="size-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-8"><Icons.MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => move(it.id, -1)}><Icons.ArrowUp className="size-4" /> Mover para cima</DropdownMenuItem>
              <DropdownMenuItem onClick={() => move(it.id, 1)}><Icons.ArrowDown className="size-4" /> Mover para baixo</DropdownMenuItem>
              {depth > 0 && parents.length ? (
                <>
                  <DropdownMenuSeparator />
                  {parents.map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => update((l) => {
                      const f = locate(l, it.id); const t = l.find((x) => x.id === p.id);
                      if (!f || !t) return; const [m] = f.arr.splice(f.i, 1); t.children = [...(t.children ?? []), m]; delete t.link;
                    })}>Mover para «{p.label}»</DropdownMenuItem>
                  ))}
                </>
              ) : null}
              {!spec.fixed && !it.locked && (depth > 0 || items.length < spec.maxItems) ? (
                <DropdownMenuItem onClick={() => update((l) => { const f = locate(l, it.id); if (f) f.arr.splice(f.i + 1, 0, { ...clone(f.arr[f.i]), id: uid(), locked: false, auto: undefined, children: f.arr[f.i].children?.map((c) => ({ ...c, id: uid() })) }); })}>
                  <Icons.Copy className="size-4" /> Duplicar
                </DropdownMenuItem>
              ) : null}
              {!spec.fixed && !it.locked ? (
                <DropdownMenuItem onClick={() => update((l) => { const f = locate(l, it.id); if (f) f.arr.splice(f.i, 1); })}>
                  <Icons.Trash2 className="size-4" /> Remover
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isOpen ? (
          <div className="mb-2 mt-1 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="mb-1 text-xs font-medium">Nome</p>
              <Input value={it.label} maxLength={spec.labelMaxLength}
                onChange={(e) => update((l) => { const f = locate(l, it.id); if (f) f.arr[f.i].label = e.target.value; })}
                onBlur={(e) => { if (!e.target.value.trim()) update((l) => { const f = locate(l, it.id); const d = locate(clone(defaults), it.id); if (f) f.arr[f.i].label = d?.arr[d.i].label ?? "Item"; }); }} />
            </div>
            {spec.iconEnabled ? (
              <div>
                <p className="mb-1 text-xs font-medium">Ícone</p>
                <IconControl value={it.icon} onChange={(v) => update((l) => { const f = locate(l, it.id); if (f) f.arr[f.i].icon = v as string; })} />
              </div>
            ) : null}
            {spec.fixed ? null : it.auto === "categories" ? (
              <div className="space-y-2">
                <p className="text-xs font-medium">Quantas categorias mostrar</p>
                <Input type="number" min={1} max={12} value={it.autoCount ?? 6}
                  onChange={(e) => update((l) => { const f = locate(l, it.id); if (f) f.arr[f.i].autoCount = Math.max(1, Math.min(12, Number(e.target.value) || 1)); })} />
                <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  Gerido em Categorias.
                  <button className="ml-1 underline" onClick={() => mockAdapter.openExternal("categories")}>Gerir categorias</button>
                </div>
              </div>
            ) : !hasChildren ? (
              <div>
                <p className="mb-1 text-xs font-medium">Destino</p>
                <LinkControl value={it.link} allowed={spec.linkTypes}
                  onChange={(v) => update((l) => { const f = locate(l, it.id); if (f) f.arr[f.i].link = v as NavItem["link"]; })} />
                {!it.link ? <p className="mt-1 text-xs text-destructive">Escolha um destino.</p> : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Este item abre um submenu, por isso não tem destino próprio.</p>
            )}
            <label className="flex items-center justify-between text-sm">
              Mostrar
              <Switch checked={!it.hidden} disabled={blockHide}
                onCheckedChange={(c) => update((l) => { const f = locate(l, it.id); if (f) f.arr[f.i].hidden = !c; })} />
            </label>
          </div>
        ) : null}

        {it.auto === "categories" ? <AutoChildren count={it.autoCount ?? 6} /> : null}
        {it.children?.map((c) => row(c, depth + 1, it))}
        {depth === 0 && spec.maxDepth === 2 && !it.auto && isOpen ? (
          <button className="ml-5 mt-1 text-xs font-medium text-primary"
            onClick={() => update((l) => { const t = l.find((x) => x.id === it.id); if (!t) return; t.children = [...(t.children ?? []), { id: uid(), label: "Subitem", link: { type: "home" } }]; delete t.link; })}>
            + Adicionar subitem
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-1.5">
      {items.map((it) => row(it, 0))}
      {spec.fixed ? null : <Button variant="outline" size="sm" className="w-full" disabled={items.length >= spec.maxItems}
        onClick={() => update((l) => l.push({ id: uid(), label: "Novo item", icon: spec.iconEnabled ? "circle" : undefined, link: spec.linkTypes.includes("themePage") ? { type: "themePage", value: "home" } : { type: spec.linkTypes[0] } }))}>
        <Icons.Plus className="size-4" /> {items.length >= spec.maxItems ? `Máximo de ${spec.maxItems} itens` : "Adicionar item"}
      </Button>}
    </div>
  );
}

function AutoChildren({ count }: { count: number }) {
  const { categories } = useEditor();
  return (
    <div className="ml-5 mt-1 space-y-1">
      {categories.slice(0, count).map((c) => (
        <div key={c.id} className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground">↳ {c.name}</div>
      ))}
    </div>
  );
}
