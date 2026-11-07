# shopyump-router (Cloudflare Worker)

Router das lojas + escrita de analytics no Cloudflare Analytics Engine.
O código em produção vive na Cloudflare; **este ficheiro é a cópia versionada** — se mudares um, muda o outro.

## Como pôr em produção (uma vez, ~3 minutos)

1. **Cloudflare → Workers & Pages → `shopyump-router` → Edit code**: cola o conteúdo de `index.js` e faz *Deploy*.
   > É seguro fazer isto antes do passo 2: sem os bindings, o Worker comporta-se exatamente como antes (só reencaminha).
2. **Settings → Bindings → Add → Analytics Engine** (duas vezes):
   | Variable name | Dataset |
   |---|---|
   | `PAGE_VIEWS` | `shopyump_page_views` |
   | `VISIT_SUMMARY` | `shopyump_visit_summary` |
3. **Settings → Variables and Secrets → Add → Secret**: `ANALYTICS_SALT` = uma frase aleatória longa (ex.: gerada com `openssl rand -hex 32`).
   Mantém-na igual para sempre — é o que torna o `visitor_id` diário impossível de reverter.
4. Os datasets criam-se sozinhos na primeira escrita. Abre uma loja (`nome.shopyump.com`) e, ~1 min depois, confirma em
   **Analytics Engine → Query** (ou com a SQL API): `SELECT * FROM shopyump_page_views ORDER BY timestamp DESC LIMIT 5`.

## O que o Worker regista

- **Page view** (servidor, dentro do pedido que já existe): só navegações reais — ignora assets, prefetch do Next.js e robôs (incl. a pré-visualização do WhatsApp).
- **Resumo da visita** (`POST /__sy/summary`, 1 beacon por visita vindo do browser): produtos vistos, duração, páginas, clique no WhatsApp.
- `visitor_id = SHA-256(ip + user-agent + sal do dia)`. O IP nunca é guardado.
- O "dia" é o dia local de Moçambique (UTC+2).

## Limites confirmados na documentação oficial da Cloudflare

- 20 blobs + 20 doubles + 1 index por registo; **16 KB** no total de blobs por registo; index ≤ 96 bytes; 250 escritas por invocação.
- **Retenção dos dados em bruto: 3 meses** → por isso existe a tabela `analytics_diario` no Supabase (histórico permanente).

## Esquema (a ordem é o esquema — só acrescentar no fim)

Ver os comentários acima de `recordPageView` e `recordSummary` em `index.js`.
