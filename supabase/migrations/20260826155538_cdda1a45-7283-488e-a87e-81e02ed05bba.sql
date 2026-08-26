-- ROLES
create type public.app_role as enum ('admin', 'funcionario');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- new user: profile + role (first user becomes admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  insert into public.profiles (id, nome, telefone)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)), new.raw_user_meta_data->>'telefone');
  select count(*) into cnt from public.user_roles;
  insert into public.user_roles (user_id, role)
  values (new.id, case when cnt = 0 then 'admin'::public.app_role else 'funcionario'::public.app_role end);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "user_roles_select" on public.user_roles for select to authenticated using (true);
create policy "user_roles_admin_all" on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- CLIENTES
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf_cnpj text,
  telefone text,
  whatsapp text,
  email text,
  cep text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clientes to authenticated;
grant all on public.clientes to service_role;
alter table public.clientes enable row level security;
create policy "clientes_select" on public.clientes for select to authenticated using (true);
create policy "clientes_insert" on public.clientes for insert to authenticated with check (true);
create policy "clientes_update" on public.clientes for update to authenticated using (true) with check (true);
create policy "clientes_delete" on public.clientes for delete to authenticated using (public.is_admin());
create trigger clientes_updated before update on public.clientes for each row execute function public.set_updated_at();

-- APARELHOS
create table public.aparelhos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  marca text not null,
  modelo text not null,
  imei text,
  numero_serie text,
  cor text,
  senha text,
  estado_fisico text,
  acessorios text,
  defeito_relatado text,
  observacoes text,
  data_entrada date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aparelhos to authenticated;
grant all on public.aparelhos to service_role;
alter table public.aparelhos enable row level security;
create policy "aparelhos_select" on public.aparelhos for select to authenticated using (true);
create policy "aparelhos_insert" on public.aparelhos for insert to authenticated with check (true);
create policy "aparelhos_update" on public.aparelhos for update to authenticated using (true) with check (true);
create policy "aparelhos_delete" on public.aparelhos for delete to authenticated using (public.is_admin());
create trigger aparelhos_updated before update on public.aparelhos for each row execute function public.set_updated_at();

-- ESTOQUE
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  marca text,
  codigo text,
  quantidade numeric not null default 0,
  estoque_minimo numeric not null default 0,
  custo numeric not null default 0,
  preco_venda numeric not null default 0,
  fornecedor text,
  localizacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.produtos to authenticated;
grant all on public.produtos to service_role;
alter table public.produtos enable row level security;
create policy "produtos_select" on public.produtos for select to authenticated using (true);
create policy "produtos_insert" on public.produtos for insert to authenticated with check (true);
create policy "produtos_update" on public.produtos for update to authenticated using (true) with check (true);
create policy "produtos_delete" on public.produtos for delete to authenticated using (public.is_admin());
create trigger produtos_updated before update on public.produtos for each row execute function public.set_updated_at();

-- ORDENS DE SERVICO
create type public.os_status as enum ('recebido','em_analise','aguardando_aprovacao','aprovado','em_manutencao','aguardando_peca','pronto','entregue','cancelado');
create type public.forma_pagamento as enum ('dinheiro','pix','debito','credito','transferencia');

create sequence public.os_numero_seq start 1;

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique default nextval('public.os_numero_seq'),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  aparelho_id uuid references public.aparelhos(id) on delete set null,
  data_entrada date not null default current_date,
  previsao_entrega date,
  tecnico_id uuid references auth.users(id),
  tecnico_nome text,
  defeito_relatado text,
  diagnostico text,
  servico_realizado text,
  valor_pecas numeric not null default 0,
  valor_mao_obra numeric not null default 0,
  desconto numeric not null default 0,
  valor_total numeric not null default 0,
  forma_pagamento public.forma_pagamento,
  status public.os_status not null default 'recebido',
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ordens_servico to authenticated;
grant all on public.ordens_servico to service_role;
alter table public.ordens_servico enable row level security;
create policy "os_select" on public.ordens_servico for select to authenticated using (true);
create policy "os_insert" on public.ordens_servico for insert to authenticated with check (true);
create policy "os_update" on public.ordens_servico for update to authenticated using (true) with check (true);
create policy "os_delete" on public.ordens_servico for delete to authenticated using (public.is_admin());
create trigger os_updated before update on public.ordens_servico for each row execute function public.set_updated_at();

