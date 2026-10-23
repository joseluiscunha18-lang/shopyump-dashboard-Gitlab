-- Diz à interface como uma conta entra, para o ecrã de login/registo mostrar o
-- caminho certo (só Google, e-mail+senha, ou confirmar e-mail).
-- Executar UMA vez no Supabase: SQL Editor → colar → Run.
--
-- Devolve: 'senha' | 'google' | 'ambos' | 'pendente' | 'nenhum'
-- Nota: revela se um e-mail está registado (necessário para este fluxo, igual
-- ao de Shopify/Google). Não devolve mais nada sobre a conta.

create or replace function public.auth_metodo_por_email(p_email text)
returns text
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  u auth.users%rowtype;
  tem_senha boolean;
  tem_google boolean;
begin
  select * into u from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if not found then
    return 'nenhum';
  end if;

  if u.email_confirmed_at is null then
    return 'pendente';
  end if;

  tem_senha  := coalesce(u.encrypted_password, '') <> '';
  tem_google := exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google');

  if tem_senha and tem_google then return 'ambos'; end if;
  if tem_google then return 'google'; end if;
  return 'senha';
end;
$$;

revoke all on function public.auth_metodo_por_email(text) from public;
grant execute on function public.auth_metodo_por_email(text) to anon, authenticated;
