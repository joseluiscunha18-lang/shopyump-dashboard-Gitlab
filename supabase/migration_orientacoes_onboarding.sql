-- ============================================================================
-- Orientações de primeiro acesso (Início do dashboard) — conclusão fiável e persistente.
-- Aditiva e idempotente: pode ser executada mais do que uma vez.
-- Estados por orientação (tabela loja_marcos): pendente (sem linha) · concluída (concluido_em) · dispensada (dispensado).
-- JÁ APLICADA no projeto Supabase "shopyump" em 2026-10-27 (migração "orientacoes_onboarding").
-- ============================================================================

-- 1) Configuração de pagamentos da loja (antes só existia em memória no browser).
--    Tabela PRÓPRIA e privada: "lojas" tem leitura pública, e aqui há dados bancários (NIB, titular).
create table if not exists public.loja_pagamentos (
  loja_id    uuid primary key references public.lojas(id) on delete cascade,
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.loja_pagamentos enable row level security;

-- Neste projeto as tabelas novas NÃO recebem permissões automáticas: concede-se só o necessário
-- (o dono, via RLS, é o único que chega às linhas; o visitante anónimo não tem qualquer acesso).
revoke all on public.loja_pagamentos from anon, authenticated;
grant select, insert, update, delete on public.loja_pagamentos to authenticated;
grant all on public.loja_pagamentos to service_role;

drop policy if exists "dono lê os próprios pagamentos" on public.loja_pagamentos;
drop policy if exists "dono insere os próprios pagamentos" on public.loja_pagamentos;
drop policy if exists "dono atualiza os próprios pagamentos" on public.loja_pagamentos;
drop policy if exists "dono apaga os próprios pagamentos" on public.loja_pagamentos;

create policy "dono lê os próprios pagamentos" on public.loja_pagamentos for select to authenticated
  using (exists (select 1 from public.lojas l where l.id = loja_id and l.perfil_id = (select auth.uid())));
create policy "dono insere os próprios pagamentos" on public.loja_pagamentos for insert to authenticated
  with check (exists (select 1 from public.lojas l where l.id = loja_id and l.perfil_id = (select auth.uid())));
create policy "dono atualiza os próprios pagamentos" on public.loja_pagamentos for update to authenticated
  using (exists (select 1 from public.lojas l where l.id = loja_id and l.perfil_id = (select auth.uid())))
  with check (exists (select 1 from public.lojas l where l.id = loja_id and l.perfil_id = (select auth.uid())));
create policy "dono apaga os próprios pagamentos" on public.loja_pagamentos for delete to authenticated
  using (exists (select 1 from public.lojas l where l.id = loja_id and l.perfil_id = (select auth.uid())));

-- 2) Regista um marco como CONCLUÍDO sem apagar uma dispensa anterior e sem repor uma conclusão antiga.
--    (Antes: "on conflict do nothing" → quem dispensasse um cartão nunca o via concluído.)
--    Só os triggers a usam: não pode ficar exposta via API.
create or replace function public.registar_marco_concluido(p_loja_id uuid, p_marco text, p_ref uuid default null)
returns void
language sql
security definer
set search_path to 'public'
as $$
  insert into public.loja_marcos (loja_id, marco, concluido_em, referencia_id)
  values (p_loja_id, p_marco, now(), p_ref)
  on conflict (loja_id, marco) do update
    set concluido_em  = coalesce(public.loja_marcos.concluido_em, excluded.concluido_em),
        referencia_id = coalesce(public.loja_marcos.referencia_id, excluded.referencia_id);
$$;
revoke all on function public.registar_marco_concluido(uuid, text, uuid) from public, anon, authenticated;

-- 3) Primeiro produto: conta quando existe um produto PUBLICADO (ativo e não rascunho).
--    Agora também ao publicar um rascunho mais tarde (antes só corria no INSERT).
create or replace function public.gerir_marco_primeiro_produto()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  total_publicados integer;
begin
  if new.ativo is not true or coalesce(new.rascunho, false) = true then
    return new;
  end if;

  select count(*) into total_publicados
  from public.produtos
  where loja_id = new.loja_id
    and ativo = true
    and coalesce(rascunho, false) = false;

  if total_publicados >= 1 then
    perform public.registar_marco_concluido(new.loja_id, 'primeiro_produto', new.id);
  end if;

  -- Mantém o comportamento anterior: com mais de um produto, a celebração do 1.º deixa de fazer sentido.
  if total_publicados > 1 then
    update public.loja_marcos
    set dispensado = true
    where loja_id = new.loja_id and marco = 'primeiro_produto' and dispensado = false;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_gerir_marco_primeiro_produto on public.produtos;
create trigger trg_gerir_marco_primeiro_produto
  after insert or update of ativo, rascunho on public.produtos
  for each row execute function public.gerir_marco_primeiro_produto();

-- 4) Personalizar a loja: só alterações de APRESENTAÇÃO guardadas (nome, descrição, banner, tema/editor).
--    Contactos (WhatsApp, e-mail) e redes sociais NÃO contam; criar a loja também não.
create or replace function public.gerir_marco_personalizar_loja()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(nullif(btrim(new.nome), ''), '')            is distinct from coalesce(nullif(btrim(old.nome), ''), '')
  or coalesce(nullif(btrim(new.descricao), ''), '')       is distinct from coalesce(nullif(btrim(old.descricao), ''), '')
  or coalesce(nullif(btrim(new.banner_url), ''), '')      is distinct from coalesce(nullif(btrim(old.banner_url), ''), '')
  or coalesce(nullif(btrim(new.banner_botao), ''), '')    is distinct from coalesce(nullif(btrim(old.banner_botao), ''), '')
  or coalesce(new.theme_id, '')                           is distinct from coalesce(old.theme_id, '')
  or (new.tema_personalizacao - 'updatedAt')              is distinct from (old.tema_personalizacao - 'updatedAt')
  then
    perform public.registar_marco_concluido(new.id, 'personalizar_loja');
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_gerir_marco_personalizar_loja on public.lojas;
create trigger trg_gerir_marco_personalizar_loja
  after update of nome, descricao, banner_url, banner_botao, theme_id, tema_personalizacao on public.lojas
  for each row execute function public.gerir_marco_personalizar_loja();

-- 5) Pagamentos: concluído quando há pelo menos um método configurado E ativo.
--    · Transferência: ativa e com banco, titular e NIB/conta preenchidos.
--    · Dinheiro na entrega: ativo.
create or replace function public.pagamentos_tem_metodo_ativo(p jsonb)
returns boolean
language sql
immutable
set search_path to 'public'
as $$
  select coalesce(
    ( (p -> 'transferencia') = 'true'::jsonb
      and btrim(coalesce(p ->> 'banco', ''))   <> ''
      and btrim(coalesce(p ->> 'titular', '')) <> ''
      and btrim(coalesce(p ->> 'conta', ''))   <> '' )
    or (p -> 'dinheiroEntrega') = 'true'::jsonb,
    false);
$$;

create or replace function public.gerir_marco_configurar_pagamentos()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.pagamentos_tem_metodo_ativo(new.config) then
    perform public.registar_marco_concluido(new.loja_id, 'configurar_pagamentos');
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_gerir_marco_configurar_pagamentos on public.loja_pagamentos;
create trigger trg_gerir_marco_configurar_pagamentos
  after insert or update of config on public.loja_pagamentos
  for each row execute function public.gerir_marco_configurar_pagamentos();
