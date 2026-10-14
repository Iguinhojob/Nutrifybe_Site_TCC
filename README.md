# Nutrifybe — site e API

Sistema de acompanhamento nutricional desenvolvido como TCC. É formado por três partes que usam a mesma API:

| Parte | Tecnologia | Onde está |
|---|---|---|
| Site do nutricionista e do administrador | React 19 + React Router | este repositório (`src/`) |
| API | Java 21 + Spring Boot 3 + SQL Server | este repositório (`api-java/`) |
| App do paciente | React Native + Expo | repositório **TCC_M** |

## Fluxo principal
1. O paciente cria a conta no app, registra refeições (tabela TACO), água e medidas.
2. O paciente escolhe um nutricionista e envia uma solicitação de acompanhamento.
3. O nutricionista aceita ou recusa a solicitação no site.
4. Com o vínculo aceito, o nutricionista vê o diário, a água e as medidas, envia o plano alimentar, agenda retornos e conversa com o paciente pelo chat.
5. O administrador aprova ou desativa nutricionistas e acompanha os números do sistema.

## Como rodar

### API (`api-java/`)
1. Copie `api-java/.env.example` e preencha as variáveis de ambiente (banco, `JWT_SECRET` com pelo menos 32 caracteres e e-mail para recuperação de senha). **Nenhuma senha fica no código**: sem essas variáveis a API não inicia.
2. Rode `cd api-java && mvn spring-boot:run`. A API sobe em `http://localhost:8080`.
3. Em produção (por exemplo, no Render), cadastre as mesmas variáveis no painel do serviço. O `Dockerfile` compila a API a partir do código-fonte.

Na primeira inicialização, `TacoImportador` carrega `taco_alimentos.csv` na tabela `alimentos` (somente se a tabela estiver vazia).

### Site
1. `npm install`
2. Defina `REACT_APP_API_URL` com a URL da API (em desenvolvimento, `http://localhost:8080`).
3. `npm start` para abrir em `http://localhost:3000`, ou `npm run build` para gerar a versão de produção (publicada na Vercel).

## Autenticação e segurança
- **Paciente, nutricionista e administrador** entram por endpoints próprios (`/api/auth/login`, `/api/nutricionistas/login` e `/api/admin/login`). A senha é conferida no servidor e o cliente recebe um token assinado com HMAC-SHA256.
- As senhas são guardadas com BCrypt. Contas de administrador antigas, salvas em texto puro, são convertidas para BCrypt no primeiro login.
- As rotas administrativas (`/api/admin`, `/api/activityLog` e a gestão de pacientes em `/api/pacientes`) exigem o token de administrador.
- O nutricionista só altera o próprio perfil. Aprovar, desativar ou excluir contas é tarefa exclusiva do administrador.
- Os dados clínicos do paciente (`/api/nutri/pacientes/...`) só são entregues ao nutricionista com vínculo aceito.

## Principais endpoints
| Área | Endpoints |
|---|---|
| Paciente (app) | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me`, `POST /api/auth/me/vinculo`, `POST /api/auth/me/vinculo/encerrar` |
| Diário (app) | `/api/diario/refeicoes`, `/api/diario/agua`, `/api/diario/medidas`, `/api/diario/meta`, `/api/diario/resumo` |
| Alimentos | `GET /api/alimentos?busca=arroz` (tabela TACO) |
| Nutricionista | `POST /api/nutricionistas` (cadastro, entra como pendente), `POST /api/nutricionistas/login`, `GET /api/nutricionistas`, `GET /api/nutricionistas/{id}/avaliacoes` |
| Acompanhamento | `GET /api/nutri/solicitacoes`, `PUT /api/nutri/solicitacoes/{id}/aceitar`, `DELETE /api/nutri/solicitacoes/{id}`, `GET/PUT /api/nutri/pacientes/{id}`, `POST /api/nutri/pacientes/{id}/transferir`, `DELETE /api/nutri/pacientes/{id}/vinculo` |
| Chat | `GET/POST /api/chat/mensagens`, `GET /api/chat/mensagens/{id}/arquivo` |
| Administração | `POST /api/admin/login`, `/api/admin`, `/api/activityLog`, `/api/pacientes` |

## Fonte dos valores nutricionais
TACO 4ª edição, NEPA/UNICAMP. Os valores são estimativas médias por 100 g. Ao registrar itens com `alimentoId` e `gramas`, a API recalcula calorias, carboidratos, proteínas, gorduras e fibras com base na tabela e salva o resultado junto do registro.

## Documentação complementar
- `docs/melhorias-interface.md`: mudanças de interface na área do nutricionista e limitações conhecidas.
