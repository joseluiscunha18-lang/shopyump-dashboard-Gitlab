-- Bloqueio do registo público enquanto o Shopyump está em desenvolvimento.
-- JÁ APLICADO no projeto Supabase "shopyump" (migração `bloquear_registo_publico`).
-- Este ficheiro serve só de documentação / para recriar noutro ambiente.
--
-- Só os e-mails da tabela `registo_permitidos` podem criar conta (formulário, Google, convite, "Add user").
-- Quem já tem conta NÃO é afetado: o trigger só corre ao CRIAR um utilizador novo.
--
-- Para dar acesso a mais alguém:
--   insert into public.registo_permitidos (email, nota) values ('pessoa@exemplo.com', 'testes');
-- Para remover alguém da lista (não apaga a conta, só impede novas criações com esse e-mail):
--   delete from public.registo_permitidos where email = 'pessoa@exemplo.com';
-- Para reabrir o registo a toda a gente:
--   drop trigger bloquear_registo_publico on auth.users;
-- Para voltar a fechar:
--   volta a correr o `create trigger` no fim deste ficheiro.
--
-- Nota: quando o trigger recusa um e-mail, o Supabase devolve "Database error saving new user".
-- A app traduz esse erro para "O registo está indisponível" em lib/auth/client.ts (função traduzir).

create table if not exists public.registo_permitidos (
  email text primary key check (email = lower(email)),
  nota text,
  criado_em timestamptz not null default now()
);

-- RLS ligado e sem políticas: ninguém acede pela API pública; só o dono da base de dados.
alter table public.registo_permitidos enable row level security;
revoke all on public.registo_permitidos from anon, authenticated;

-- Os administradores ficam logo permitidos (mantém o acesso de desenvolvedor).
insert into public.registo_permitidos (email, nota)
select lower(email), 'admin (copiado da tabela admins)' from public.admins
on conflict (email) do nothing;

create or replace function public.bloquear_registo_publico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.registo_permitidos p where p.email = lower(new.email)) then
    return new;
  end if;
  raise exception 'Registo indisponível: o Shopyump está em desenvolvimento.' using errcode = 'P0001';
end;
$$;

drop trigger if exists bloquear_registo_publico on auth.users;
create trigger bloquear_registo_publico
  before insert on auth.users
  for each row execute function public.bloquear_registo_publico();
