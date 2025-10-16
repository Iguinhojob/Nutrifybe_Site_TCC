# Configuração do Sistema Nutrifybe

## 🔧 Configuração de Backend

### Opção 1: JSON Server (Desenvolvimento)
```bash
# Instalar dependências
npm install

# Iniciar JSON Server
npm run server

# Em outro terminal, iniciar React
npm start
```

### Opção 2: Spring Boot (Produção)
```bash
# Instalar dependências do frontend
npm install

# Compilar e iniciar backend Java
cd nutrifybe-backend
mvn clean install
mvn spring-boot:run

# Em outro terminal, iniciar React com backend Java
npm run dev-java
```

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

### Para JSON Server:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_USE_JAVA_API=false
```

### Para Spring Boot Local:
```env
REACT_APP_JAVA_API_URL=http://localhost:8080
REACT_APP_USE_JAVA_API=true
```

### Para Spring Boot Remoto:
```env
REACT_APP_JAVA_API_URL=https://seu-backend.herokuapp.com
REACT_APP_USE_JAVA_API=true
```

## 📊 Banco de Dados

### SQL Server (Produção)
- Configurado no `application.properties`
- Servidor: nutrifybe_db.mssql.somee.com
- Banco: nutrifybe_db

### JSON Server (Desenvolvimento)
- Arquivo: `db.json`
- Dados de teste já incluídos

## 🚀 Scripts Disponíveis

- `npm start` - Inicia React (usa JSON Server por padrão)
- `npm run dev-java` - Inicia React com backend Java
- `npm run server` - Inicia apenas JSON Server
- `npm run backend:java` - Inicia apenas backend Java
- `npm run dev` - Inicia JSON Server + React simultaneamente

## 🔐 Usuários de Teste

### Admin
- Email: admin@nutrifybe.com
- Senha: admin123

### Nutricionista
- Email: nutri@teste.com
- CRN: 12345
- Senha: 123456