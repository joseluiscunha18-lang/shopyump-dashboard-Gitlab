// Contratos universais do editor. Nenhum nome de tema aparece aqui.

export type Device = "desktop" | "tablet" | "mobile";
export type PageId = string;

export type ResponsiveValue<T> = { $r: Partial<Record<Device, T>> };

export type SpacingBox = { top: number; right: number; bottom: number; left: number };
export type ColorValue = string; // "#RRGGBB" | "token:primary"
export type ImageRef = { mediaId: string } | null;
export type LinkRef = {
  type:
    | "home"
    | "products"
    | "category"
    | "product"
    | "page"
    | "url"
    | "whatsapp"
    | "phone"
    | "email"
    | "anchor";
  value?: string;
  message?: string;
  newTab?: boolean;
} | null;

export type ControlType =
  | "text"
  | "textarea"
  | "toggle"
  | "segmented"
  | "select"
  | "slider"
  | "number"
  | "sizePreset"
  | "color"
  | "colorScheme"
  | "palette"
  | "stylePreset"
  | "font"
  | "fontWeight"
  | "align"
  | "alignV"
  | "spacing"
  | "radius"
  | "border"
  | "shadow"
  | "aspectRatio"
  | "dimension"
  | "image"
  | "focalPoint"
  | "link"
  | "icon"
  | "overlay"
  | "visibilityByDevice"
  | "animationPreset"
  | "productPicker"
  | "categoryPicker"
  | "readonlyInfo";

export type SettingGroup =
  | "content"
  | "layout"
  | "spacing"
  | "typography"
  | "appearance"
  | "behavior"
  | "responsive"
  | "advanced";

export interface SettingDef {
  key: string;
  label: string;
  help?: string;
  control: ControlType;
  tier: "basic" | "advanced";
  group?: SettingGroup;
  default: unknown;
  responsive?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: "px" | "%" | "vh" | "rem" | "em" | "x" | "s";
  options?: { value: string | number | boolean; label: string; icon?: string }[];
  maxLength?: number;
  visibleWhen?: {
    key: string;
    equals?: unknown;
    in?: unknown[];
    truthy?: boolean;
    gt?: number;
    lt?: number;
  };
  requires?: string;
  externalTarget?: ExternalTarget;
  assist?: { contrastWith?: string; recommended?: { width: number; height: number } };
}

export interface SettingGroupDef {
  id: string;
  label: string;
  icon: string;
  settings: SettingDef[];
}

export type ElementKind =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "icon"
  | "logo"
  | "menu"
  | "socialLinks"
  | "policyLinks"
  | "productCard"
  | "badge"
  | "price"
  | "input"
  | "divider";

export type SettingsSpec =
  | SettingDef[]
  | { preset: string; omit?: string[]; add?: SettingDef[]; override?: Record<string, Partial<SettingDef>> };

export interface ElementDef {
  id: string;
  kind: ElementKind;
  label: string;
  settings: SettingsSpec;
}

export interface BlockTypeDef {
  type: string;
  label: string;
  icon: string;
  labelKey?: string; // elemento cujo texto serve de rótulo na lista
  elements: ElementDef[];
  settings?: SettingDef[];
}

export interface DataSourceDef {
  kind: "products" | "categories";
  modes: ("all" | "category" | "manual" | "collection" | "related")[];
  sort?: string[];
  maxItems: { min: number; max: number };
}

export interface SectionTypeDef {
  type: string;
  label: string;
  description: string;
  icon: string;
  scope: "global" | "page";
  allowedPages?: PageId[];
  required: boolean;
  removable: boolean;
  duplicable: boolean;
  reorderable: boolean;
  hideable: boolean;
  maxInstances?: number;
  settings: SettingsSpec;
  elements: ElementDef[];
  blocks?: {
    allowed: string[];
    min: number;
    max: number;
    itemLabel: string;
    itemLabelPlural: string;
    addLabel: string;
    defaultCount: number;
  };
  dataSource?: DataSourceDef;
  requires?: string;
}

