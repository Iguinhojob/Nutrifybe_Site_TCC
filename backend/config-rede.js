// Configuração para funcionar em rede
const os = require('os');

// Pegar IP da máquina automaticamente
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// Configuração do banco para rede
const dbConfig = {
  user: 'nutrifybe',
  password: '@ITB123456',
  server: localIP, // IP da máquina onde está o SQL Server
  database: 'nutrifybeDB',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

console.log(`🌐 IP da máquina: ${localIP}`);
console.log(`📡 Outros PCs devem acessar: http://${localIP}:3000`);
console.log(`🗄️ Backend rodará em: http://${localIP}:3001`);

module.exports = { dbConfig, localIP };