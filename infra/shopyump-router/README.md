# shopyump-router — passos manuais na Cloudflare

Este Worker já existe na tua conta Cloudflare (`shopyump-router`, proxy de host
multi-tenant). O `worker.js` aqui dentro é a versão **nova**, que acrescenta a
escrita de analytics — ver `ANALYTICS_SPEC.md` na raiz do repo para o porquê.

Eu não tenho, nesta sessão, acesso para publicar Workers nem para criar
bindings do Analytics Engine — só tu consegues fazer os passos abaixo.

## Opção A — `wrangler` (linha de comandos)

```bash
cd infra/shopyump-router
npx wrangler login              # uma vez, abre o browser
npx wrangler secret put SY_SALT # cola uma string aleatória qualquer quando pedir
npx wrangler deploy
```

O binding do Analytics Engine já está declarado no `wrangler.toml` — o
`wrangler deploy` cria o dataset `shopyump_events` sozinho, na primeira
escrita. Não precisas de criar nada à mão no painel.

## Opção B — painel da Cloudflare (sem linha de comandos)

1. **Workers & Pages → shopyump-router → Settings → Variables and Secrets**
   → *Add* → nome `SY_SALT`, tipo *Secret*, valor: qualquer string aleatória
   longa (ex.: gera uma em https://1password.com/password-generator/).
2. **Settings → Bindings → Add binding → Analytics Engine Dataset**
   → *Variable name*: `ANALYTICS` → *Dataset*: `shopyump_events` (escreve o
   nome, não precisa existir ainda).
3. **Edit code** (ou cola o conteúdo de `worker.js` deste ficheiro) →
   *Deploy*.

## Opção C — ligar ao GitHub (recomendado, resolve isto de vez)

**Workers & Pages → shopyump-router → Settings → Build** → liga este
repositório (`shopyump-dashboard-Gitlab`), define a *Root directory* como
`infra/shopyump-router` e o *Deploy command* como `npx wrangler deploy`. A
partir daí, todo `git push` para `main` que toque nesta pasta publica
sozinho — sem precisares de correr nada à mão outra vez. Os passos 1 e 2 da
Opção B continuam a ter de ser feitos uma vez (secret + binding), o resto
fica automático.

## Como confirmar que está a funcionar

Depois de publicado, abre qualquer loja (`alguma-loja.shopyump.com`) e, no
painel da Cloudflare, vai a **Workers & Pages → shopyump-router → Logs**
(ou **Analytics Engine → shopyump_events**, se já aparecer na lista de
datasets) — deve aparecer tráfego pouco depois da visita. Os dados
agregados chegam ao dashboard (Supabase `analytics_diario`) só no dia
seguinte, via a função `agregar-analytics` (ver `ANALYTICS_SPEC.md`).
