# Nutrifybe - Sistema de Gestão Nutricional

Sistema completo para gestão de consultas nutricionais com banco de dados integrado.

## 🚀 Como Iniciar o Sistema

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Banco de Dados
```bash
npm run server
```
O banco de dados estará disponível em: `http://localhost:3001`

### 3. Iniciar a Aplicação (em outro terminal)
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

## 📊 Estrutura do Banco de Dados

### Tabelas Principais:
- **nutricionistas** - Dados dos profissionais
- **pacientes** - Pacientes aceitos
- **solicitacoesPendentes** - Solicitações aguardando aprovação
- **admin** - Dados dos administradores
- **activityLog** - Log de atividades do sistema

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
- **Backend:** JSON Server (API REST)
- **Banco de Dados:** JSON (arquivo db.json)
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

- Mantenha os dois servidores rodando (React na porta 3000 e JSON Server na porta 3001)
- O banco de dados é salvo automaticamente no arquivo `db.json`
- Para resetar dados, edite o arquivo `db.json` diretamente