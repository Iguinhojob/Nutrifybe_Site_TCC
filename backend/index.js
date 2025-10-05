const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do banco SQL Server
const dbConfig = {
  user: 'nutrifybe',
  password: '@ITB123456',
  server: 'localhost',
  database: 'nutrifybeDB',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// ===============================
// ROTAS NUTRICIONISTAS
// ===============================

app.get('/nutricionistas', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Nutricionistas');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar nutricionistas' });
  }
});

app.post('/nutricionistas', async (req, res) => {
  const { nome, email, crn, senha, telefone, especialidade, status = 'pending', ativo = 1 } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), nome)
      .input('email', sql.NVarChar(100), email)
      .input('crn', sql.NVarChar(20), crn)
      .input('senha', sql.NVarChar(100), senha)
      .input('telefone', sql.NVarChar(20), telefone)
      .input('especialidade', sql.NVarChar(100), especialidade)
      .input('status', sql.NVarChar(20), status)
      .input('ativo', sql.Bit, ativo)
      .query(`INSERT INTO Nutricionistas (nome, email, crn, senha, telefone, especialidade, status, ativo) 
              OUTPUT INSERTED.* VALUES (@nome, @email, @crn, @senha, @telefone, @especialidade, @status, @ativo)`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar nutricionista' });
  }
});

app.put('/nutricionistas/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    let query = 'UPDATE Nutricionistas SET ';
    const request = pool.request().input('id', sql.Int, id);
    
    const fields = [];
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = @${key}`);
      request.input(key, updates[key]);
    });
    
    query += fields.join(', ') + ' WHERE id = @id';
    await request.query(query);
    res.json({ message: 'Nutricionista atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar nutricionista' });
  }
});

app.delete('/nutricionistas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Nutricionistas WHERE id = @id');
    res.json({ message: 'Nutricionista deletado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar nutricionista' });
  }
});

// ===============================
// ROTAS PACIENTES
// ===============================

app.get('/pacientes', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Pacientes');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});

app.post('/pacientes', async (req, res) => {
  const { nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId, status = 'accepted', ativo = 1 } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), nome)
      .input('email', sql.NVarChar(100), email)
      .input('idade', sql.Int, idade)
      .input('peso', sql.Decimal(5,2), peso)
      .input('altura', sql.Decimal(5,2), altura)
      .input('objetivo', sql.NVarChar(255), objetivo)
      .input('condicaoSaude', sql.NVarChar(255), condicaoSaude)
      .input('nutricionistaId', sql.Int, nutricionistaId)
      .input('status', sql.NVarChar(20), status)
      .input('ativo', sql.Bit, ativo)
      .query(`INSERT INTO Pacientes (nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId, status, ativo) 
              OUTPUT INSERTED.* VALUES (@nome, @email, @idade, @peso, @altura, @objetivo, @condicaoSaude, @nutricionistaId, @status, @ativo)`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar paciente' });
  }
});

// ===============================
// ROTAS ADMIN
// ===============================

app.get('/admin', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Admin');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar admins' });
  }
});

app.post('/admin', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), nome)
      .input('email', sql.NVarChar(100), email)
      .input('senha', sql.NVarChar(100), senha)
      .query(`INSERT INTO Admin (nome, email, senha, dataCriacao) 
              OUTPUT INSERTED.* VALUES (@nome, @email, @senha, GETDATE())`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar admin' });
  }
});

// ===============================
// ROTAS SOLICITAÇÕES
// ===============================

app.get('/solicitacoesPendentes', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM SolicitacoesPendentes');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar solicitações' });
  }
});

app.post('/solicitacoesPendentes', async (req, res) => {
  const { nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), nome)
      .input('email', sql.NVarChar(100), email)
      .input('idade', sql.Int, idade)
      .input('peso', sql.Decimal(5,2), peso)
      .input('altura', sql.Decimal(5,2), altura)
      .input('objetivo', sql.NVarChar(255), objetivo)
      .input('condicaoSaude', sql.NVarChar(255), condicaoSaude)
      .input('nutricionistaId', sql.Int, nutricionistaId)
      .query(`INSERT INTO SolicitacoesPendentes (nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId) 
              OUTPUT INSERTED.* VALUES (@nome, @email, @idade, @peso, @altura, @objetivo, @condicaoSaude, @nutricionistaId)`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar solicitação' });
  }
});

app.delete('/solicitacoesPendentes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM SolicitacoesPendentes WHERE id = @id');
    res.json({ message: 'Solicitação deletada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar solicitação' });
  }
});

app.put('/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    let query = 'UPDATE Pacientes SET ';
    const request = pool.request().input('id', sql.Int, id);
    
    const fields = [];
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = @${key}`);
      request.input(key, updates[key]);
    });
    
    query += fields.join(', ') + ' WHERE id = @id';
    await request.query(query);
    res.json({ message: 'Paciente atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
});

app.delete('/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Pacientes WHERE id = @id');
    res.json({ message: 'Paciente deletado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar paciente' });
  }
});

app.delete('/activityLog/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ActivityLog WHERE id = @id');
    res.json({ message: 'Log deletado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar log' });
  }
});

// ===============================
// ROTAS LOG
// ===============================

app.get('/activityLog', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM ActivityLog ORDER BY timestamp DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar log' });
  }
});

app.post('/activityLog', async (req, res) => {
  const { action, nutriName } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('action', sql.NVarChar(100), action)
      .input('nutriName', sql.NVarChar(100), nutriName)
      .query(`INSERT INTO ActivityLog (action, nutriName, timestamp) 
              OUTPUT INSERTED.* VALUES (@action, @nutriName, GETDATE())`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar log' });
  }
});

// Testar conexão na inicialização
const testConnection = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Conectado ao SQL Server com sucesso!');
    await pool.close();
  } catch (err) {
    console.error('❌ Erro de conexão SQL Server:', err.message);
    console.log('💡 Tentativas de solução:');
    console.log('1. Verifique se SQL Server está rodando');
    console.log('2. Confirme o nome do servidor: DESKTOP-GOG4I68');
    console.log('3. Verifique se o banco NutrifybeDB existe');
  }
};

// ===============================
// INICIAR SERVIDOR
// ===============================
app.listen(3001, () => {
  console.log('✅ Backend SQL Server rodando na porta 3001');
  console.log('🗄️ Testando conexão com NutrifybeDB...');
  testConnection();
});
