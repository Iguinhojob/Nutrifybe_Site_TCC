const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const dbPath = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Ler dados do arquivo
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler db.json:', error);
    return { nutricionistas: [], pacientes: [], solicitacoesPendentes: [], admin: [], activityLog: [] };
  }
};

// Escrever dados no arquivo
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao escrever db.json:', error);
  }
};

// Rotas GET
app.get('/nutricionistas', (req, res) => {
  const db = readDB();
  res.json(db.nutricionistas || []);
});

app.get('/pacientes', (req, res) => {
  const db = readDB();
  res.json(db.pacientes || []);
});

app.get('/solicitacoesPendentes', (req, res) => {
  const db = readDB();
  res.json(db.solicitacoesPendentes || []);
});

app.get('/admin', (req, res) => {
  const db = readDB();
  res.json(db.admin || []);
});

app.get('/activityLog', (req, res) => {
  const db = readDB();
  res.json(db.activityLog || []);
});

// Rotas POST
app.post('/nutricionistas', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now().toString() };
  db.nutricionistas.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.post('/pacientes', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now().toString() };
  db.pacientes.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.post('/solicitacoesPendentes', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now().toString() };
  db.solicitacoesPendentes.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.post('/admin', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now().toString() };
  db.admin.push(newItem);
  writeDB(db);
  res.json(newItem);
});

app.post('/activityLog', (req, res) => {
  const db = readDB();
  const newItem = { ...req.body, id: Date.now() };
  db.activityLog.push(newItem);
  writeDB(db);
  res.json(newItem);
});

// Rotas PUT
app.put('/:table/:id', (req, res) => {
  const { table, id } = req.params;
  const db = readDB();
  
  if (db[table]) {
    const index = db[table].findIndex(item => item.id == id);
    if (index !== -1) {
      db[table][index] = { ...db[table][index], ...req.body };
      writeDB(db);
      res.json(db[table][index]);
    } else {
      res.status(404).json({ error: 'Item não encontrado' });
    }
  } else {
    res.status(404).json({ error: 'Tabela não encontrada' });
  }
});

// Rotas DELETE
app.delete('/:table/:id', (req, res) => {
  const { table, id } = req.params;
  const db = readDB();
  
  if (db[table]) {
    const index = db[table].findIndex(item => item.id == id);
    if (index !== -1) {
      const deleted = db[table].splice(index, 1)[0];
      writeDB(db);
      res.json(deleted);
    } else {
      res.status(404).json({ error: 'Item não encontrado' });
    }
  } else {
    res.status(404).json({ error: 'Tabela não encontrada' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});