# 🚀 INSTRUÇÕES PARA COMPUTADOR DA ESCOLA

## Opção 1: Comando Único (MAIS FÁCIL)
```bash
npm run iniciar
```

## Opção 2: Manual - Se json-server não funcionar
```bash
# 1. Instalar dependências (só na primeira vez)
npm install

# 2. Iniciar servidor alternativo
npm run server-local

# 3. Em outro terminal, iniciar React
npm start
```

## Opção 3: Tudo junto (se tiver concurrently)
```bash
npm install -g concurrently
npm run dev-local
```

## 🔧 Problemas Comuns

### Se npm install demora muito:
```bash
npm install --registry https://registry.npmmirror.com
```

### Se json-server não instala:
```bash
npm install -g json-server --force
```

### Se React demora pra iniciar:
- Feche outros programas
- Use `npm start -- --host 0.0.0.0`

## 📱 Acessar o Sistema
- **Aplicação:** http://localhost:3000
- **API:** http://localhost:3001

## 👤 Login de Teste
- **Admin:** admin@nutrifybe.com / admin123
- **Nutri:** nutri@teste.com / CRN: 12345 / Senha: 123456