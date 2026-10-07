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
- `themes/lume/` — **tema padrão da plataforma** (manifesto + renderer). Reproduz o visual de `lib/store/themes/lume`.
- `themes/registry.tsx` — liga `themeId` → manifesto + renderer. É o único sítio que conhece os temas; o editor e o preview pedem sempre ao registo (`ThemeRenderer`, `resolveEditorTheme`, `DEFAULT_THEME_ID`).
- `themes/demo-commerce/` — tema de demonstração antigo, só como referência de desenvolvimento (já não é o padrão).
- `mocks/` — loja, produtos, imagens e `mockAdapter` (guarda no `localStorage` do navegador).
- `ui/` — componentes de interface do editor (copiados do shadcn), com os pop-ups desenhados dentro de `.ed-root`.
- `pages/` — as duas páginas (cliente) que juntam adaptador + editor.
- `editor.css` — estilos, **limitados a `.ed-root`** (o resto do painel não muda).

## O que ainda é de demonstração (a ligar a seguir)
1. `mocks/adapter.ts` → adaptador real (Supabase): `getCustomization` / `saveCustomization`, imagens, produtos, categorias, `getStoreUrl`.
2. ~~`themes/demo-commerce/` → manifesto + renderer do Lume~~ ✅ feito: `themes/lume/` é o tema padrão (editor + preview).
3. A loja pública (`app/loja/[slug]`) passa a ler a mesma customização e a usar o mesmo renderer em modo `live`.

## Dependências novas
`@radix-ui/react-alert-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-slider`.

## Adicionar um tema novo (depois do Lume)
1. Criar `themes/<id>/manifest.ts` e `themes/<id>/Renderer.tsx` (copiar a estrutura de `themes/lume/`).
2. Acrescentar uma linha em `THEMES` no `themes/registry.tsx`.
Nada mais muda: `EditorShell`, "Personalizar loja" e o adaptador só falam com o registo.

## Notas do tema Lume
- Os valores por omissão do manifesto são os do tema público (oklch convertido para hex). Customização vazia = loja pública.
- O renderer **não** usa classes semânticas do Tailwind (`bg-background`…): dentro de `.ed-root` essas variáveis têm as cores do editor. Todas as cores vêm dos tokens resolvidos.
- Customizações guardadas por outro tema (ex.: `demo-commerce`) são descartadas pelo adaptador de demonstração.

## Da customização à loja pública (Lume)
Fluxo completo: **editor → Supabase → loja pública**.
1. O editor guarda a customização com a server action `saveTemaPersonalizacao` (`lib/mutations/personalizacao.ts`) em `lojas.tema_personalizacao` (JSON). A loja é sempre a do utilizador autenticado.
2. A loja pública (`app/loja/[slug]`) já lê essa coluna (`lib/queries/lojaPublica.ts`). A entrada do tema (`lib/store/themes/lume/index.tsx`, componente de servidor) chama `buildLumePersonalizacao` (`lib/store/themes/lume/lib/personalizacao.ts`) e passa ao tema uma versão leve e validada.
3. Só se aplica o que **difere do tema por omissão** (cálculo: customização do lojista vs. customização vazia). Sem personalização, a loja é idêntica ao Lume original.
4. O tema aplica a personalização por variáveis CSS, uma folha de estilo limitada a `.theme-lume` e marcadores `data-sy="…"` nos componentes.

**Regra de ouro:** o manifesto só oferece controlos que a loja pública aplica. Para novos controlos: (1) acrescentar ao manifesto, (2) tratar em `personalizacao.ts`, (3) pôr o marcador `data-sy` no componente do tema.

**Antes de usar:** correr `migrations/add_tema_personalizacao.sql` no Supabase.

**Ainda não aplicado na loja pública** (propositadamente fora do manifesto): imagem de fundo do banner, logótipo, páginas além da inicial.

## Funcionalidades novas do editor (sincronizado com o editor do Lovable)
- **Páginas internas** (Lume): Produtos, Produto, Favoritos, Finalizar compra e Conta (só leitura), Sobre, Envios, Trocas, Termos e Contacto.
- **Painéis**: menu lateral (lista de links editável — `navList`), pesquisa e carrinho lateral. Abrem pelos ícones do cabeçalho.
- **Barra inferior fixa** (telemóvel) com interruptores para pesquisa, favoritos e carrinho.
- **Segundo toque abre**: tocar num elemento seleciona-o; tocar outra vez abre o destino (ícones do cabeçalho, cartões de produto).
- Motor: `editor/core/openAction.ts`, `editor/core/validate.ts`, `editor/ui/controls/NavListControl.tsx`, secções `fixed` e `overlay` no contrato.
- Lume: `themes/lume/manifest-ext.ts` (declara tudo isto) e `themes/lume/page-text.ts` (textos originais, partilhados com a loja pública).
- Na loja pública: `personalizacao.ts` aplica títulos das páginas, textos do carrinho/pesquisa/botões, menu lateral, barra inferior e colunas das grelhas. Textos vazios no editor = texto original do Lume.
