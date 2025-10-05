import 'dotenv/config';
import sql from 'mssql';

const dbConfig = {
  user: process.env.DB_USER || 'nutrifybe',
  password: process.env.DB_PASSWORD || '@ITB123456',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'nutrifybeDB',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function testarBanco() {
  try {
    console.log('🔄 Testando conexão com SQL Server...');
    const pool = await sql.connect(dbConfig);
    console.log('✅ Conectado ao SQL Server!');

    // Testar tabelas
    const tabelas = ['Nutricionistas', 'Pacientes', 'SolicitacoesPendentes', 'Admin', 'ActivityLog'];
    
    for (const tabela of tabelas) {
      try {
        const result = await pool.request().query(`SELECT COUNT(*) as total FROM ${tabela}`);
        console.log(`✅ ${tabela}: ${result.recordset[0].total} registros`);
      } catch (err) {
        console.log(`❌ ${tabela}: Erro - ${err.message}`);
      }
    }

    // Testar dados específicos
    const nutris = await pool.request().query('SELECT nome, email, status, ativo FROM Nutricionistas');
    console.log('\n📊 Nutricionistas:');
    nutris.recordset.forEach(n => {
      console.log(`  - ${n.nome} (${n.email}) - Status: ${n.status} - Ativo: ${n.ativo}`);
    });

    const admins = await pool.request().query('SELECT nome, email FROM Admin');
    console.log('\n👤 Admins:');
    admins.recordset.forEach(a => {
      console.log(`  - ${a.nome} (${a.email})`);
    });

    await pool.close();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verifique se SQL Server está rodando');
    console.log('2. Execute o script database.sql para criar as tabelas');
    console.log('3. Execute o script corrigir_banco.sql para adicionar colunas');
  }
}

testarBanco();