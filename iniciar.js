const { exec } = require('child_process');

console.log('🚀 Iniciando Nutrifybe...\n');

// Instalar dependências
console.log('📦 Instalando dependências...');
exec('npm install', (error) => {
  if (error) {
    console.log('⚠️  Erro na instalação, continuando...');
  }
  
  // Iniciar servidor
  console.log('🔧 Iniciando servidor...');
  const server = exec('npm run server-local');
  
  setTimeout(() => {
    console.log('⚡ Iniciando React...');
    exec('npm start');
    
    console.log('\n✅ Sistema iniciado!');
    console.log('📱 App: http://localhost:3000');
    console.log('🔗 API: http://localhost:3001');
  }, 3000);
});