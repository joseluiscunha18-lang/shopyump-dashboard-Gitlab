# Migração do design Lovable → Next.js

Estado: **Partes 1, 2 e 3** (design + rotas + Supabase). `tsc` passa e `next build` compila.

## Parte 3 — Supabase (feita)
- `lib/supabase/*` reais e `middleware.ts` repostos (cookie `sy_has_loja` agora guarda `<user.id>:1`; só o "sim" é confiável; `/nova-senha` nunca redireciona).
- Queries em `lib/queries/*` usam o cliente do navegador (as páginas correm no cliente); a segurança é a RLS. Mutations continuam Server Actions.
- Autenticação real em `lib/auth/client.ts` (login, registo com código de 6 dígitos, Google, recuperar/nova senha, alterar senha/e-mail, terminar sessão).
- Onboarding cria a loja de verdade (`completeOnboarding`), com verificação de endereço livre na base de dados.
- Início/Análises com visitas reais (`lib/queries/visitas.ts`); Pedidos reais com tempo real e transições pendente→confirmado→enviado→concluído (ou cancelado).
- `moeda` do produto guardada em `mais_opcoes.moeda` (a tabela não tem essa coluna).
- Notificações simuladas removidas (lista vazia até haver notificações reais).

## Ainda NÃO ligado ao Supabase (continua local/demonstração)
- Definições da loja que não existem como colunas em `lojas`: entrega, pagamentos, região, horário, finalização, páginas extra, domínio, cupons, clientes, plano.
- Personalização do tema no ecrã `/personalizar` (cache local); o editor completo (`/personalizar/editor`) já grava via `saveTemaPersonalizacao`.
- Pedidos não têm coluna de origem (WhatsApp/checkout) nem de entrega: a página já não mostra a origem e a entrega é deduzida (total − produtos).

## Segurança (rever na base de dados — não alterado)
- A política `Lojas públicas` (leitura total) deixa qualquer pessoa com a chave anon ler `perfil_id`, `email` e `whatsapp` de todas as lojas; a tabela `admins` também é legível por todos.

(Notas abaixo = partes 1 e 2, mantidas por histórico.)

## Parte 1 e 2 — estado anterior: ainda sem Supabase

## O que foi feito
- Componentes, CSS (`app/globals.css`, `app/dashboard-design.css`), `theme-editor`, tipos e `lib` do Lovable copiados 1:1.
- As 49 rotas TanStack viraram páginas Next (`app/**/page.tsx`). Os ficheiros de rota originais vivem em
  `lib/routes/` SEM reescrita (só mudou o import) e são executados por `lib/route-compat.tsx`.
- `lib/router-compat.tsx`: Link/useNavigate/useRouterState/useSearch sobre o router real do Next (respeita o basePath `/dashboard`).
- `'use client'` adicionado a 31 ficheiros que usam hooks.
- `lib/domains.ts` e `lib/auth/cleanRedirect.ts` mantêm a versão original do Next (basePath/domínios).
- Imagens do tema Lume apontam para `public/tema-lume/products/*.png` (os mesmos caminhos que o Next já usava). ATENÇÃO: no zip que enviaste essas pastas vinham vazias; confirma que as imagens existem no teu repositório (coat, shirt, bag, dress, tee, wallet, hoodie, cap).

## Verificação visual (feita)
- Comparei 10 páginas (desktop e mobile) entre o Lovable original a correr e este projeto Next: 17 de 20 capturas com 0,00% de diferença;
  as outras 3 (<0,25%) são animações (gráfico, carrossel). Erros de consola: nenhum além do `PAGEERROR Event` em /personalizar,
  que o Lovable original também dá (imagens do tema em falta no zip).
- Correções feitas depois da 1.ª entrega: (1) o `<body>` do layout raiz já não força o fundo antigo; (2) o `<Link>` imita o `active`
  automático do TanStack (menu lateral/barra inferior); (3) `lib/supabase/*` usa o simulador do Lovable (o real está arquivado).

## Guardado para ligar o Supabase (pasta `_next-original/`)
- `middleware.ts` (removido por agora: exigia sessão Supabase), `app/` antigo, `lib/queries/*`, `lib/auth/getUserContext.ts`,
  `lib/realtime/usePedidosRealtime.ts`, `types/database.ts`, etc. `lib/supabase/*` REAL está em `_next-original/lib/supabase/` (em `lib/supabase/` está agora o simulador do Lovable).
- Para ligar: repor o middleware, repor `lib/supabase/*` real e trocar o corpo das funções em `lib/queries/*` (mesmos nomes) pelas originais.

## Notas
- Não testei o `next/font` (Inter/Space Grotesk): o ambiente de teste não tinha acesso ao Google Fonts. No vosso ambiente funciona normalmente.
- Login demo: demo@shopyump.com / demo123.
- Os ficheiros `_next-original/` e `tsconfig.json > exclude` podem ser apagados quando a ligação ao Supabase estiver feita.