create table public.os_pecas (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  descricao text not null,
  quantidade numeric not null default 1,
  valor_unitario numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.os_pecas to authenticated;
grant all on public.os_pecas to service_role;
alter table public.os_pecas enable row level security;
create policy "os_pecas_select" on public.os_pecas for select to authenticated using (true);
create policy "os_pecas_insert" on public.os_pecas for insert to authenticated with check (true);
create policy "os_pecas_update" on public.os_pecas for update to authenticated using (true) with check (true);
create policy "os_pecas_delete" on public.os_pecas for delete to authenticated using (true);

-- ORCAMENTOS
create type public.orcamento_status as enum ('aguardando_aprovacao','aprovado','recusado');
create table public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid references public.ordens_servico(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  aparelho_id uuid references public.aparelhos(id) on delete set null,
  defeito text,
  diagnostico text,
  servicos text,
  pecas text,
  valor_servicos numeric not null default 0,
  valor_pecas numeric not null default 0,
  desconto numeric not null default 0,
  valor_final numeric not null default 0,
  prazo text,
  validade date,
  status public.orcamento_status not null default 'aguardando_aprovacao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orcamentos to authenticated;
grant all on public.orcamentos to service_role;
alter table public.orcamentos enable row level security;
create policy "orcamentos_select" on public.orcamentos for select to authenticated using (true);
create policy "orcamentos_insert" on public.orcamentos for insert to authenticated with check (true);
create policy "orcamentos_update" on public.orcamentos for update to authenticated using (true) with check (true);
create policy "orcamentos_delete" on public.orcamentos for delete to authenticated using (public.is_admin());
create trigger orcamentos_updated before update on public.orcamentos for each row execute function public.set_updated_at();

-- MOVIMENTACOES ESTOQUE
create type public.mov_tipo as enum ('entrada','saida','ajuste');
create table public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  os_id uuid references public.ordens_servico(id) on delete set null,
  tipo public.mov_tipo not null,
  quantidade numeric not null,
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert on public.movimentacoes_estoque to authenticated;
grant all on public.movimentacoes_estoque to service_role;
alter table public.movimentacoes_estoque enable row level security;
create policy "mov_select" on public.movimentacoes_estoque for select to authenticated using (true);
create policy "mov_insert" on public.movimentacoes_estoque for insert to authenticated with check (true);

create or replace function public.aplicar_movimentacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'entrada' then
    update public.produtos set quantidade = quantidade + new.quantidade where id = new.produto_id;
  elsif new.tipo = 'saida' then
    update public.produtos set quantidade = quantidade - new.quantidade where id = new.produto_id;
  else
    update public.produtos set quantidade = new.quantidade where id = new.produto_id;
  end if;
  return new;
end; $$;
create trigger mov_aplica after insert on public.movimentacoes_estoque
for each row execute function public.aplicar_movimentacao();

-- FINANCEIRO
create type public.lanc_tipo as enum ('entrada','saida');
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo public.lanc_tipo not null,
  descricao text not null,
  categoria text,
  valor numeric not null default 0,
  forma_pagamento public.forma_pagamento,
  os_id uuid references public.ordens_servico(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  pago boolean not null default true,
  data date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lancamentos to authenticated;
grant all on public.lancamentos to service_role;
alter table public.lancamentos enable row level security;
create policy "lanc_admin_all" on public.lancamentos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger lanc_updated before update on public.lancamentos for each row execute function public.set_updated_at();

-- CONFIGURACOES
create table public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor text,
  updated_at timestamptz not null default now()
);
grant select on public.configuracoes to authenticated;
grant all on public.configuracoes to service_role;
alter table public.configuracoes enable row level security;
create policy "config_select" on public.configuracoes for select to authenticated using (true);
create policy "config_admin_write" on public.configuracoes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant insert, update, delete on public.configuracoes to authenticated;

create index on public.aparelhos (cliente_id);
create index on public.ordens_servico (cliente_id);
create index on public.ordens_servico (status);
create index on public.os_pecas (os_id);
create index on public.lancamentos (data);