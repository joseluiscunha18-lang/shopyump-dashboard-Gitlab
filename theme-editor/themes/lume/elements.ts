import type { LinkRef, LinkType, SettingDef } from "@/theme-editor/editor/contracts/types";

/**
 * Peças reutilizáveis do manifesto do Lume. Existem para que o MESMO tipo de
 * elemento (botão, imagem) ofereça SEMPRE os mesmos controlos, pela mesma ordem
 * e com os mesmos rótulos — sem copiar e colar definições pelo manifesto.
 *
 * Regra de ouro (igual ao manifest.ts): tudo o que está aqui é aplicado na loja
 * pública por `lib/store/themes/lume/lib/personalizacao.ts`.
 */

const B = "basic" as const;
const A = "advanced" as const;

/** Destinos que um botão pode ter na loja pública (os mesmos que o menu lateral + WhatsApp). */
export const BUTTON_LINK_TYPES: LinkType[] = ["home", "products", "category", "themePage", "url", "whatsapp"];

/** Aparência original de cada botão do Lume (o que a loja pública mostra sem personalização). */
export interface ButtonLook {
  variant: "solid" | "outline" | "text";
  /** Solid: cor de fundo. Outline: cor do contorno. */
  bg: string;
  textColor: string;
}

export const LOOK = {
  /** Botão do banner: branco com letra escura (variante `hero` do tema público). */
  hero: { variant: "solid", bg: "#FFFFFF", textColor: "#202020" },
  /** "Explorar mais": contorno claro e letra secundária. */
  viewAll: { variant: "outline", bg: "token:border", textColor: "token:secondary" },
  /** Cartão do WhatsApp: fundo da página, letra normal e contorno. */
  whatsapp: { variant: "solid", bg: "token:background", textColor: "token:text" },
  /** Botão principal do tema (o que as secções novas usam por omissão). */
  primary: { variant: "solid", bg: "token:buttonBg", textColor: "token:buttonText" },
} as const satisfies Record<string, ButtonLook>;

/**
 * Controlos completos de um botão. Básico = o que quem só quer vender precisa
 * (texto, destino, cores); "Mais opções" = estilo, cantos e tamanho.
 */
export function buttonSettings(o: {
  label: string;
  look: ButtonLook;
  /** Sem `link` = o botão não tem destino editável (ex.: o do WhatsApp usa o número da loja). */
  link?: LinkRef;
  /** Mostra o campo "Mensagem inicial" (botões que abrem o WhatsApp). */
  message?: boolean;
  canHide?: boolean;
}): SettingDef[] {
  const out: SettingDef[] = [];
  if (o.canHide) out.push({ key: "show", label: "Mostrar botão", control: "toggle", tier: B, group: "content", default: true });
  out.push({ key: "label", label: "Texto", control: "text", tier: B, group: "content", default: o.label, maxLength: 32 });
  if (o.link) out.push({ key: "link", label: "Para onde leva", control: "link", tier: B, group: "content", default: o.link, linkTypes: BUTTON_LINK_TYPES });
  if (o.message)
    out.push({
      key: "message",
      label: "Mensagem inicial",
      help: "Já vem escrita quando o cliente abre o WhatsApp. Deixe vazio para não preencher.",
      control: "textarea",
      tier: B,
      group: "content",
      default: "",
      maxLength: 200,
    });
  out.push(
    { key: "bg", label: o.look.variant === "outline" ? "Cor do contorno" : "Cor do botão", control: "color", tier: B, group: "appearance", default: o.look.bg },
    { key: "textColor", label: "Cor do texto", control: "color", tier: B, group: "appearance", default: o.look.textColor, assist: { contrastWith: "bg" } },
    {
      key: "variant",
      label: "Estilo",
      control: "segmented",
      tier: A,
      group: "appearance",
      default: o.look.variant,
      options: [
        { value: "solid", label: "Cheio" },
        { value: "outline", label: "Contorno" },
        { value: "text", label: "Só texto" },
      ],
    },
    {
      key: "radius",
      label: "Cantos",
      control: "segmented",
      tier: A,
      group: "appearance",
      default: 999,
      options: [
        { value: 999, label: "Pílula" },
        { value: 12, label: "Suaves" },
        { value: 0, label: "Retos" },
      ],
    },
    {
      key: "size",
      label: "Tamanho",
      control: "segmented",
      tier: A,
      group: "layout",
      default: "md",
      options: [
        { value: "sm", label: "P" },
        { value: "md", label: "M" },
        { value: "lg", label: "G" },
      ],
    },
  );
  return out;
}

/** Botão só com texto editável (botões funcionais: finalizar compra, enviar…). */
export function simpleButtonSettings(label: string): SettingDef[] {
  return [{ key: "label", label: "Texto", control: "text", tier: B, group: "content", default: label, maxLength: 40 }];
}
