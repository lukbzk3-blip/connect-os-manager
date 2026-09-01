# Gestão de Usuários (Configurações → Usuários)

## Como está hoje

- **Perfil do usuário**: tabela `profiles` (nome, telefone, ativo). O e-mail fica em `auth.users` e hoje não aparece na tela.
- **Nível de acesso**: tabela `user_roles` (`admin` / `funcionario`). O banco decide com a função `is_admin()`; o front só lê via `useAuth().isAdmin`.
- **Regras já ativas no banco**: primeiro usuário vira admin automaticamente; funcionário não altera o próprio `ativo`; só admin gerencia `user_roles`.
- **Tela atual** (`usuarios.index.tsx`): lista usuários com dois interruptores (Admin / Ativo). Não permite criar, editar dados, excluir, nem transferir administração. Nada impede hoje remover o último admin.

## O que será alterado

### Banco (novo, sem tocar no que existe)
1. Função `public.transferir_admin(novo_admin uuid)` — só executa se quem chama for admin: dá `admin` ao novo usuário e remove `admin` de quem chamou, em uma única transação.
2. Trigger de proteção em `user_roles`: bloqueia remover a role `admin` quando ela for a última do sistema.
3. Trigger de proteção em `profiles`: bloqueia desativar o único administrador.

### Backend do app (server functions, admin-only)
Novo `src/lib/usuarios.functions.ts` com verificação de admin no servidor antes de qualquer ação:
- `listarUsuarios` — perfis + roles + e-mail vindo de `auth.users`.
- `criarUsuario` — cria conta (e-mail, senha, nome, telefone) já confirmada, com papel escolhido.
- `excluirUsuario` — remove a conta de autenticação (bloqueado para o último admin e para si mesmo).

### Interface (mesma rota `/usuarios`, mesmo visual)
- Cartão de usuário passa a mostrar e-mail e papel.
- Botão "Novo usuário" abre diálogo de criação.
- Botão de editar (nome, telefone) e de excluir com confirmação.
- Interruptor Ativo mantido; interruptor Admin substituído por seletor de nível (Administrador / Funcionário).
- Ação "Transferir administração" com diálogo de confirmação explicando que o admin atual perde o acesso administrativo.
- Mensagens claras quando a regra do banco bloquear (último admin).

## Não será alterado
Autenticação, rotas existentes, RLS das demais tabelas, regras de negócio, dados e o comportamento mobile.
