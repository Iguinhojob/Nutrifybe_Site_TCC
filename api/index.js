const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  server: 'nutrifybe_db.mssql.somee.com',
  database: 'nutrifybe_db',
  user: 'iguinhojob_SQLLogin_1',
  password: '9v3b3yub2i',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Nutricionistas
app.post('/api/nutricionistas/login', async (req, res) => {
  try {
    const { email, crn, senha } = req.body;
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Nutricionistas WHERE email = ${email} AND crn = ${crn} AND status = 'approved' AND ativo = 1`;
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      const isValidPassword = await bcrypt.compare(senha, user.senha);
      
      if (isValidPassword) {
        res.json({ success: true, nutricionista: user });
      } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/nutricionistas', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Nutricionistas');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/nutricionistas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Nutricionistas WHERE id = ${id}`;
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: 'Nutricionista não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/nutricionistas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ativo } = req.body;
    await sql.connect(config);
    let query = 'UPDATE Nutricionistas SET ';
    const updates = [];
    if (status) updates.push(`status = '${status}'`);
    if (ativo !== undefined) updates.push(`ativo = ${ativo}`);
    query += updates.join(', ') + ` WHERE id = ${id}`;
    await sql.query(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nutricionistas', async (req, res) => {
  try {
    const { nome, email, crn, senha, status, ativo, telefone, especialidade } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    await sql.connect(config);
    await sql.query`INSERT INTO Nutricionistas (nome, email, crn, senha, status, ativo, telefone, especialidade, data_criacao) VALUES (${nome}, ${email}, ${crn}, ${hashedPassword}, ${status}, ${ativo}, ${telefone}, ${especialidade}, GETDATE())`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nutricionistas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [${new Date().toLocaleString()}] DELETING NUTRICIONISTA - ID: ${id}`);
    await sql.connect(config);
    
    // Verificar se tem pacientes vinculados
    const pacientesResult = await sql.query`SELECT COUNT(*) as count FROM Pacientes WHERE nutricionista_id = ${id}`;
    const pacientesCount = pacientesResult.recordset[0].count;
    
    if (pacientesCount > 0) {
      console.log(`⚠️ [${new Date().toLocaleString()}] CANNOT DELETE - ${pacientesCount} patients linked`);
      return res.status(400).json({ error: `Não é possível excluir. Este nutricionista tem ${pacientesCount} paciente(s) vinculado(s).` });
    }
    
    await sql.query`DELETE FROM Nutricionistas WHERE id = ${id}`;
    console.log(`✅ [${new Date().toLocaleString()}] NUTRICIONISTA DELETED SUCCESSFULLY`);
    res.json({ success: true });
  } catch (err) {
    console.log(`🚨 [${new Date().toLocaleString()}] ERROR: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Admin
app.post('/api/admin', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    await sql.connect(config);
    await sql.query`INSERT INTO Admin (nome, email, senha, data_criacao) VALUES (${nome}, ${email}, ${senha}, GETDATE())`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Admin');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, foto } = req.body;
    await sql.connect(config);
    let query = 'UPDATE Admin SET ';
    const updates = [];
    if (nome) updates.push(`nome = '${nome.replace(/'/g, "''")}'`);
    if (email) updates.push(`email = '${email.replace(/'/g, "''")}'`);
    if (senha) updates.push(`senha = '${senha.replace(/'/g, "''")}'`);
    if (foto !== undefined) updates.push(`foto = ${foto ? `'${foto.replace(/'/g, "''")}'` : 'NULL'}`);
    query += updates.join(', ') + ` WHERE id = ${id}`;
    await sql.query(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(config);
    await sql.query`DELETE FROM Admin WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Pacientes');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Pacientes WHERE id = ${id}`;
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: 'Paciente não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const { nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId, status, ativo } = req.body;
    await sql.connect(config);
    await sql.query`INSERT INTO Pacientes (nome, email, idade, peso, altura, objetivo, condicao_saude, nutricionista_id, status, ativo, data_criacao) VALUES (${nome}, ${email}, ${idade}, ${peso}, ${altura}, ${objetivo}, ${condicaoSaude}, ${nutricionistaId}, ${status}, ${ativo}, GETDATE())`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo, prescricaoSemanal, nutricionistaId, calendario } = req.body;
    console.log(`🔄 [${new Date().toLocaleString()}] UPDATING PACIENTE - ID: ${id}, Ativo: ${ativo}, Prescricao: ${prescricaoSemanal ? 'YES' : 'NO'}, NutricionistaId: ${nutricionistaId}`);
    await sql.connect(config);
    
    let query = 'UPDATE Pacientes SET ';
    const updates = [];
    if (ativo !== undefined) updates.push(`ativo = ${ativo}`);
    if (prescricaoSemanal !== undefined) {
      const cleanPrescricao = prescricaoSemanal.replace(/'/g, "''");
      updates.push(`prescricao_semanal = N'${cleanPrescricao}'`);
    }
    if (nutricionistaId !== undefined) updates.push(`nutricionista_id = ${nutricionistaId}`);
    if (calendario !== undefined) {
      const cleanCalendario = JSON.stringify(calendario).replace(/'/g, "''");
      updates.push(`calendario = N'${cleanCalendario}'`);
    }
    
    if (updates.length === 0) {
      console.log(`⚠️ [${new Date().toLocaleString()}] NO FIELDS TO UPDATE`);
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    query += updates.join(', ') + ` WHERE id = ${id}`;
    console.log(`📊 [${new Date().toLocaleString()}] SQL QUERY: ${query}`);
    await sql.query(query);
    console.log(`✅ [${new Date().toLocaleString()}] PACIENTE UPDATED SUCCESSFULLY`);
    res.json({ success: true });
  } catch (err) {
    console.log(`🚨 [${new Date().toLocaleString()}] ERROR: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(config);
    await sql.query`DELETE FROM Pacientes WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solicitações
app.get('/api/solicitacoesPendentes', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM SolicitacoesPendentes');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/solicitacoesPendentes', async (req, res) => {
  try {
    const { nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId } = req.body;
    await sql.connect(config);
    await sql.query`INSERT INTO SolicitacoesPendentes (nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId) VALUES (${nome}, ${email}, ${idade}, ${peso}, ${altura}, ${objetivo}, ${condicaoSaude}, ${nutricionistaId})`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/solicitacoesPendentes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(config);
    await sql.query`DELETE FROM SolicitacoesPendentes WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activity Log
app.get('/api/activityLog', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM ActivityLog ORDER BY timestamp DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activityLog', async (req, res) => {
  try {
    const { action, nutriName } = req.body;
    await sql.connect(config);
    await sql.query`INSERT INTO ActivityLog (action, nutriName, timestamp) VALUES (${action}, ${nutriName}, GETDATE())`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/activityLog', async (req, res) => {
  try {
    await sql.connect(config);
    await sql.query('DELETE FROM ActivityLog');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint
app.get('/api/debug/pacientes', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT id, nome, prescricao_semanal FROM Pacientes');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

// Para Vercel (serverless)
module.exports = app;