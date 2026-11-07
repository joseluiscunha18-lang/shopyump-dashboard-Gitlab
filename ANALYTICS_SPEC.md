# Shopyump — Analytics de Lojas (via Cloudflare Analytics Engine)

> Ficheiro de especificação técnica. Objetivo: dar a uma IA (ou a um dev) tudo o que precisa para implementar isto de ponta a ponta — Cloudflare, Supabase, Vercel/Next.js — sem ter de reconstruir o raciocínio de negócio. Tudo o que está marcado como **⚠️ Confirmar antes de codar** tem de ser verificado no código real do repo antes de avançar.

---

## 1. Problema e decisão

O objetivo é medir **visitas, produtos vistos, origem do tráfego, dispositivo, país e cliques em WhatsApp** por loja, sem:
- Pagar por ferramenta de terceiros (PostHog, GA) a longo prazo.
- Multiplicar pedidos HTTP por cada ação do visitante (não escalável a custo zero).
- Expor a base de dados de analytics diretamente ao navegador do lojista.

**Decisão:** usar o **Cloudflare Analytics Engine**, escrevendo o evento de entrada *dentro* do pedido que o `shopyump-router` já processa (não é um pedido extra — é a mesma execução). O navegador só faz, no máximo, **1 pedido por visita**:

| Como a visita termina | Pedidos do navegador |
|---|---|
| Visitante clica no WhatsApp | **1** pedido (resumo de navegação + sinal de clique, combinados) |
| Visitante sai sem clicar em nada | **1** pedido (resumo de navegação, disparado por `visibilitychange`) |
| Visitante não faz nada e a aba nunca fica "hidden" (raro) | **0** pedidos extra — só fica o evento de entrada do router |

O pedido de **entrada** na loja (`visit_started` / page view) nunca é perdido, porque é escrito no servidor, dentro do próprio Worker que já serve o pedido — não depende de JavaScript nem de o visitante ficar até ao fim.

---

## 2. Arquitetura (visão geral)

```
Visitante
   │
   │ 1. GET loja.shopyump.com/produto/x
   ▼
┌─────────────────────────────┐
│  Cloudflare Worker (router)  │──► escreve no Analytics Engine (page_view)
│  (shopyump-router)           │     • loja (pelo host do pedido)
│                               │     • página / produto (pelo path)
│                               │     • referer, utm_*, user-agent, país (cf.colo/cf.country)
│                               │     • visitor_id (hash diário, sem cookies)
└───────────────┬───────────────┘
                │ serve a página normalmente (sem atraso)
                ▼
         Loja (Next.js / app/loja)
                │
                │ 2. JS no browser (track.ts) acumula produtos vistos
                │    em memória (sem enviar nada)
                │
     ┌──────────┴──────────┐
     │                      │
clica WhatsApp        fica "hidden" (visibilitychange) / fecha
     │                      │
     ▼                      ▼
 sendBeacon(1 pedido)  sendBeacon(1 pedido)
 {resumo + whatsapp}   {resumo}
     │                      │
     └──────────┬───────────┘
                ▼
   POST /api/analytics/summary  (rota própria, não é o router)
                │
                ▼
   Worker/Function grava no Analytics Engine (visit_summary)
                │
                ▼
┌───────────────────────────────┐
│  Página "Análises" (dashboard) │
│  chama /api/analytics/query    │
│  (valida sessão + loja)        │
│  → consulta Analytics Engine   │
│    com chave só-de-leitura     │
└───────────────────────────────┘

   Em paralelo, sempre que há uma venda:
   Pedido → grava-se DIRETO no Supabase (tabela `pedidos`), como já acontece hoje.
   A conversão é calculada juntando visitas (Analytics Engine) + pedidos (Supabase).
```

---

## 3. Eventos e esquema de dados

O Analytics Engine guarda cada registo com até **20 "blobs" (texto)** e **20 "doubles" (números)**, mais um `index` (chave de agrupamento, usada para amostragem). Não há colunas nomeadas — o nome vem da ordem. Documentar bem a ordem é crítico.

### 3.1 Dataset `PAGE_VIEWS` (escrito pelo router, no servidor)

| Campo | Tipo | Origem | Observações |
|---|---|---|---|
| `index1` | blob | `loja_id` (ou slug) | chave de agrupamento/amostragem |
| `blob1` | blob | `loja_id` | repetido para poder filtrar sem depender só do index |
| `blob2` | blob | path do pedido (`/produto/abc`) | permite extrair produto |
| `blob3` | blob | `referer` (cru) | para calcular origem |
| `blob4` | blob | `utm_source` | vazio se não existir |
| `blob5` | blob | `utm_medium` | vazio se não existir |
| `blob6` | blob | `utm_campaign` | vazio se não existir |
| `blob7` | blob | device type (`mobile`/`desktop`/`tablet`, derivado do User-Agent) | |
| `blob8` | blob | país (`request.cf.country`) | grátis, vem da Cloudflare |
| `blob9` | blob | `visitor_id` (hash diário, ver §4) | para contar únicos |
| `double1` | double | timestamp (epoch ms) | redundante com o timestamp nativo, mas facilita queries |

