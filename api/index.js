const express = require('express');
const cors = require('cors');
const sql = require('mssql');

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
app.get('/api/nutricionistas', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Nutricionistas');
    res.json(result.recordset);
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

app.delete('/api/nutricionistas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.connect(config);
    await sql.query`DELETE FROM Nutricionistas WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin
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

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    await sql.connect(config);
    await sql.query`UPDATE Pacientes SET ativo = ${ativo} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
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

module.exports = app;