export interface SectionInstanceDef {
  id: string;
  type: string;
  hidden?: boolean;
}

export interface PageDef {
  id: PageId;
  label: string;
  supported: boolean;
  previewNeeds?: "product" | "collection";
  topSections: string[];
  sections: SectionInstanceDef[];
  bottomSections: string[];
}

export interface FontDef {
  id: string;
  label: string;
  family: string;
  weights: number[];
  category: "sans" | "serif" | "display" | "mono";
}

export interface ColorSchemeDef {
  id: string;
  label: string;
  colors: {
    background: string;
    text: string;
    primary: string;
    buttonBg: string;
    buttonText: string;
  };
}

export interface PaletteDef {
  id: string;
  label: string;
  colors: Record<string, string>;
}

export interface StylePresetDef {
  id: string;
  label: string;
  description: string;
  values: Record<string, unknown>;
}

export interface ThemeManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  rendererId: string;
  capabilities: Record<string, boolean>;
  fonts: FontDef[];
  colorSchemes: ColorSchemeDef[];
  palettes: PaletteDef[];
  stylePresets: StylePresetDef[];
  global: SettingGroupDef[];
  pages: PageDef[];
  sectionTypes: SectionTypeDef[];
  blockTypes: BlockTypeDef[];
  presets: Record<string, SettingDef[]>;
  icons: string[];
}

export interface SectionCustomization {
  type?: string;
  hidden?: boolean;
  settings?: Record<string, unknown>;
  elements?: Record<string, Record<string, unknown>>;
  blocks?: {
    order?: string[];
    items?: Record<
      string,
      {
        type?: string;
        hidden?: boolean;
        settings?: Record<string, unknown>;
        elements?: Record<string, Record<string, unknown>>;
      }
    >;
  };
}

export interface Customization {
  schemaVersion: 1;
  themeId: string;
  themeVersion: string;
  updatedAt?: string;
  global: Record<string, Record<string, unknown>>;
  structure: {
    pages: Record<PageId, { order?: string[]; added?: SectionInstanceDef[]; removed?: string[] }>;
    globalTop?: string[];
    globalBottom?: string[];
  };
  sections: Record<string, SectionCustomization>;
}

export type ExternalTarget =
  | "themes"
  | "store-info"
  | "social-links"
  | "policies"
  | "navigation-menus"
  | "products"
  | "categories"
  | "pages"
  | "shipping"
  | "payments"
  | "media-library";

export interface MediaAsset {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  tags: string[];
}

export interface ProductLite {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  badge?: string;
  images: string[];
  categoryId: string;
  inStock: boolean;
  shortDescription?: string;
}

export interface CategoryLite {
  id: string;
  name: string;
  image?: string;
  productCount: number;
}

export interface StorePageLite {
  id: string;
  title: string;
  kind: "page" | "policy";
}

export interface Store {
  name: string;
  description: string;
  logoUrl: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  currency: string;
  social: Record<string, string>;
  menus: { id: string; label: string; items: { label: string; href: string }[] }[];
}

export interface EditorAdapter {
  getStore(): Promise<Store>;
  getThemeManifest(): Promise<ThemeManifest>;
  getCustomization(): Promise<Customization>;
  listMedia(): Promise<MediaAsset[]>;
  listProducts(q?: { search?: string; categoryId?: string }): Promise<ProductLite[]>;
  listCategories(): Promise<CategoryLite[]>;
  listPages(): Promise<StorePageLite[]>;
  saveCustomization(c: Customization): Promise<void>;
  uploadMedia(file: File): Promise<MediaAsset>;
  navigate(to: "back" | "personalizar" | "editor"): void;
  openExternal(target: ExternalTarget, ctx?: { label?: string; id?: string }): void;
  getStoreUrl(): string;
}
