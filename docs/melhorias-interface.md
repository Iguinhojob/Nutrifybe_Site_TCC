# Melhorias de interface — área do nutricionista

## Escopo

Este repositório contém o **site** (React) e a **API** (Java/Spring Boot). As telas do **paciente** (registrar refeição, registrar peso, buscar nutricionista, estado do acompanhamento) ficam no **app mobile (Expo)**, que não está aqui. Por isso, as melhorias foram feitas nas telas do nutricionista, nas de login e cadastro, e em duas pequenas adições na API.

## O que mudou

### Base compartilhada (`src/ui/`, `src/css/nf-ui.css`)
- Tokens de cor, tipografia (Inter e Poppins), espaçamentos e raios para os temas claro e escuro, partindo da identidade atual (ciano e índigo no tema claro, roxo no escuro).
- `NutriLayout`: a mesma barra de navegação em todas as telas do nutricionista (Painel, Solicitações com contador, Meu perfil, tema e Sair). Inclui o link "Pular para o conteúdo". O botão Sair agora sempre encerra a sessão. Quando a sessão expira, o usuário volta ao login com um aviso.
- Componentes: `Dialog`/`ConfirmDialog` (baseados no `<dialog>` nativo, com foco preso, fechamento por Esc e retorno do foco), avisos temporários (`aria-live`), selos de status com ícone e texto, além de estados de carregamento, vazio e erro com a opção "Tentar novamente".
- Mensagens de erro convertidas para português claro (`friendlyError`).

### Telas
| Tela | Principais mudanças |
|---|---|
| Painel | Prioridades em cartões (solicitações pendentes, próximos retornos, pacientes), busca de pacientes, atalhos para ficha e conversa |
| Solicitações | Cartões com os dados do paciente, explicação de aceitar e recusar, confirmação antes de recusar, aviso com link "Abrir ficha" após aceitar e mensagem clara para o conflito 409 |
| Ficha do paciente | Abas acessíveis (setas, Home/End e `?aba=` na URL): Resumo, Diário alimentar, Evolução, Plano alimentar e Conversa |
| Diário | Navegação por dia com registro, totais do dia, progresso de calorias em relação à meta do app e de água em relação à meta do paciente |
| Evolução | Gráfico do peso com a linha da meta, tabela de medidas e hidratação dos últimos dias |
| Plano alimentar | Resumo para revisão, total de kcal, aviso quando falta kcal (o app não usa o plano como meta), reordenação das refeições, confirmação antes de salvar e de remover, aviso de alterações não salvas |
| Calendário | Mesma navegação das outras telas, dias clicáveis como botões com descrição, confirmação ao remover o retorno, aviso se a API não salvar o retorno |
| Encerrar ou transferir | Um único diálogo explica o efeito de cada opção antes de confirmar |
| Perfil | Formulário com rótulos ligados aos campos. Corrigido: o token da sessão era perdido ao salvar o perfil |
| Login e cadastro | Rótulos ligados aos campos, `autocomplete`, opção "Mostrar senha", estado de envio e mensagens mais claras |

### API (mudanças mínimas, exigidas pela interface)
- `Paciente.retorno` (nova coluna, criada pelo `ddl-auto=update`). O `PUT /api/nutri/pacientes/{id}` passa a salvar `retorno` e o resumo do paciente passa a devolvê-lo. **Antes, o "Agendar retorno" do site era ignorado pelo servidor e sumia ao recarregar a página.**
- `GET /api/nutri/pacientes/{id}` agora devolve `metaDiaria`, calculada pelo `MetaCaloriasService` já existente (a mesma meta que o app usa).
- Nenhuma regra de negócio, cálculo nutricional ou forma de autenticação foi alterada. O plano continua sendo salvo no mesmo formato (`{version: 1, meals, notes}`).

## Fluxo de ponta a ponta
1. **Paciente registra uma refeição:** acontece no app (fora deste repositório).
2. **Paciente solicita acompanhamento:** acontece no app (fora deste repositório).
3. **Nutricionista aceita:** acontece em Solicitações. A confirmação traz o link para a ficha.
4. **Nutricionista vê os registros:** ficha → Diário e Evolução (somente leitura, protegidos pelo vínculo aceito).

A parte web (3 e 4) foi conferida com uma API simulada. As etapas 1 e 2 dependem do app.

## Recomendações futuras
- Criar estados "recusada" e "expirada" para as solicitações: hoje a recusa apaga a solicitação e devolve o paciente ao modo solo, e não existe data nem expiração.
- Guardar a data da solicitação para mostrar "recebida há X dias".
- Salvar o motivo de encerramento ou transferência (hoje é só um campo de apoio).
- Guardar a meta diária por dia, para comparar dias antigos com a meta que valia na época.
- Resumo da última atividade na listagem de pacientes (exige endpoint).
