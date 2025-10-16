#!/bin/bash

echo "🚀 Iniciando Nutrifybe com SQL Server..."

# Parar processos existentes
pkill -f "spring-boot:run" 2>/dev/null
pkill -f "json-server" 2>/dev/null

# Configurar para usar Java backend
echo "REACT_APP_JAVA_API_URL=http://localhost:8081" > .env
echo "REACT_APP_USE_JAVA_API=true" >> .env

# Iniciar backend Java
echo "📊 Iniciando backend Java..."
cd nutrifybe-backend
nohup mvn spring-boot:run > backend.log 2>&1 &
cd ..

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 20

# Verificar se backend está rodando
if curl -s http://localhost:8081/api/nutricionistas > /dev/null; then
    echo "✅ Backend Java funcionando!"
else
    echo "❌ Erro ao iniciar backend Java"
    exit 1
fi

echo "🎉 Sistema pronto!"
echo "📱 Frontend: npm start"
echo "🔐 Admin: admin@nutrifybe.com / admin123"
echo "👨‍⚕️ Nutricionista: nutri@teste.com / CRN: 12345 / 123456"