const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Nutrifybe...\n');

// Função segura para executar comandos
const safeExec = (command, args = [], options = {}) => {
  return spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });
};

// Instalar dependências
console.log('📦 Instalando dependências...');
const install = safeExec('npm', ['install']);

install.on('close', (code) => {
  if (code !== 0) {
    console.log('⚠️  Erro na instalação, continuando...');
  }
  
  // Iniciar servidor
  console.log('🔧 Iniciando servidor...');
  safeExec('npm', ['run', 'server-local']);
  
  setTimeout(() => {
    console.log('⚡ Iniciando React...');
    safeExec('npm', ['start']);
    
    console.log('\n✅ Sistema iniciado!');
    console.log('📱 App: http://localhost:3000');
    console.log('🔗 API: http://localhost:3001');
  }, 3000);
});