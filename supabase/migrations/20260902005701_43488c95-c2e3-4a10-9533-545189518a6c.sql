ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS cancelado_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelado_por uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.protege_status_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if new.ativo is distinct from old.ativo and not public.is_admin() then
    raise exception 'Somente administradores podem inativar ou reativar clientes';
  end if;
  return new;
end; $$;

REVOKE ALL ON FUNCTION public.protege_status_cliente() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS clientes_protege_status ON public.clientes;
CREATE TRIGGER clientes_protege_status
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.protege_status_cliente();

CREATE OR REPLACE FUNCTION public.registra_cancelamento_os()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if new.status = 'cancelado'::public.os_status and old.status is distinct from 'cancelado'::public.os_status then
    new.cancelado_em := now();
    new.cancelado_por := auth.uid();
  end if;
  return new;
end; $$;

REVOKE ALL ON FUNCTION public.registra_cancelamento_os() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS os_registra_cancelamento ON public.ordens_servico;
CREATE TRIGGER os_registra_cancelamento
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.registra_cancelamento_os();