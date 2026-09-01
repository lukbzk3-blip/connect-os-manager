-- 1) Bloqueia remover a última role admin
create or replace function public.protege_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin'::public.app_role then
    if (select count(*) from public.user_roles where role = 'admin'::public.app_role) <= 1 then
      raise exception 'Não é possível remover o único administrador. Transfira a administração antes.';
    end if;
  end if;
  return old;
end; $$;

drop trigger if exists user_roles_protege_ultimo_admin on public.user_roles;
create trigger user_roles_protege_ultimo_admin
before delete on public.user_roles
for each row execute function public.protege_ultimo_admin();

-- 2) Bloqueia desativar o único administrador
create or replace function public.protege_admin_ativo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.ativo and not new.ativo
     and exists (select 1 from public.user_roles ur where ur.user_id = new.id and ur.role = 'admin'::public.app_role)
     and (select count(*) from public.user_roles where role = 'admin'::public.app_role) <= 1 then
    raise exception 'Não é possível desativar o único administrador. Transfira a administração antes.';
  end if;
  return new;
end; $$;

drop trigger if exists profiles_protege_admin_ativo on public.profiles;
create trigger profiles_protege_admin_ativo
before update on public.profiles
for each row execute function public.protege_admin_ativo();

-- 3) Transferência atômica de administração
create or replace function public.transferir_admin(novo_admin uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare atual uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem transferir a administração';
  end if;
  if novo_admin = atual then
    raise exception 'Selecione outro usuário para receber a administração';
  end if;
  if not exists (select 1 from public.profiles p where p.id = novo_admin and p.ativo) then
    raise exception 'O novo administrador precisa estar ativo';
  end if;

  insert into public.user_roles (user_id, role)
  values (novo_admin, 'admin'::public.app_role)
  on conflict (user_id, role) do nothing;

  delete from public.user_roles where user_id = atual and role = 'admin'::public.app_role;

  insert into public.user_roles (user_id, role)
  values (atual, 'funcionario'::public.app_role)
  on conflict (user_id, role) do nothing;
end; $$;

revoke all on function public.transferir_admin(uuid) from public, anon;
grant execute on function public.transferir_admin(uuid) to authenticated;
revoke all on function public.protege_ultimo_admin() from public, anon, authenticated;
revoke all on function public.protege_admin_ativo() from public, anon, authenticated;