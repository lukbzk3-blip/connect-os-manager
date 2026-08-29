# Connect Assist (72)

Quero criar um sistema web chamado CONNECT SISTEMAS, desenvolvido especificamente para uma assistência técnica de celulares chamada CONNECT ASSISTÊNCIA TÉCNICA.



Quero que você construa o sistema de forma profissional, mas simples de usar, principalmente pelo celular.



OBJETIVO



O sistema será utilizado para controlar:



- Clientes

- Aparelhos

- Ordens de Serviço

- Orçamentos

- Serviços realizados

- Peças

- Estoque

- Pagamentos

- Histórico de atendimentos



Quero um sistema funcional, não apenas uma demonstração visual.



TECNOLOGIA



Utilize uma arquitetura moderna compatível com o Lovable.



Utilize:



- Supabase para banco de dados

- Autenticação de usuários

- Banco de dados relacional

- CRUD completo

- Controle de acesso

- Interface responsiva



Todas as informações importantes devem ser salvas no banco de dados.



Não utilizar dados fictícios como solução definitiva.



USUÁRIOS



Criar sistema de login.



Inicialmente teremos dois níveis:



Administrador



Pode:



- Ver tudo

- Cadastrar clientes

- Editar clientes

- Excluir clientes

- Cadastrar aparelhos

- Criar Ordens de Serviço

- Alterar status das OS

- Criar orçamentos

- Controlar estoque

- Ver financeiro

- Ver relatórios

- Gerenciar usuários

- Alterar configurações



Funcionário



Pode:



- Ver clientes

- Cadastrar clientes

- Ver aparelhos

- Cadastrar aparelhos

- Criar OS

- Atualizar OS

- Consultar estoque



Não pode acessar configurações administrativas e informações restritas do administrador.



PÁGINAS PRINCIPAIS



Criar inicialmente:



1. Login

2. Dashboard

3. Clientes

4. Cadastro de Cliente

5. Detalhes do Cliente

6. Aparelhos

7. Cadastro de Aparelho

8. Ordens de Serviço

9. Detalhes da OS

10. Orçamentos

11. Estoque

12. Financeiro

13. Relatórios

14. Configurações

15. Usuários



CLIENTES



Criar cadastro com:



- Nome completo

- CPF/CNPJ

- Telefone

- WhatsApp

- E-mail

- CEP

- Endereço

- Número

- Complemento

- Bairro

- Cidade

- Estado

- Observações

- Data de cadastro



Permitir:



- Cadastrar

- Editar

- Excluir

- Pesquisar

- Visualizar detalhes



Um cliente pode possuir vários aparelhos.



APARELHOS



Cada aparelho deve estar vinculado a um cliente.



Campos:



- Cliente

- Marca

- Modelo

- IMEI

- Número de série

- Cor

- Senha/PIN

- Estado físico

- Acessórios entregues

- Defeito relatado

- Observações

- Data de entrada



Um cliente pode possuir vários aparelhos.



ORDEM DE SERVIÇO



Criar Ordem de Serviço com número automático.



Cada OS deve conter:



- Número da OS

- Cliente

- Aparelho

- Data de entrada

- Previsão de entrega

- Técnico responsável

- Defeito relatado

- Diagnóstico

- Serviço realizado

- Peças utilizadas

- Valor das peças

- Valor da mão de obra

- Desconto

- Valor total

- Forma de pagamento

- Status

- Observações



Criar os seguintes status:



- Recebido

- Em análise

- Aguardando aprovação

- Aprovado

- Em manutenção

- Aguardando peça

- Pronto

- Entregue

- Cancelado



ORÇAMENTOS



Permitir criar orçamento vinculado à OS.



Mostrar:



- Cliente

- Aparelho

- Defeito

- Diagnóstico

- Serviços

- Peças

- Valores

- Desconto

- Valor final

- Prazo

- Validade



Status:



- Aguardando aprovação

- Aprovado

- Recusado



Permitir futuramente gerar PDF e imprimir.



ESTOQUE



Criar cadastro de produtos/peças.



Campos:



- Nome

- Categoria

- Marca

- Código

- Quantidade

- Estoque mínimo

- Custo

- Preço de venda

- Fornecedor

- Localização



Criar movimentações de estoque:



- Entrada

- Saída

- Ajuste



Quando uma peça for utilizada em uma OS, permitir registrar a saída.



Criar alerta quando o estoque estiver abaixo do mínimo.



FINANCEIRO



Criar controle básico:



- Entradas

- Saídas

- Valores a receber

- Pagamentos

- Despesas



Formas de pagamento:



- Dinheiro

- PIX

- Débito

- Crédito

- Transferência



Relacionar pagamentos às respectivas Ordens de Serviço quando aplicável.



DASHBOARD



Criar um dashboard inicial com informações reais do banco.



Mostrar:



- Clientes

- Aparelhos

- Recebidos

- Em análise

- Aguardando peça

- Prontos

- Entregues



Também mostrar uma lista das Ordens de Serviço recentes.



PESQUISA



Criar pesquisa para localizar rapidamente:



- Nome do cliente

- Telefone

- WhatsApp

- CPF

- IMEI

- Modelo

- Número da OS



HISTÓRICO



Cada cliente deve possuir histórico.



Exemplo:



Cliente

→ Aparelhos

→ Ordens de Serviço

→ Serviços realizados

→ Peças utilizadas

→ Pagamentos



INTERFACE



A interface deve ser:



- Simples

- Profissional

- Limpa

- Rápida

- Responsiva

- Fácil de usar



A prioridade é funcionar muito bem no celular.



Utilizar português do Brasil.



Valores em reais (R$).



Datas no formato brasileiro.



IDENTIDADE VISUAL



O nome do sistema é:



CONNECT SISTEMAS



A assistência técnica se chama:



CONNECT ASSISTÊNCIA TÉCNICA



A cor principal será verde.



Utilizar:



- Verde

- Branco

- Cinza claro

- Cinza escuro



Evitar excesso de cores.



A interface deve ser profissional e simples.



RESPONSIVIDADE



O sistema será utilizado principalmente em celular Android.



Portanto:



- Não permitir rolagem horizontal

- Inputs devem caber na tela

- Botões devem ser fáceis de tocar

- Menu deve funcionar no celular

- Tabelas devem se adaptar para telas pequenas

- Cards devem se reorganizar automaticamente

- Formulários devem ser confortáveis no celular



Também deve funcionar em computador.



BANCO DE DADOS



Criar uma estrutura organizada no Supabase.



Criar relacionamentos entre:



Usuários

↓

Clientes

↓

Aparelhos

↓

Ordens de Serviço

↓

Serviços e Peças

↓

Pagamentos



Utilizar IDs únicos e relacionamentos corretamente.



Não duplicar informações desnecessariamente.



IMPORTANTE



Não tente criar tudo de forma superficial.



Primeiro crie uma estrutura sólida para o sistema.



Comece pela:



1. Estrutura do projeto

2. Banco de dados

3. Autenticação

4. Controle de usuários

5. Layout base

6. Dashboard

7. Clientes

8. Aparelhos

9. Ordens de Serviço



Depois poderemos implementar os módulos de:



- Orçamentos

- Estoque

- Financeiro

- Relatórios

- PDF

- Impressão



Não remova funcionalidades posteriormente sem minha autorização.



Não substitua funcionalidades reais por dados falsos.



O sistema deve ser preparado para crescer futuramente.



Por enquanto, concentre-se em construir uma base sólida e funcional para o CONNECT SISTEMAS.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://connect-os-manager.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c011925-421a-4cf6-8088-26895dce5479).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
