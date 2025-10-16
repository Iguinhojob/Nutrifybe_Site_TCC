# Nutrifybe - Sistema de Gestão Nutricional

Sistema completo para gestão de consultas nutricionais com backend Java Spring Boot e banco SQL Server.

## 🚀 Como Iniciar o Sistema

### Método Rápido (Recomendado)
```bash
# Instalar dependências
npm install

# Iniciar sistema completo
./iniciar-producao.sh

# Em outro terminal, iniciar frontend
npm start
```

### Método Manual
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar backend Java
cd nutrifybe-backend
mvn spring-boot:run

# 3. Em outro terminal, iniciar frontend
npm start
```

### URLs do Sistema
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8081
- **Banco:** SQL Server Somee.com (remoto)

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

### Banco SQL Server (Produção):
- **Servidor:** nutrifybe_db.mssql.somee.com
- **Banco:** nutrifybe_db
- **Usuário:** nutrifybe
- **Senha:** @ITB123456
- **Porta:** 1433

### Tabelas Principais:
- **Nutricionistas** - Dados dos profissionais
- **Pacientes** - Pacientes aceitos
- **SolicitacoesPendentes** - Solicitações aguardando aprovação
- **Admin** - Dados dos administradores
- **ActivityLog** - Log de atividades do sistema

### JSON Server (Desenvolvimento):
- Arquivo: `db.json`
- Porta: 3001

## 🔄 APIs Disponíveis

### Backend Java Spring Boot (Porta 8081)

#### Autenticação
- `POST /auth/login` - Login nutricionista
- `POST /auth/admin-login` - Login admin
- `POST /auth/register` - Registro nutricionista

#### Nutricionistas
- `GET /api/nutricionistas` - Listar todos
- `POST /api/nutricionistas` - Criar novo
- `PUT /api/nutricionistas/{id}` - Atualizar
- `DELETE /api/nutricionistas/{id}` - Excluir

#### Pacientes
- `GET /api/pacientes` - Listar todos
- `POST /api/pacientes` - Criar novo
- `PUT /api/pacientes/{id}` - Atualizar
- `DELETE /api/pacientes/{id}` - Excluir

#### Solicitações
- `GET /api/solicitacoes-pendentes` - Listar pendentes
- `POST /api/solicitacoes-pendentes` - Nova solicitação
- `DELETE /api/solicitacoes-pendentes/{id}` - Remover

#### Activity Log
- `GET /api/activity-log` - Listar logs
- `POST /api/activity-log` - Criar log

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js 19.1.1
- **Backend:** Java 17 + Spring Boot 3.2.0
- **Banco de Dados:** SQL Server (Somee.com)
- **ORM:** Spring Data JPA + Hibernate
- **Segurança:** Spring Security + JWT
- **Roteamento:** React Router 7.9.2
- **Estilização:** CSS customizado
- **Build:** Maven
- **Desenvolvimento:** JSON Server (alternativa)

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

### Para Produção:
- Mantenha os dois servidores rodando (React na porta 3000 e Java na porta 8081)
- O banco SQL Server está hospedado no Somee.com
- Certifique-se que o Java 17+ está instalado
- Use `./iniciar-producao.sh` para inicialização automática

### Para Desenvolvimento:
- Use `npm run server` para JSON Server na porta 3001
- Ou use o backend Java completo
- Configure a API base URL no frontend conforme necessário