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

// Admin login
app.get('/api/admin', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Admin');
    res.json(result.recordset);
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

module.exports = app;