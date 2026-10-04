# theme-editor — Personalizar loja + Editor

Veio do protótipo do Lovable (`shopyump-editor-ronda4-v9`). Estado atual: **funciona com dados de demonstração**.

## Rotas
| URL | Ficheiro | Onde |
|---|---|---|
| `/dashboard/personalizar` | `app/(dashboard)/personalizar/page.tsx` | dentro da moldura do painel |
| `/dashboard/personalizar/editor` | `app/(editor)/personalizar/editor/page.tsx` | **ecrã inteiro** (sem menu), com a mesma proteção de sessão |
| `/dashboard/loja` | `app/(dashboard)/loja/page.tsx` | só redireciona para `/personalizar` |

> Não usar `/loja/...` para o editor: o middleware trata `/loja/<qualquer coisa>` como loja pública (sem login).

## Pastas
- `editor/` — o editor universal (contratos, núcleo, SDK, painéis, controlos). Não conhece nenhum tema.
- `themes/demo-commerce/` — tema de demonstração (manifesto + renderer). **O Lume entra aqui ao lado.**
- `mocks/` — loja, produtos, imagens e `mockAdapter` (guarda no `localStorage` do navegador).
- `ui/` — componentes de interface do editor (copiados do shadcn), com os pop-ups desenhados dentro de `.ed-root`.
- `pages/` — as duas páginas (cliente) que juntam adaptador + editor.
- `editor.css` — estilos, **limitados a `.ed-root`** (o resto do painel não muda).

## O que ainda é de demonstração (a ligar a seguir)
1. `mocks/adapter.ts` → adaptador real (Supabase): `getCustomization` / `saveCustomization`, imagens, produtos, categorias, `getStoreUrl`.
2. `themes/demo-commerce/` → manifesto + renderer do **Lume**.
3. A loja pública (`app/loja/[slug]`) passa a ler a mesma customização e a usar o mesmo renderer em modo `live`.

## Dependências novas
`@radix-ui/react-alert-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-slider`.
