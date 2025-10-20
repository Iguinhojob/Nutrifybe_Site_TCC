# Nutrifybe - Sistema de Gestão Nutricional

Sistema completo para gestão de consultas nutricionais com arquitetura moderna React + Node.js.

## 🚀 Como Iniciar o Sistema

### 1. Instalar Dependências do Frontend
```bash
npm install
```

### 2. Instalar Dependências da API
```bash
cd api
npm install
```

### 3. Iniciar a API (Backend)
```bash
cd api
node index.js
```
A API estará disponível em: `http://localhost:3001`

### 4. Iniciar o Frontend (em outro terminal)
```bash
npm start
```
A aplicação estará disponível em: `http://localhost:3000`

### Alternativa - Modo Desenvolvimento Local
```bash
npm run dev-local
```
Inicia ambos os serviços simultaneamente usando JSON Server local.

## 👥 Usuários de Teste

### Admin
- **Email:** admin@nutrifybe.com
- **Senha:** admin123

### Nutricionista
- **Email:** nutri@teste.com
- **CRN:** 12345
- **Senha:** 123456

## 🔧 Funcionalidades

### Para Pacientes
- ✅ Solicitar consulta nutricional
- ✅ Escolher nutricionista disponível
- ✅ Preencher dados pessoais completos (idade, peso, altura, objetivos)
- ✅ Informar condições de saúde
- ✅ Receber prescrições personalizadas

### Para Nutricionistas
- ✅ Login seguro com email, CRN e senha
- ✅ Dashboard interativo com lista de pacientes
- ✅ Gerenciar solicitações pendentes
- ✅ Aceitar/recusar pacientes com justificativa
- ✅ Visualizar fichas completas dos pacientes
- ✅ Criar e editar prescrições semanais
- ✅ Sistema de calendário para consultas
- ✅ Transferir pacientes para outros nutricionistas
- ✅ Encerrar atendimentos com motivo
- ✅ Perfil profissional editável

### Para Administradores
- ✅ Login administrativo seguro
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gerenciar nutricionistas (aprovar/rejeitar/excluir/ativar/desativar)
- ✅ Adicionar nutricionistas manualmente
- ✅ Busca avançada por CRN, nome ou email
- ✅ Log de atividades detalhado com timestamps
- ✅ Limpeza de logs
- ✅ Monitoramento de pacientes ativos/inativos

## 📊 Estrutura do Banco de Dados

### Ambientes:
- **Produção:** SQL Server Cloud (nutrifybe_db.mssql.somee.com)
- **Desenvolvimento:** JSON Server local (db.json)

### Tabelas Principais:
- **Nutricionistas** - Dados completos dos profissionais (nome, email, CRN, especialidade, status, ativo)
- **Pacientes** - Pacientes aceitos no sistema (dados pessoais, objetivos, nutricionista responsável)
- **SolicitacoesPendentes** - Solicitações aguardando aprovação dos nutricionistas
- **Admin** - Dados dos administradores do sistema
- **ActivityLog** - Log detalhado de atividades com timestamps

### Campos Importantes:
- **Status:** pending, approved, rejected
- **Ativo:** 0 (inativo), 1 (ativo)
- **Timestamps:** data_criacao automática
- **Relacionamentos:** nutricionista_id vincula pacientes aos profissionais

## 🔄 APIs Disponíveis

### Nutricionistas
- `GET /api/nutricionistas` - Listar todos os nutricionistas
- `POST /api/nutricionistas` - Criar novo nutricionista
- `POST /api/nutricionistas/login` - Login com email, CRN e senha
- `PUT /api/nutricionistas/:id` - Atualizar status/ativo
- `DELETE /api/nutricionistas/:id` - Excluir nutricionista

### Pacientes
- `GET /api/pacientes` - Listar todos os pacientes
- `POST /api/pacientes` - Criar novo paciente
- `PUT /api/pacientes/:id` - Atualizar status ativo
- `DELETE /api/pacientes/:id` - Excluir paciente

