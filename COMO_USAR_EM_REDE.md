# 🌐 Como Usar o Nutrifybe em Rede

## ❌ Problema Atual
O sistema só funciona no PC onde está instalado porque:
- SQL Server está configurado para `localhost`
- Frontend aponta para `localhost:3001`

## ✅ Soluções

### Opção 1: Usar em Rede Local (Recomendado)

**No PC Principal (onde está o banco):**
1. Liberar firewall para porta 3001:
```cmd
netsh advfirewall firewall add rule name="Nutrifybe Backend" dir=in action=allow protocol=TCP localport=3001
```

2. Descobrir IP da máquina:
```cmd
ipconfig
```

3. Alterar `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://SEU_IP_AQUI:3001';
```

**Nos outros PCs:**
- Apenas acessar: `http://IP_DO_PC_PRINCIPAL:3000`

### Opção 2: Banco Portátil (Mais Fácil)

Usar SQLite em vez de SQL Server:
- Arquivo único `database.db`
- Funciona em qualquer PC
- Não precisa instalar SQL Server

### Opção 3: Nuvem

Hospedar em:
- Vercel (frontend)
- Railway/Heroku (backend + banco)

## 🔧 Configuração Rápida para Rede

1. Execute no PC principal:
```cmd
cd backend
node config-rede.js
```

2. Use o IP mostrado para configurar outros PCs

## ⚠️ Limitações Atuais

- SQL Server só no PC principal
- Outros PCs precisam de acesso à rede
- Firewall pode bloquear conexões