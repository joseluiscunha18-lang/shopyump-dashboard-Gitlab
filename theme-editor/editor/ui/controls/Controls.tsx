import { useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/theme-editor/ui/button";
import { Input } from "@/theme-editor/ui/input";
import { Textarea } from "@/theme-editor/ui/textarea";
import { Switch } from "@/theme-editor/ui/switch";
import { Slider } from "@/theme-editor/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/theme-editor/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/theme-editor/ui/dialog";
import { cn } from "@/theme-editor/lib/utils";
import type { Device, SettingDef } from "@/theme-editor/editor/contracts/types";
import { useEditor, useEditorDispatch } from "@/theme-editor/editor/core/store";
import { isResponsiveValue, pickResponsive, type NodePath } from "@/theme-editor/editor/core/paths";
import { contrastRatio, hasOverride, rawValue, resolveColor, resolveValue, settingsForPath } from "@/theme-editor/editor/core/resolve";
import { mockAdapter, externalTargetLabel } from "@/theme-editor/mocks/adapter";
import { NavListControl } from "./NavListControl";

const DEVICES: { id: Device; label: string; icon: keyof typeof Icons }[] = [
  { id: "desktop", label: "Computador", icon: "Monitor" },
  { id: "tablet", label: "Tablet", icon: "Tablet" },
  { id: "mobile", label: "Telemóvel", icon: "Smartphone" },
];

function Icon({ name, ...rest }: { name: string } & Record<string, unknown>) {
  const key = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  const C = (Icons as unknown as Record<string, React.ComponentType<any>>)[key] ?? Icons.Circle;
  return <C {...rest} />;
}

/* ---------------------------------------------------------------- */

export function ControlRow({ def, path }: { def: SettingDef; path: NodePath }) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  // Por omissão só se mostra o controlo do dispositivo que está a ser editado
  // (o do próprio aparelho — ver detectDevice). Os outros ficam a um toque.
  const [showAll, setShowAll] = useState(false);

  const raw = rawValue(state.manifest, state.draft, path, def);
  const overridden = hasOverride(state.manifest, state.draft, path, def);
  const isResp = isResponsiveValue(raw);
  const current = pickResponsive(raw, state.device);
  const dev = DEVICES.find((d) => d.id === state.device) ?? DEVICES[0];

  const commit = (v: unknown, device?: Device, gestureId?: string) => {
    if (isResp || device) {
      const base = isResp ? { ...(raw as any).$r } : { desktop: current };
      base[device ?? state.device] = v;
      dispatch({ type: "setValue", path, key: def.key, value: { $r: base }, gestureId });
    } else {
      dispatch({ type: "setValue", path, key: def.key, value: v, gestureId });
    }
  };

  if (def.control === "readonlyInfo") {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="text-muted-foreground">{String(def.default)}</p>
        {def.externalTarget ? (
          <Button
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={() => mockAdapter.openExternal(def.externalTarget!, { label: def.label })}
          >
            {externalTargetLabel(def.externalTarget)} →
          </Button>
        ) : null}
      </div>
    );
  }

  const r = isResp ? (raw as any).$r : {};
  const inheritedHere = isResp && r[state.device] === undefined && state.device !== "desktop";

  return (
    <div className="space-y-2 py-2">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {def.label}
          {overridden ? <span className="size-1.5 rounded-full bg-primary" aria-label="personalizado" /> : null}
        </label>
        <div className="flex items-center gap-1">
          {isResp && !showAll ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              title={`A editar o valor para: ${dev.label}`}
            >
              <Icon name={dev.icon as string} className="size-3" />
              {dev.label}
            </span>
          ) : null}
          {overridden ? (
            <button
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              title="Repor padrão"
              onClick={() => dispatch({ type: "resetKey", path, key: def.key })}
            >
              <Icons.RotateCcw className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {def.help ? <p className="text-xs text-muted-foreground">{def.help}</p> : null}
      {def.note ? <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">{def.note}</p> : null}

      {isResp && showAll ? (
        <div className="space-y-3 rounded-lg border border-border p-2">
          {DEVICES.map((d) => {
            const inherited = r[d.id] === undefined;
            const value = pickResponsive(raw, d.id);
            return (
              <div key={d.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Icon name={d.icon as string} className="size-3.5" />
                    {d.label}
                    {inherited && d.id !== "desktop" ? <span className="opacity-60">(herda)</span> : null}
                  </span>
                  {!inherited && d.id !== "desktop" ? (
                    <button
                      className="hover:text-foreground"
                      title="Voltar a herdar"
                      onClick={() => {
                        const next = { ...r };
                        delete next[d.id];
                        dispatch({ type: "setValue", path, key: def.key, value: { $r: next } });
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                <ControlBody def={def} value={value} onChange={(v, g) => commit(v, d.id, g)} path={path} />
              </div>
            );
          })}
          <div className="flex items-center justify-between">
            <button className="text-xs text-muted-foreground underline" onClick={() => setShowAll(false)}>
              Mostrar só {dev.label.toLowerCase()}
            </button>
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                setShowAll(false);
                dispatch({ type: "setValue", path, key: def.key, value: current });
              }}
            >
              Usar um valor só
            </button>
          </div>
        </div>
      ) : (
        <>
          <ControlBody def={def} value={current} onChange={(v, g) => commit(v, undefined, g)} path={path} />
          {isResp ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{inheritedHere ? "Igual ao computador até alterar." : ""}</span>
              <button className="underline" onClick={() => setShowAll(true)}>
                Ver todos os dispositivos
              </button>
            </div>
          ) : def.responsive ? (
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                if (state.device === "desktop") {
                  dispatch({ type: "setValue", path, key: def.key, value: { $r: { desktop: current } } });
                  setShowAll(true);
                } else {
                  dispatch({ type: "setValue", path, key: def.key, value: { $r: { desktop: current, [state.device]: current } } });
                }
              }}
            >
              {state.device === "desktop" ? "Ajustar por dispositivo" : `Alterar só no ${dev.label.toLowerCase()}`}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function ControlBody({
  def,
  value,
  onChange,
  path,
}: {
  def: SettingDef;
  value: any;
  onChange: (v: unknown, gestureId?: string) => void;
  path: NodePath;
}) {
  switch (def.control) {
    case "text":
      return (
        <div>
          <Input
            value={value ?? ""}
            maxLength={def.maxLength}
            onChange={(e) => onChange(e.target.value, `${path}.${def.key}.text`)}
          />
          {def.maxLength && String(value ?? "").length > def.maxLength * 0.8 ? (
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {String(value ?? "").length}/{def.maxLength}
            </p>
          ) : null}
        </div>
      );
    case "textarea":
      return (
        <Textarea
          value={value ?? ""}
          maxLength={def.maxLength}
          rows={3}
          onChange={(e) => onChange(e.target.value, `${path}.${def.key}.text`)}
        />
      );
    case "toggle":
      return (
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <span className="text-sm text-muted-foreground">{value ? "Ativado" : "Desativado"}</span>
          <Switch checked={!!value} onCheckedChange={(c) => onChange(c)} />
        </div>
      );
    case "segmented":
    case "aspectRatio":
      return <Segmented options={def.options ?? []} value={value} onChange={onChange} />;
    case "align":
      return (
        <Segmented
          options={[
            { value: "left", label: "Esquerda", icon: "align-left" },
            { value: "center", label: "Centro", icon: "align-center" },
            { value: "right", label: "Direita", icon: "align-right" },
          ]}
          value={value}
          onChange={onChange}
          iconsOnly
        />
      );
    case "alignV":
      return (
        <Segmented
          options={[
            { value: "top", label: "Topo", icon: "arrow-up-to-line" },
            { value: "center", label: "Meio", icon: "align-center-horizontal" },
            { value: "bottom", label: "Base", icon: "arrow-down-to-line" },
          ]}
          value={value}
          onChange={onChange}
          iconsOnly
        />
      );
    case "select":
      return (
        <Select value={String(value)} onValueChange={(v) => {
          const opt = def.options?.find((o) => String(o.value) === v);
          onChange(opt ? opt.value : v);
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(def.options ?? []).map((o) => (
              <SelectItem key={String(o.value)} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "slider":
      return <NumberSlider def={def} value={value} onChange={onChange} path={path} />;
    case "number":
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onChange(Math.max(def.min ?? 0, (value ?? 0) - 1))}>
            <Icons.Minus className="size-4" />
          </Button>
          <Input
            inputMode="decimal"
            className="text-center"
            value={value ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <Button variant="outline" size="icon" onClick={() => onChange(Math.min(def.max ?? 99, (value ?? 0) + 1))}>
            <Icons.Plus className="size-4" />
          </Button>
        </div>
      );
    case "sizePreset":
      return (
        <div className="space-y-2">
          <Segmented
            options={[...(def.options ?? []), { value: "__custom", label: "Personalizado" }]}
            value={(def.options ?? []).some((o) => o.value === value) ? value : "__custom"}
            onChange={(v) => {
              if (v !== "__custom") onChange(v);
            }}
          />
          {!(def.options ?? []).some((o) => o.value === value) ? (
            <NumberSlider def={def} value={value} onChange={onChange} path={path} />
          ) : null}
        </div>
      );
    case "radius":
      return <RadiusField def={def} value={value} onChange={onChange} path={path} />;
    case "shadow":
      return (
        <Segmented
          options={[
            { value: "none", label: "Nenhuma" },
            { value: "sm", label: "Suave" },
            { value: "md", label: "Média" },
            { value: "lg", label: "Forte" },
          ]}
          value={value}
          onChange={onChange}
        />
      );
    case "color":
      return <ColorControl def={def} value={value} onChange={onChange} path={path} />;
    case "colorScheme":
      return <ColorSchemeControl value={value} onChange={onChange} />;
    case "stylePreset":
      return <StylePresetControl value={value} onChange={onChange} />;
    case "font":
      return <FontControl value={value} onChange={onChange} allowInherit />;
    case "fontWeight":
      return <FontWeightControl value={value} onChange={onChange} />;
    case "image":
      return <ImageControl def={def} value={value} onChange={onChange} />;
    case "focalPoint":
      return <FocalPointControl value={value} onChange={onChange} />;
    case "overlay":
      return <OverlayControl value={value} onChange={onChange} />;
    case "icon":
      return <IconControl value={value} onChange={onChange} />;
    case "link":
      return <LinkControl value={value} onChange={onChange} allowed={def.linkTypes} />;
    case "navList":
      return <NavListControl def={def} value={value ?? []} onChange={onChange} />;
    case "visibilityByDevice":
      return <VisibilityControl value={value} onChange={onChange} />;
    case "animationPreset":
      return <Segmented options={def.options ?? []} value={value} onChange={onChange} />;
    case "productPicker":
      return <PickerControl kind="products" value={value ?? []} onChange={onChange} />;
    case "categoryPicker":
      return <PickerControl kind="categories" value={value ?? []} onChange={onChange} />;
    default:
      return <p className="text-xs text-muted-foreground">Controlo "{def.control}" não disponível.</p>;
  }
}

/* ------------------------------ pieces ------------------------------ */

function Segmented({
  options,
  value,
  onChange,
  iconsOnly,
}: {
  options: { value: any; label: string; icon?: string }[];
  value: any;
  onChange: (v: unknown) => void;
  iconsOnly?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
          title={o.label}
        >
          {o.icon ? <Icon name={o.icon} className="size-4" /> : null}
          {iconsOnly && o.icon ? null : o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Arredondamento: Reto · Suave · Redondo · Pílula + slider em px. Com `inheritLabel`
 * ganha o botão "Da loja" (valor por omissão): enquanto está escolhido, o slider
 * mostra o valor global da loja, e mexer nele cria um valor próprio.
 */
function RadiusField({ def, value, onChange, path }: { def: SettingDef; value: any; onChange: (v: unknown, gestureId?: string) => void; path: NodePath }) {
  const state = useEditor();
  const inheriting = !!def.inheritLabel && typeof value !== "number";
  let shown = value;
  if (inheriting) {
    const globalDef = settingsForPath(state.manifest, state.draft, "global.style").find((d) => d.key === def.key);
    shown = globalDef ? resolveValue(state.manifest, state.draft, "global.style", globalDef, state.device) : 0;
  }
  return (
    <div className="space-y-2">
      <Segmented
        options={[
          ...(def.inheritLabel ? [{ value: "inherit", label: def.inheritLabel }] : []),
          { value: 0, label: "Reto" },
          { value: 8, label: "Suave" },
          { value: 20, label: "Redondo" },
          { value: 999, label: "Pílula" },
        ]}
        value={inheriting ? "inherit" : value}
        onChange={onChange}
      />
      <NumberSlider def={{ ...def, min: def.min ?? 0, max: def.max ?? 48 }} value={shown} onChange={onChange} path={path} />
    </div>
  );
}

function NumberSlider({
  def,
  value,
  onChange,
  path,
}: {
  def: SettingDef;
  value: any;
  onChange: (v: unknown, gestureId?: string) => void;
  path: NodePath;
}) {
  const min = def.min ?? 0;
  const max = def.max ?? 100;
  const step = def.step ?? 1;
  const gesture = useRef(`${path}.${def.key}.${Date.now()}`);
  const num = typeof value === "number" ? value : min;
  return (
    <div className="flex items-center gap-3">
      <Slider
        className="flex-1"
        min={min}
        max={max}
        step={step}
        value={[Math.min(max, Math.max(min, num))]}
        onValueChange={([v]) => onChange(v, gesture.current)}
        onValueCommit={() => {
          gesture.current = `${path}.${def.key}.${Date.now()}`;
        }}
      />
      <div className="flex w-20 items-center gap-1">
        <Input
          inputMode="decimal"
          className="h-9 px-2 text-center text-xs"
          value={num}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
        />
        {def.unit ? <span className="text-xs text-muted-foreground">{def.unit}</span> : null}
      </div>
    </div>
  );
}

function ColorControl({
  def,
  value,
  onChange,
  path,
}: {
  def: SettingDef;
  value: any;
  onChange: (v: unknown) => void;
  path: NodePath;
}) {
  const state = useEditor();
  const [open, setOpen] = useState(false);
  const colorsGroup = state.manifest.global.find((g) => g.id === "colors");
  const globalColors: Record<string, unknown> = {};
  for (const d of colorsGroup?.settings ?? [])
    globalColors[d.key] = rawValue(state.manifest, state.draft, "global.colors", d);
  const resolvedTokens: Record<string, string> = {};
  for (const k of Object.keys(globalColors)) resolvedTokens[k] = resolveColor(globalColors[k], globalColors);

  const shown = resolveColor(value, resolvedTokens);

  let warning: string | null = null;
  if (def.assist?.contrastWith) {
    const otherDef = colorsGroup?.settings.find((s) => s.key === def.assist!.contrastWith);
    const other = otherDef
      ? resolveColor(rawValue(state.manifest, state.draft, "global.colors", otherDef), resolvedTokens)
      : resolvedTokens[def.assist.contrastWith] ?? "#FFFFFF";
    if (contrastRatio(shown, other) < 4.5) warning = "Texto difícil de ler neste fundo.";
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left"
      >
        <span className="size-7 rounded-md border border-border" style={{ background: shown }} />
        <span className="text-sm">{typeof value === "string" && value.startsWith("token:") ? value.replace("token:", "Cor do tema · ") : shown}</span>
      </button>
      {warning ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <Icons.TriangleAlert className="size-3.5" /> {warning}
        </p>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{def.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Cores do tema</p>
              <div className="grid grid-cols-6 gap-2">
                {Object.keys(resolvedTokens).map((k) => (
                  <button
                    key={k}
                    title={k}
                    className="size-9 rounded-md border border-border"
                    style={{ background: resolvedTokens[k] }}
                    onClick={() => {
                      onChange(`token:${k}`);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Cor personalizada</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 rounded border border-border bg-transparent"
                  value={shown.startsWith("#") ? shown.slice(0, 7) : "#000000"}
                  onChange={(e) => onChange(e.target.value.toUpperCase())}
                />
                <Input value={shown} onChange={(e) => onChange(e.target.value)} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorSchemeControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const { manifest } = useEditor();
  return (
    <div className="flex gap-1.5">
      {manifest.colorSchemes.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded-md border p-1.5 text-left",
            value === s.id ? "border-primary ring-1 ring-primary" : "border-border",
          )}
        >
          <span
            className="size-5 shrink-0 rounded-sm border border-border"
            style={{ background: s.colors.background, color: s.colors.text }}
          />
          <span className="truncate text-[11px]">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function StylePresetControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const { manifest } = useEditor();
  return (
    <div className="space-y-2">
      {manifest.stylePresets.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "w-full rounded-lg border p-3 text-left",
            value === p.id ? "border-primary ring-1 ring-primary" : "border-border",
          )}
        >
          <span className="block text-sm font-medium">{p.label}</span>
          <span className="block text-xs text-muted-foreground">{p.description}</span>
        </button>
      ))}
    </div>
  );
}

function FontControl({
  value,
  onChange,
  allowInherit,
}: {
  value: any;
  onChange: (v: unknown) => void;
  allowInherit?: boolean;
}) {
  const { manifest } = useEditor();
  const [q, setQ] = useState("");
  const list = manifest.fonts.filter((f) => f.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2">
      <Input placeholder="Procurar fonte" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {allowInherit ? (
          <button
            onClick={() => onChange("inherit")}
            className={cn("w-full rounded-md px-3 py-2 text-left text-sm", value === "inherit" ? "bg-accent" : "")}
          >
            Herdar do tema
          </button>
        ) : null}
        {list.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn("w-full rounded-md px-3 py-2 text-left", value === f.id ? "bg-accent" : "")}
            style={{ fontFamily: f.family }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FontWeightControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const weights = [300, 400, 500, 600, 700, 800];
  return (
    <Segmented options={weights.map((w) => ({ value: w, label: String(w) }))} value={value} onChange={onChange} />
  );
}

function ImageControl({
  def,
  value,
  onChange,
}: {
  def: SettingDef;
  value: any;
  onChange: (v: unknown) => void;
}) {
  const state = useEditor();
  const dispatch = useEditorDispatch();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = state.media.find((m) => m.id === value?.mediaId);
  const list = state.media.filter((m) => filter === "all" || m.tags.includes(filter));
  const rec = def.assist?.recommended;

  const upload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      { toast.error("Formato não suportado", { description: "Use JPG, PNG ou WebP." }); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ficheiro muito grande", { description: "Máximo 5 MB." }); return; }
    setUploading(true);
    try {
      const asset = await mockAdapter.uploadMedia(file, def.assist?.kind);
      dispatch({ type: "addMedia", asset });
      onChange({ mediaId: asset.id });
      setOpen(false);
    } catch (e) {
      toast.error("Não foi possível enviar a imagem", { description: (e as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="size-16 overflow-hidden rounded-md border border-border bg-muted">
          {current ? <img src={current.url} alt="" className="size-full object-cover" /> : null}
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {current ? "Alterar imagem" : "Escolher imagem"}
          </Button>
          {current ? (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      {rec ? (
        <p className="text-xs text-muted-foreground">
          Recomendado: {rec.width}×{rec.height}
          {current && current.width > 0 && current.width < rec.width ? " · esta imagem pode ficar desfocada" : ""}
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar imagem</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Icons.Loader2 className="size-4 animate-spin" /> : <Icons.Upload className="size-4" />}
              {uploading ? "A enviar…" : "Enviar imagem"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </div>
          <div className="flex gap-1">
            {[
              { id: "all", label: "Todas" },
              { id: "logo", label: "Logo" },
              { id: "banner", label: "Banner" },
              { id: "image", label: "Outras" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn("rounded-full border px-3 py-1 text-xs", filter === f.id ? "border-primary bg-accent" : "border-border")}
              >
                {f.label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ainda não há imagens aqui. Use “Enviar imagem” (JPG, PNG ou WebP, até 5 MB).
            </p>
          ) : null}
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto">
            {list.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onChange({ mediaId: m.id });
                  setOpen(false);
                }}
                className="overflow-hidden rounded-md border border-border"
              >
                <img src={m.url} alt={m.name} className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FocalPointControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const v = value ?? { x: 50, y: 50 };
  return (
    <div className="space-y-2">
      <div
        className="relative h-28 rounded-md border border-border bg-muted"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onChange({
            x: Math.round(((e.clientX - r.left) / r.width) * 100),
            y: Math.round(((e.clientY - r.top) / r.height) * 100),
          });
        }}
      >
        <span
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background"
          style={{ left: `${v.x}%`, top: `${v.y}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          X {v.x}% · Y {v.y}%
        </span>
        <button className="underline" onClick={() => onChange({ x: 50, y: 50 })}>
          Centrar
        </button>
      </div>
    </div>
  );
}

function OverlayControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const v = value ?? { color: "#000000", opacity: 0 };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-9 w-12 rounded border border-border bg-transparent"
          value={v.color}
          onChange={(e) => onChange({ ...v, color: e.target.value })}
        />
        <Slider
          className="flex-1"
          min={0}
          max={90}
          value={[v.opacity]}
          onValueChange={([o]) => onChange({ ...v, opacity: o })}
        />
        <span className="w-10 text-right text-xs text-muted-foreground">{v.opacity}%</span>
      </div>
    </div>
  );
}

export function IconControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const { manifest } = useEditor();
  const [q, setQ] = useState("");
  const list = manifest.icons.filter((i) => i.includes(q.toLowerCase()));
  return (
    <div className="space-y-2">
      <Input placeholder="Procurar ícone" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid max-h-44 grid-cols-6 gap-1 overflow-y-auto">
        {list.map((i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cn("grid aspect-square place-items-center rounded-md border", value === i ? "border-primary bg-accent" : "border-border")}
          >
            <Icon name={i} className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

const LINK_TYPES = [
  { value: "themePage", label: "Páginas da loja" },
  { value: "home", label: "Início" },
  { value: "products", label: "Todos os produtos" },
  { value: "category", label: "Categoria" },
  { value: "product", label: "Produto" },
  { value: "page", label: "Página / política" },
  { value: "url", label: "Endereço externo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
];

export function LinkControl({ value, onChange, allowed }: { value: any; onChange: (v: unknown) => void; allowed?: string[] }) {
  const state = useEditor();
  const types = LINK_TYPES.filter((l) => !allowed || allowed.includes(l.value));
  const themePages = state.manifest.pages.filter((p) => p.supported && (!p.requires || state.manifest.capabilities[p.requires]));
  const v = value ?? { type: types[0]?.value ?? "home" };
  const summary = useMemo(() => {
    const t = LINK_TYPES.find((l) => l.value === v.type)?.label ?? "Início";
    if (v.type === "category") return `${t} · ${state.categories.find((c) => c.id === v.value)?.name ?? "—"}`;
    if (v.type === "product") return `${t} · ${state.products.find((p) => p.id === v.value)?.name ?? "—"}`;
    if (v.type === "page") return `${t} · ${state.pages.find((p) => p.id === v.value)?.title ?? "—"}`;
    if (v.type === "themePage") return `${t} · ${state.manifest.pages.find((p) => p.id === v.value)?.label ?? "—"}`;
    if (v.value) return `${t} · ${v.value}`;
    return t;
  }, [v, state]);

  return (
    <div className="space-y-2">
      <Select value={v.type} onValueChange={(t) => onChange({ type: t })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {types.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {v.type === "themePage" ? (
        <Select value={v.value ?? ""} onValueChange={(id) => onChange({ ...v, value: id })}>
          <SelectTrigger><SelectValue placeholder="Escolher página da loja" /></SelectTrigger>
          <SelectContent>
            {themePages.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {v.type === "category" ? (
        <Select value={v.value ?? ""} onValueChange={(id) => onChange({ ...v, value: id })}>
          <SelectTrigger><SelectValue placeholder="Escolher categoria" /></SelectTrigger>
          <SelectContent>
            {state.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {v.type === "product" ? (
        <Select value={v.value ?? ""} onValueChange={(id) => onChange({ ...v, value: id })}>
          <SelectTrigger><SelectValue placeholder="Escolher produto" /></SelectTrigger>
          <SelectContent>
            {state.products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name.slice(0, 40)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {v.type === "page" ? (
        <Select value={v.value ?? ""} onValueChange={(id) => onChange({ ...v, value: id })}>
          <SelectTrigger><SelectValue placeholder="Escolher página" /></SelectTrigger>
          <SelectContent>
            {state.pages.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {["url", "phone", "email"].includes(v.type) ? (
        <Input
          placeholder={v.type === "url" ? "https://…" : v.type === "email" ? "nome@exemplo.com" : "+351 912 000 000"}
          value={v.value ?? ""}
          onChange={(e) => onChange({ ...v, value: e.target.value })}
        />
      ) : null}
      {v.type === "whatsapp" ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            Número gerido em Informações da loja.
            <button className="ml-1 underline" onClick={() => mockAdapter.openExternal("store-info")}>
              Editar
            </button>
          </div>
          <Input
            placeholder="Mensagem pré-escrita"
            value={v.message ?? ""}
            onChange={(e) => onChange({ ...v, message: e.target.value })}
          />
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">Destino: {summary}</p>
    </div>
  );
}

function VisibilityControl({ value, onChange }: { value: any; onChange: (v: unknown) => void }) {
  const v = value ?? { desktop: true, tablet: true, mobile: true };
  return (
    <div className="space-y-1">
      {DEVICES.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5">
          <span className="flex items-center gap-2 text-sm">
            <Icon name={d.icon as string} className="size-4" />
            {d.label}
          </span>
          <Switch
            checked={!!v[d.id]}
            onCheckedChange={(c) => {
              const next = { ...v, [d.id]: c };
              if (!next.desktop && !next.tablet && !next.mobile) {
                toast("Tem de estar visível em pelo menos um dispositivo.");
                return;
              }
              onChange(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function PickerControl({
  kind,
  value,
  onChange,
}: {
  kind: "products" | "categories";
  value: string[];
  onChange: (v: unknown) => void;
}) {
  const state = useEditor();
  const [q, setQ] = useState("");
  const items =
    kind === "products"
      ? state.products.map((p) => ({ id: p.id, label: p.name }))
      : state.categories.map((c) => ({ id: c.id, label: c.name }));
  const list = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <Input placeholder="Procurar" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-xs text-muted-foreground">{value.length} selecionados</p>
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {list.map((i) => (
          <button
            key={i.id}
            onClick={() => toggle(i.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm",
              value.includes(i.id) ? "border-primary bg-accent" : "border-border",
            )}
          >
            {value.includes(i.id) ? <Icons.CheckSquare className="size-4" /> : <Icons.Square className="size-4" />}
            <span className="line-clamp-1">{i.label}</span>
          </button>
        ))}
      </div>
      <Button
        variant="link"
        className="h-auto p-0 text-xs"
        onClick={() => mockAdapter.openExternal(kind === "products" ? "products" : "categories")}
      >
        {kind === "products" ? "Editar produtos" : "Gerir categorias"} →
      </Button>
    </div>
  );
}
