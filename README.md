# Nutrifybe - Sistema de Gestão Nutricional

Sistema completo para gestão de consultas nutricionais com banco de dados SQL Server.

## 🚀 Como Iniciar o Sistema

### 1. Instalar Dependências do Frontend
```bash
npm install
```

### 2. Instalar Dependências do Backend
```bash
cd backend
npm install
```

### 3. Iniciar o Backend SQL Server
```bash
cd backend
node index.js
```
O backend estará disponível em: `http://localhost:3001`

### 4. Iniciar a Aplicação (em outro terminal)
```bash
npm start
```
A aplicação estará disponível em: `http://localhost:3000`

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
- ✅ Escolher nutricionista
- ✅ Preencher dados pessoais e objetivos

### Para Nutricionistas
- ✅ Login com email, CRN e senha
- ✅ Dashboard com lista de pacientes
- ✅ Gerenciar solicitações pendentes
- ✅ Aceitar/recusar pacientes
- ✅ Criar prescrições semanais
- ✅ Transferir pacientes para outros nutricionistas
- ✅ Encerrar atendimentos

### Para Administradores
- ✅ Login administrativo
- ✅ Gerenciar nutricionistas (aprovar/rejeitar/excluir)
- ✅ Adicionar nutricionistas manualmente
- ✅ Consultar por CRN
- ✅ Log de atividades
- ✅ Dashboard com estatísticas

## 📊 Estrutura do Banco de Dados SQL Server

### Tabelas Principais:
- **Nutricionistas** - Dados dos profissionais
- **Pacientes** - Pacientes aceitos
- **SolicitacoesPendentes** - Solicitações aguardando aprovação
- **Admin** - Dados dos administradores
- **ActivityLog** - Log de atividades do sistema

### Configuração do Banco:
- **Servidor:** localhost
- **Banco:** nutrifybeDB
- **Usuário:** nutrifybe
- **Senha:** @ITB123456

## 🔄 APIs Disponíveis

### Nutricionistas
- `GET /nutricionistas` - Listar todos
- `POST /nutricionistas` - Criar novo
- `PUT /nutricionistas/:id` - Atualizar
- `DELETE /nutricionistas/:id` - Excluir

### Pacientes
- `GET /pacientes` - Listar todos
- `POST /pacientes` - Criar novo
- `PUT /pacientes/:id` - Atualizar
- `DELETE /pacientes/:id` - Excluir

### Solicitações
- `GET /solicitacoesPendentes` - Listar pendentes
- `POST /solicitacoesPendentes` - Nova solicitação
- `DELETE /solicitacoesPendentes/:id` - Remover

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js
- **Backend:** Node.js + Express
- **Banco de Dados:** SQL Server
- **ORM:** mssql (driver nativo)
- **Roteamento:** React Router
- **Estilização:** CSS customizado

## 📝 Fluxo de Uso

1. **Paciente** solicita consulta pelo site
2. **Nutricionista** recebe solicitação e pode aceitar/recusar
3. **Nutricionista** cria prescrições e acompanha paciente
4. **Admin** gerencia nutricionistas e monitora sistema

## 🔒 Autenticação

- Nutricionistas: Email + CRN + Senha
- Admin: Email + Senha
- Sessões salvas no localStorage

## 📱 Responsividade

Sistema totalmente responsivo, funcionando em:
- Desktop
- Tablet
- Mobile

## 🚨 Importante

- Mantenha os dois servidores rodando (React na porta 3000 e Backend na porta 3001)
- Certifique-se que o SQL Server está ativo no Windows
- O banco `nutrifybeDB` deve estar criado antes de iniciar
- Execute os scripts SQL da pasta backend para criar as tabelas