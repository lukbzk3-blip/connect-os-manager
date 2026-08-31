# Endurecimento dos níveis de acesso (somente banco de dados)

A auditoria não encontrou nenhuma falha que permita a um funcionário virar administrador. As correções abaixo fecham lacunas secundárias de exposição de dados e de posse de registros. Nada de interface, visual ou autenticação é alterado — apenas políticas RLS em uma migração.

## Correções propostas

1. **Relatórios protegidos no banco**
   Restringir a leitura de dados sensíveis usados nos relatórios: campos de custo e faturamento deixam de ser livremente consultáveis por funcionários via API. Feito com políticas que limitam `produtos` (custo) e a leitura ampla de valores financeiros de ordens de serviço a administradores, mantendo o funcionário com acesso ao que precisa para operar.

2. **Configurações deixam de ser públicas para funcionários**
   A leitura da tabela de configurações passa a exigir perfil de administrador (a escrita já exigia).

3. **Peças de OS com regra de posse**
   Alterar e excluir peças passa a exigir ser administrador ou responsável pela ordem de serviço correspondente (criador ou técnico), igualando a regra já aplicada à própria OS.

4. **Movimentação de estoque do tipo "ajuste" restrita a administradores**
   Entradas e saídas continuam liberadas para funcionários ativos; apenas o ajuste direto de saldo passa a ser exclusivo do administrador, para que a restrição de edição de produtos não seja contornável.

5. **Remoção de permissões desnecessárias do papel anônimo**
   Revogar escrita e leitura do papel público em todas as tabelas do sistema. Hoje já não há efeito prático porque nenhuma regra contempla visitantes, mas é permissão sem uso.

## Detalhes técnicos

- Uma única migração SQL: `DROP POLICY` / `CREATE POLICY` nas tabelas `configuracoes`, `os_pecas`, `movimentacoes_estoque`, `produtos`, mais `REVOKE ... FROM anon`.
- Continuam sendo usadas as funções existentes `is_admin()` e `is_ativo()`; nenhuma função nova de segurança é criada.
- Nenhum arquivo de código-fonte é modificado. Caso a restrição de custo em `produtos` afete alguma tela já existente, o ajuste será feito apenas na consulta, sem mudança visual.

## Fora de escopo

- Não alterar `handle_new_user()`, `user_roles`, `profiles` nem qualquer parte do fluxo de login/cadastro.
- Não alterar componentes, rotas ou estilos.
