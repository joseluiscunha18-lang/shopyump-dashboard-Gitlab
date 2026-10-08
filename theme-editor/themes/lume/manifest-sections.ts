import type { ElementDef, SectionTypeDef, SettingDef } from "@/theme-editor/editor/contracts/types";
import { LOOK, buttonSettings } from "./elements";

/**
 * Secções que o lojista pode ADICIONAR à página inicial ("Adicionar seção").
 * Só entraram as que fazem sentido para vender; cada uma é desenhada no preview
 * (sections-extra.tsx) e na loja pública (components/store/extra-sections.tsx).
 * Os textos/cores/destinos destas secções chegam à loja pública já resolvidos
 * (ver `extras` em lib/personalizacao.ts).
 */

const B = "basic" as const;
const A = "advanced" as const;

const scheme: SettingDef = {
  key: "tone",
  label: "Fundo da secção",
  control: "segmented",
  tier: B,
  group: "appearance",
  default: "light",
  options: [
    { value: "light", label: "Claro" },
    { value: "soft", label: "Suave" },
    { value: "dark", label: "Escuro" },
  ],
};

const heading = (text: string, size = 24): ElementDef => ({
  id: "title",
  kind: "heading",
  label: "Título",
  settings: [
    { key: "text", label: "Texto", control: "text", tier: B, group: "content", default: text, maxLength: 80 },
    { key: "show", label: "Mostrar", control: "toggle", tier: B, group: "content", default: true },
    { key: "size", label: "Tamanho", control: "slider", tier: A, group: "typography", responsive: true, default: { $r: { desktop: size, mobile: Math.round(size * 0.85) } }, min: 14, max: 56, unit: "px" },
  ],
});

const body = (text: string): ElementDef => ({
  id: "text",
  kind: "text",
  label: "Texto",
  settings: [
    { key: "text", label: "Texto", control: "textarea", tier: B, group: "content", default: text, maxLength: 600 },
    { key: "show", label: "Mostrar", control: "toggle", tier: B, group: "content", default: true },
  ],
});

const button = (label: string, show: boolean): ElementDef => ({
  id: "button",
  kind: "button",
  label: "Botão",
  settings: buttonSettings({ label, look: LOOK.primary, link: { type: "products" }, canHide: true }).map((d) =>
    d.key === "show" ? { ...d, default: show } : d,
  ),
});

const base = {
  scope: "page" as const,
  allowedPages: ["home"],
  required: false,
  removable: true,
  duplicable: true,
  reorderable: true,
  hideable: true,
  maxInstances: 6,
};

export const addableSectionTypes: SectionTypeDef[] = [
  {
    ...base,
    type: "categories",
    label: "Categorias",
    description: "Cartões para o cliente escolher uma categoria.",
    icon: "layout-grid",
    elements: [heading("Compre por categoria")],
    settings: [
      { key: "columns", label: "Colunas", control: "number", tier: B, group: "layout", responsive: true, default: { $r: { desktop: 4, mobile: 2 } }, min: 2, max: 6 },
      { key: "shape", label: "Forma da imagem", control: "segmented", tier: B, group: "appearance", default: "square", options: [{ value: "square", label: "Quadrada" }, { value: "round", label: "Redonda" }] },
      { key: "showCount", label: "Mostrar nº de produtos", control: "toggle", tier: B, group: "content", default: true },
      scheme,
      { key: "categoriesInfo", label: "Categorias", control: "readonlyInfo", tier: B, group: "content", externalTarget: "categories", default: "As categorias vêm dos seus produtos. Sem categorias, esta secção não aparece na loja." },
    ],
  },
  {
    ...base,
    type: "imageText",
    label: "Imagem e texto",
    description: "Uma imagem ao lado de um título, texto e botão.",
    icon: "image",
    elements: [
      {
        id: "image",
        kind: "image",
        label: "Imagem",
        settings: [
          { key: "image", label: "Imagem", control: "image", tier: B, group: "content", default: null, assist: { kind: "image", recommended: { width: 1200, height: 1200 } } },
          { key: "ratio", label: "Proporção", control: "segmented", tier: A, group: "layout", default: "4/5", options: [{ value: "1/1", label: "1:1" }, { value: "4/5", label: "4:5" }, { value: "16/9", label: "16:9" }] },
        ],
      },
      heading("Conheça a nossa história", 28),
      body("Conte aqui o que torna a sua loja especial."),
      button("Saber mais", false),
    ],
    settings: [
      { key: "side", label: "Imagem do lado", control: "segmented", tier: B, group: "layout", default: "left", options: [{ value: "left", label: "Esquerdo" }, { value: "right", label: "Direito" }] },
      scheme,
    ],
  },
  {
    ...base,
    type: "richText",
    label: "Texto livre",
    description: "Um aviso, uma mensagem ou uma explicação.",
    icon: "text",
    elements: [heading("Uma mensagem para os clientes", 26), body("Escreva aqui o que quer dizer."), button("Ver produtos", false)],
    settings: [
      { key: "align", label: "Alinhamento", control: "segmented", tier: B, group: "layout", default: "center", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }] },
      scheme,
    ],
  },
];
