# 🚀 Deploy do Sistema Nutrifybe

## 📋 Pré-requisitos
- Conta no [Render.com](https://render.com) (backend)
- Conta no [Netlify.com](https://netlify.com) (frontend)
- Repositório no GitHub

## 🔧 Passo a Passo

### 1. Backend (Render.com)
1. Acesse [Render.com](https://render.com)
2. Conecte sua conta GitHub
3. Clique em "New +" → "Web Service"
4. Selecione este repositório
5. Configure:
   - **Name:** nutrifybe-backend
   - **Root Directory:** nutrifybe-backend
   - **Environment:** Java
   - **Build Command:** `mvn clean install -DskipTests`
   - **Start Command:** `java -jar target/nutrifybe-backend-1.0.0.jar`
   - **Plan:** Free
6. Clique em "Create Web Service"
7. Aguarde o deploy (5-10 minutos)
8. Anote a URL gerada (ex: https://nutrifybe-backend.onrender.com)

### 2. Frontend (Netlify.com)
1. Acesse [Netlify.com](https://netlify.com)
2. Conecte sua conta GitHub
3. Clique em "New site from Git"
4. Selecione este repositório
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
   - **Environment variables:**
     - `REACT_APP_JAVA_API_URL`: URL do backend do Render
     - `NODE_VERSION`: 18
6. Clique em "Deploy site"
7. Aguarde o deploy (2-5 minutos)
8. Anote a URL gerada (ex: https://nutrifybe.netlify.app)

### 3. Atualizar CORS
1. No código do backend, atualize `CorsConfig.java`:
   ```java
   configuration.addAllowedOrigin("https://sua-url-netlify.netlify.app");
   ```
2. Faça commit e push para atualizar o Render

## 🌐 URLs Finais
- **Frontend:** https://nutrifybe.netlify.app
- **Backend:** https://nutrifybe-backend.onrender.com
- **Banco:** SQL Server Somee.com (já configurado)

## 🔐 Usuários de Teste
- **Admin:** admin@nutrifybe.com / admin123
- **Nutricionista:** nutri@teste.com / CRN: 12345 / 123456

## ⚡ Vantagens do Deploy
- ✅ Acesso de qualquer lugar
- ✅ Compartilhamento fácil
- ✅ Banco de dados remoto
- ✅ URLs profissionais
- ✅ HTTPS automático

## 🔄 Atualizações
Para atualizar o sistema:
1. Faça alterações no código
2. Commit e push para GitHub
3. Deploy automático no Render e Netlify