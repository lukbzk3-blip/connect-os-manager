-- Clientes
DROP POLICY IF EXISTS clientes_update ON public.clientes;
CREATE POLICY clientes_update ON public.clientes FOR UPDATE TO authenticated
  USING (is_admin() OR created_by = auth.uid())
  WITH CHECK (is_admin() OR created_by = auth.uid());

-- Aparelhos
DROP POLICY IF EXISTS aparelhos_update ON public.aparelhos;
CREATE POLICY aparelhos_update ON public.aparelhos FOR UPDATE TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = aparelhos.cliente_id AND c.created_by = auth.uid()))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = aparelhos.cliente_id AND c.created_by = auth.uid()));

-- Ordens de servico
DROP POLICY IF EXISTS os_update ON public.ordens_servico;
CREATE POLICY os_update ON public.ordens_servico FOR UPDATE TO authenticated
  USING (is_admin() OR created_by = auth.uid() OR tecnico_id = auth.uid())
  WITH CHECK (is_admin() OR created_by = auth.uid() OR tecnico_id = auth.uid());

-- Orcamentos
DROP POLICY IF EXISTS orcamentos_update ON public.orcamentos;
CREATE POLICY orcamentos_update ON public.orcamentos FOR UPDATE TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = orcamentos.os_id AND (o.created_by = auth.uid() OR o.tecnico_id = auth.uid())))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = orcamentos.os_id AND (o.created_by = auth.uid() OR o.tecnico_id = auth.uid())));

-- Produtos
DROP POLICY IF EXISTS produtos_update ON public.produtos;
CREATE POLICY produtos_update ON public.produtos FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());

-- User roles
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Lancamentos: explicit admin-only SELECT policy
DROP POLICY IF EXISTS lanc_select_admin ON public.lancamentos;
CREATE POLICY lanc_select_admin ON public.lancamentos FOR SELECT TO authenticated
  USING (is_admin());

-- Internal trigger functions should not be callable by app users
REVOKE ALL ON FUNCTION public.aplicar_movimentacao() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;