# Corrigir criação de usuários

## O que está acontecendo

A tela de Usuários confere se você é administrador chamando uma verificação no banco chamada `has_role`. Essa verificação está sem permissão de execução para usuários logados (confirmado no banco: `authenticated` não tem EXECUTE em `has_role`; já `is_admin` e `transferir_admin` têm).

Resultado: toda ação da tela que passa pelo servidor (listar, criar e excluir usuário) para logo no primeiro passo com a mensagem "Não foi possível validar sua permissão". Na criação isso aparece como erro; na listagem falha em silêncio, por isso a lista pode aparecer vazia.

## Correção

Trocar a verificação de administrador no servidor (`src/lib/usuarios.functions.ts`, função `assertAdmin`) para usar `is_admin()`, que já está liberada para usuários logados — sem alterar nada no banco e sem afrouxar segurança, pois `is_admin()` avalia o usuário da própria sessão.

Como reforço, se a chamada falhar, cair para uma leitura direta da tabela de papéis do próprio usuário (protegida por RLS), e mostrar uma mensagem de erro mais clara.

## Verificação

- Compilação/tipos.
- Abrir /usuarios como administrador no preview: a lista deve carregar e a criação de um usuário de teste deve concluir (usuário novo já nasce ativo, conforme o padrão da tabela).

## Não muda

Banco de dados, regras de acesso, telas e demais funcionalidades.
