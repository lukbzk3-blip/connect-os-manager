-- Helper: usuário está ativo?
create or replace function public.is_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.ativo from public.profiles p where p.id = auth.uid()), false)
$$;

revoke all on function public.is_ativo() from public, anon;
grant execute on function public.is_ativo() to authenticated;

-- Impede que não-admin altere o próprio campo "ativo" (auto-desbloqueio)
create or replace function public.protege_status_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ativo is distinct from old.ativo and not public.is_admin() then
    raise exception 'Somente administradores podem ativar ou bloquear usuários';
  end if;
  return new;
end; $$;

revoke all on function public.protege_status_perfil() from public, anon, authenticated;

drop trigger if exists profiles_protege_status on public.profiles;
create trigger profiles_protege_status
before update on public.profiles
for each row execute function public.protege_status_perfil();

-- Usuários inativos não escrevem nada no sistema
drop policy if exists clientes_insert on public.clientes;
create policy clientes_insert on public.clientes for insert to authenticated with check (public.is_ativo());
drop policy if exists clientes_update on public.clientes;
create policy clientes_update on public.clientes for update to authenticated
  using (public.is_admin() or (public.is_ativo() and created_by = auth.uid()))
  with check (public.is_admin() or (public.is_ativo() and created_by = auth.uid()));

drop policy if exists aparelhos_insert on public.aparelhos;
create policy aparelhos_insert on public.aparelhos for insert to authenticated with check (public.is_ativo());
drop policy if exists aparelhos_update on public.aparelhos;
create policy aparelhos_update on public.aparelhos for update to authenticated
  using (public.is_admin() or (public.is_ativo() and exists (select 1 from public.clientes c where c.id = aparelhos.cliente_id and c.created_by = auth.uid())))
  with check (public.is_admin() or (public.is_ativo() and exists (select 1 from public.clientes c where c.id = aparelhos.cliente_id and c.created_by = auth.uid())));

drop policy if exists os_insert on public.ordens_servico;
create policy os_insert on public.ordens_servico for insert to authenticated with check (public.is_ativo());
drop policy if exists os_update on public.ordens_servico;
create policy os_update on public.ordens_servico for update to authenticated
  using (public.is_admin() or (public.is_ativo() and (created_by = auth.uid() or tecnico_id = auth.uid())))
  with check (public.is_admin() or (public.is_ativo() and (created_by = auth.uid() or tecnico_id = auth.uid())));

drop policy if exists orcamentos_insert on public.orcamentos;
create policy orcamentos_insert on public.orcamentos for insert to authenticated with check (public.is_ativo());
drop policy if exists orcamentos_update on public.orcamentos;
create policy orcamentos_update on public.orcamentos for update to authenticated
  using (public.is_admin() or (public.is_ativo() and exists (select 1 from public.ordens_servico o where o.id = orcamentos.os_id and (o.created_by = auth.uid() or o.tecnico_id = auth.uid()))))
  with check (public.is_admin() or (public.is_ativo() and exists (select 1 from public.ordens_servico o where o.id = orcamentos.os_id and (o.created_by = auth.uid() or o.tecnico_id = auth.uid()))));

drop policy if exists os_pecas_insert on public.os_pecas;
create policy os_pecas_insert on public.os_pecas for insert to authenticated with check (public.is_ativo());
drop policy if exists os_pecas_update on public.os_pecas;
create policy os_pecas_update on public.os_pecas for update to authenticated using (public.is_ativo()) with check (public.is_ativo());
drop policy if exists os_pecas_delete on public.os_pecas;
create policy os_pecas_delete on public.os_pecas for delete to authenticated using (public.is_ativo());

drop policy if exists produtos_insert on public.produtos;
create policy produtos_insert on public.produtos for insert to authenticated with check (public.is_ativo());

drop policy if exists mov_insert on public.movimentacoes_estoque;
create policy mov_insert on public.movimentacoes_estoque for insert to authenticated with check (public.is_ativo());