### Solicitações Pendentes
- `GET /api/solicitacoesPendentes` - Listar solicitações pendentes
- `POST /api/solicitacoesPendentes` - Nova solicitação de consulta
- `DELETE /api/solicitacoesPendentes/:id` - Remover solicitação

### Administração
- `GET /api/admin` - Listar administradores
- `POST /api/admin` - Criar novo admin
- `PUT /api/admin/:id` - Atualizar dados do admin
- `DELETE /api/admin/:id` - Excluir admin
- `GET /api/activityLog` - Buscar log de atividades
- `POST /api/activityLog` - Adicionar nova atividade
- `DELETE /api/activityLog` - Limpar todo o log

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React:** 19.1.1 (biblioteca principal)
- **React Router DOM:** 7.9.2 (roteamento SPA)
- **jsPDF:** 2.5.2 (geração de relatórios PDF)
- **CSS:** Customizado com animações e temas responsivos

### Backend
- **Node.js + Express:** 4.18.2 (servidor API)
- **mssql:** 10.0.1 (driver SQL Server)
- **CORS:** 2.8.5 (política de origem cruzada)
- **JSON Server:** 1.0.0-beta.3 (desenvolvimento local)

### Banco de Dados
- **Produção:** SQL Server Cloud
- **Desenvolvimento:** JSON Server
- **Driver:** mssql nativo (sem ORM)

### Deploy
- **Frontend:** Vercel
- **Backend:** Configuração para produção
- **Banco:** SQL Server hospedado

## 📝 Fluxo de Uso

1. **Paciente** acessa o site e solicita consulta
2. **Paciente** preenche dados completos (idade, peso, altura, objetivos, condições de saúde)
3. **Paciente** escolhe nutricionista disponível
4. **Nutricionista** recebe solicitação no dashboard
5. **Nutricionista** pode aceitar/recusar com justificativa
6. **Nutricionista** gerencia pacientes aceitos (fichas, prescrições, calendário)
7. **Nutricionista** pode transferir ou encerrar atendimentos
8. **Admin** aprova novos nutricionistas e monitora sistema
9. **Admin** visualiza estatísticas e logs de atividades

## 🔒 Autenticação e Segurança

- **Nutricionistas:** Email + CRN + Senha (validação tripla)
- **Admin:** Email + Senha
- **Sessões:** localStorage com dados do usuário
- **Proteção:** Validação backend, tokens CSRF, sanitização de dados
- **Status:** Sistema de aprovação para nutricionistas

## 📱 Interface e UX

### Responsividade Total
- Desktop (design principal)
- Tablet (adaptação de layout)
- Mobile (interface otimizada)

### Temas Visuais
- **Público:** Gradiente roxo com partículas animadas
- **Nutricionista:** Interface profissional verde
- **Admin:** Dashboard administrativo

### Recursos Visuais
- Animações CSS personalizadas
- Modais interativos
- Feedback visual para ações
- Mascote animado na página inicial

## 🚨 Configuração e Deploy

### Desenvolvimento Local
- Frontend: `npm start` (porta 3000)
- API: `cd api && node index.js` (porta 3001)
- Alternativa: `npm run dev-local` (ambos simultaneamente)

### Produção
- **Frontend:** Vercel (https://nutrifybe.vercel.app)
- **API:** Configuração para SQL Server cloud
- **Banco:** nutrifybe_db.mssql.somee.com

### Variáveis de Ambiente
- `NODE_ENV=production` para usar SQL Server
- `NODE_ENV=development` para usar JSON Server local

## 📋 Scripts Disponíveis

- `npm start` - Inicia frontend React
- `npm run build` - Build para produção
- `npm run server` - JSON Server local
- `npm run dev-local` - Frontend + JSON Server
- `npm run iniciar` - Script personalizado de inicialização