### 3.2 Dataset `VISIT_SUMMARY` (escrito pela rota `/api/analytics/summary`, chamada do browser)

| Campo | Tipo | Origem | Observações |
|---|---|---|---|
| `index1` | blob | `loja_id` | |
| `blob1` | blob | `visit_id` (gerado no browser ao entrar) | liga ao `page_view` da mesma visita |
| `blob2` | blob | lista de produtos vistos (IDs, separados por vírgula, máx. ~20) | truncar para caber no limite de tamanho do blob (~5 KB por registo) |
| `blob3` | blob | `"whatsapp_click"` ou `""` | presente = houve clique nesta visita |
| `double1` | double | duração da visita em segundos | `Date.now() - inicio` no momento do envio |
| `double2` | double | nº de páginas vistas na visita | contador simples incrementado a cada "página de produto" aberta |

> ⚠️ **Confirmar antes de codar:** limites exatos de tamanho por blob e por registo no Analytics Engine (documentação oficial: https://developers.cloudflare.com/analytics/analytics-engine/). Truncar a lista de produtos se necessário.

---

## 4. `visitor_id` sem cookies

```
visitor_id = SHA256(ip_do_pedido + user_agent + sal_do_dia)
```

- O "sal do dia" é uma string que muda todos os dias (ex.: `YYYY-MM-DD` + um segredo fixo guardado no Worker). Isto faz o `visitor_id` mudar todos os dias — conta "visitantes únicos por dia" sem conseguir seguir a pessoa ao longo do tempo. É a abordagem que a própria Cloudflare documenta para analytics sem cookies.
- Não se guarda IP em lado nenhum — só entra na função de hash, nunca é persistido.

---

## 5. Supabase — o que muda

**Nada na escrita de pedidos.** A tabela `pedidos` continua exatamente como está — gravação imediata, sem passar pelo Analytics Engine.

**O que se adiciona (opcional, mas recomendado):**

Uma tabela de **resumo diário**, alimentada por um job agendado (Cron Trigger do Worker, 1x/dia), porque o Analytics Engine só guarda os dados em bruto durante ~90 dias (⚠️ confirmar prazo exato na doc da Cloudflare).

```sql
create table analytics_diario (
  loja_id uuid not null references lojas(id),
  dia date not null,
  visitas integer not null default 0,
  visitantes_unicos integer not null default 0,
  cliques_whatsapp integer not null default 0,
  produtos_mais_vistos jsonb, -- [{produto_id, vistas}, ...]
  origens jsonb,              -- [{fonte: 'instagram', visitas}, ...]
  dispositivos jsonb,         -- {mobile: n, desktop: n, tablet: n}
  paises jsonb,
  primary key (loja_id, dia)
);
```

Isto dá histórico permanente e barato (poucas linhas por loja por dia) mesmo depois de o Analytics Engine "esquecer" os dados em bruto.

---

## 6. Rotas novas a criar

| Rota | Onde corre | O que faz |
|---|---|---|
| `POST /api/analytics/summary` | Vercel (Next.js API route) ou Worker dedicado | Recebe o `sendBeacon` do browser, valida campos, escreve no dataset `VISIT_SUMMARY` |
| `GET /api/analytics/query` | Vercel (Next.js API route) | Valida sessão + que a loja pertence ao utilizador autenticado, consulta o Analytics Engine (SQL API) com uma chave **só de leitura**, devolve JSON para a página Análises |

> A chave de leitura do Analytics Engine fica só em variável de ambiente na Vercel — nunca chega ao browser do lojista.

---

## 7. Página "Análises" — funcionalidades a construir

Agrupadas por bloco, da mais simples/barata para a mais avançada. Quanto mais destas existirem, melhor — a ideia é usar ao máximo os dados que já estamos a recolher.

### 7.1 Visão geral (já existe parcialmente — expandir)
- Visitas no período (dia/7d/30d/90d, com comparação ao período anterior, como já existe em `VisaoGeral.tsx`)
- Visitantes únicos vs. visitas totais (taxa de repetição)
- Taxa de conversão = pedidos ÷ visitas (junta Supabase + Analytics Engine)
- Duração média da visita
- Páginas vistas por visita (profundidade de navegação)

### 7.2 Produtos
- **Produtos mais vistos** (ranking, com contagem)
- **Produtos vistos mas nunca comprados** (gap entre vistas e pedidos — ótimo para o lojista perceber o que "quase vendeu")
- Taxa de conversão por produto (vistas → pedidos daquele produto, via Supabase)

### 7.3 Origem do tráfego
- Por fonte: Instagram, Facebook, WhatsApp, direto, Google, outro (derivado do `referer` e `utm_source`)
- Por campanha (`utm_campaign`), para o lojista avaliar anúncios/promoções
- Comparação de conversão por origem (ex.: "tráfego do Instagram converte 2x melhor que o direto")

### 7.4 Dispositivo e geografia
- Split mobile vs. desktop vs. tablet
- Top países/cidades (se quiser ir mais longe, `request.cf.city`, mas confirmar se está disponível no plano)

### 7.5 Comportamento no WhatsApp
- Taxa de cliques no WhatsApp por visita
- Taxa de cliques → pedido (quantos de quem clicou acabou por comprar, cruzando com Supabase por período/hora, já que não há ligação direta 1-para-1 sem o pedido referenciar a visita)

### 7.6 Padrões temporais
- Horas de pico (gráfico por hora do dia)
- Dias da semana mais fortes
- Tendência ao longo do tempo (gráfico diário/semanal dos últimos 30-90 dias, usando a tabela `analytics_diario`)

### 7.7 Exportação e partilha
- Exportar CSV/Excel do período selecionado (aproveita a skill de `xlsx` já disponível no sistema)
- (Futuro) relatório semanal automático por email ao lojista

---

## 8. O que falta confirmar no código real antes de implementar

Marcar como tarefa de investigação antes de escrever qualquer linha:

1. **Onde o router intercepta o pedido** — confirmar ficheiro/rota do `shopyump-router` e como identifica a loja a partir do host (`loja.shopyump.com`).
2. **Estrutura de `app/loja`** — como a navegação entre produtos acontece (SPA client-side ou full page load?) para saber se cada "produto visto" gera um pedido novo ao router ou só um evento client-side.
3. **Formato do link do WhatsApp** (`wa.me/...`) usado hoje na loja, para saber onde encaixar o `sendBeacon` antes da navegação.
4. **Confirmar preços e limites atuais** na doc oficial da Cloudflare antes de dimensionar custos para o lojista:
   - https://developers.cloudflare.com/analytics/analytics-engine/pricing
   - https://developers.cloudflare.com/workers/platform/pricing/
5. **Prazo de retenção dos dados em bruto** no Analytics Engine (assumido ~90 dias, confirmar).

---

## 9. Checklist de implementação (ordem sugerida)

- [ ] Ler `shopyump-router` e `app/loja` (read-only) para confirmar os pontos do §8
- [ ] Criar o binding do Analytics Engine no `wrangler.toml` do router (dataset `PAGE_VIEWS`)
- [ ] Adicionar a escrita do evento de entrada dentro do handler existente do router (sem bloquear a resposta — `ctx.waitUntil`)
- [ ] Criar `lib/analytics/track.ts` no front-end: acumula produtos vistos em memória, gera `visit_id`, escuta `visibilitychange`
- [ ] Ligar o clique no botão WhatsApp a enviar o resumo combinado via `navigator.sendBeacon`
- [ ] Criar rota `/api/analytics/summary` (recebe o beacon, escreve no dataset `VISIT_SUMMARY`)
- [ ] Criar rota `/api/analytics/query` (lê, valida sessão/loja, consulta via SQL API do Analytics Engine)
- [ ] Criar job diário (Cron Trigger) que agrega para `analytics_diario` no Supabase
- [ ] Construir/expandir a página Análises com os blocos do §7
- [ ] Configurar variáveis de ambiente na Vercel (chave de leitura do Analytics Engine)
- [ ] Testar: visita normal, visita com clique WhatsApp, visita que volta depois de "hidden"

---

## 10. Custos (resumo, à data deste documento — confirmar sempre os links do §8.4)

| Item | Incluído no plano Paid ($5/mês) | Acima disso |
|---|---|---|
| Pedidos ao Worker | 10 milhões/mês | $0,30/milhão |
| Escrita no Analytics Engine | 10 milhões/mês | $0,25/milhão |
| Leitura (consultas da página Análises) | 1 milhão/mês | $1,00/milhão |

A Cloudflare ainda não cobra pelo Analytics Engine à data deste documento — os valores acima são os publicados para cobrança futura. Com no máximo 1 pedido extra do browser por visita, o custo por visitante é marginal mesmo a milhões de visitas/mês.
