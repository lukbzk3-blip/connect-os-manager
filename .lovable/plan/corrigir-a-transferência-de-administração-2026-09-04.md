# Corrigir a transferência de administração

## O que está acontecendo

Ao confirmar a transferência aparece a tela genérica "Algo deu errado do nosso lado", e não um aviso explicando o motivo. Hoje, no banco, você (lukbzk3@gmail.com) é a única administradora e o Jefferson está como funcionário ativo — ou seja, a transferência não chegou a ser concluída.

A causa exata ainda não está confirmada: a tela de erro genérica engole a mensagem real. Existem duas hipóteses e o primeiro passo é confirmar qual delas é:

1. A ação no banco recusa a troca e o erro não é exibido como aviso.
2. A troca acontece, mas logo em seguida a tela de Usuários tenta recarregar a lista de usuários com a permissão que você acabou de perder, e esse erro derruba a página.

## Passos

1. Reproduzir a transferência com uma sessão de administrador e capturar a mensagem real do banco (sem alterar nada em definitivo além do teste).
2. Corrigir a causa encontrada:
   - se a recusa vier do banco, ajustar a rotina de transferência para que a troca de papéis aconteça na ordem correta e sem cair na proteção do "único administrador";
   - se a falha for depois da troca, encerrar o fluxo de forma controlada.
3. Fazer a tela nunca mais mostrar o erro genérico nesse ponto: qualquer falha vira um aviso em vermelho com o texto real do problema.
4. Depois de uma transferência bem-sucedida: mostrar a confirmação, parar de recarregar dados que exigem permissão de administrador e levar você para o painel inicial já como Funcionário (com aviso claro de que o acesso mudou).
5. Testar de novo no preview: transferir para o Jefferson, conferir que ele fica Administrador, que você fica Funcionário e que ele consegue transferir de volta.

## Detalhes técnicos

- `transferir_admin(uuid)` é `SECURITY DEFINER` e tem `EXECUTE` para `authenticated`; `is_admin`, `is_ativo` também. `has_role` **não** tem `EXECUTE` para `authenticated` — se a rotina de transferência passar a depender dela pelo lado do cliente, quebra.
- Reprodução via Playwright em `/tmp/browser/transferir-admin/` com sessão mintada, capturando `error.message`/`error.code` do `supabase.rpc("transferir_admin")`.
- `src/routes/_authenticated/usuarios.index.tsx`: em `transferirM.onSuccess`, hoje chama `ok()`, que invalida `["usuarios"]` — consulta com `enabled: isAdmin` que ainda está `true` no momento do refetch e cuja função de servidor lança `Somente administradores podem gerenciar usuários`. Trocar por: remover o cache de `["usuarios"]`, invalidar só `["session"]` e navegar para `/dashboard`.
- Envolver o `mutationFn` para normalizar o erro do PostgREST (`error.message`) antes de chegar ao `onError`, garantindo toast em vez de error boundary.
- Se o banco for a causa, a correção sai por `supabase--migration` (nova versão de `transferir_admin`), preservando as validações atuais (só admin, destino diferente, destino ativo).
