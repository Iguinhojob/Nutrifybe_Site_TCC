require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const crypto = require('crypto');

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));



// Configuração do banco SQL Server usando variáveis de ambiente
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Função para sanitizar entrada
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};



// ===============================
// ROTAS DE AUTENTICAÇÃO
// ===============================

// Login Admin
app.post('/auth/admin/login', async (req, res) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.NVarChar(100), email)
      .query('SELECT * FROM Admin WHERE email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const admin = result.recordset[0];
    
    // Para compatibilidade, verificar se a senha já está hasheada
    let isValidPassword = false;
    if (admin.senha.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(senha, admin.senha);
    } else {
      // Senha em texto plano (migração)
      isValidPassword = senha === admin.senha;
      if (isValidPassword) {
        // Hash a senha para próximas vezes
        const hashedPassword = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS));
        await pool.request()
          .input('id', sql.Int, admin.id)
          .input('senha', sql.NVarChar(100), hashedPassword)
          .query('UPDATE Admin SET senha = @senha WHERE id = @id');
      }
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: admin.id, email: admin.email, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        type: 'admin'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login Nutricionista
app.post('/auth/nutricionista/login', async (req, res) => {
  const { email, crn, senha } = req.body;
  
  if (!email || !crn || !senha) {
    return res.status(400).json({ error: 'Email, CRN e senha são obrigatórios' });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.NVarChar(100), email)
      .input('crn', sql.NVarChar(20), crn)
      .query('SELECT * FROM Nutricionistas WHERE email = @email AND crn = @crn AND status = \'approved\' AND ativo = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas ou conta não aprovada' });
    }
    
    const nutricionista = result.recordset[0];
    
    // Para compatibilidade, verificar se a senha já está hasheada
    let isValidPassword = false;
    if (nutricionista.senha.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(senha, nutricionista.senha);
    } else {
      // Senha em texto plano (migração)
      isValidPassword = senha === nutricionista.senha;
      if (isValidPassword) {
        // Hash a senha para próximas vezes
        const hashedPassword = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS));
        await pool.request()
          .input('id', sql.Int, nutricionista.id)
          .input('senha', sql.NVarChar(100), hashedPassword)
          .query('UPDATE Nutricionistas SET senha = @senha WHERE id = @id');
      }
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: nutricionista.id, email: nutricionista.email, crn: nutricionista.crn, type: 'nutricionista' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: nutricionista.id,
        nome: nutricionista.nome,
        email: nutricionista.email,
        crn: nutricionista.crn,
        type: 'nutricionista'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===============================
// ROTAS NUTRICIONISTAS
// ===============================

app.get('/nutricionistas', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT id, nome, email, crn, telefone, especialidade, status, ativo, dataCriacao FROM Nutricionistas');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar nutricionistas' });
  }
});

app.get('/nutricionistas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  if (!validator.isInt(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id, nome, email, crn, telefone, especialidade, status, ativo, dataCriacao, foto FROM Nutricionistas WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Nutricionista não encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar nutricionista' });
  }
});

app.post('/nutricionistas', authenticateToken, async (req, res) => {
  const { nome, email, crn, senha, telefone, especialidade, status = 'pending', ativo = 1 } = req.body;
  
  // Validações de entrada
  if (!nome || !email || !crn || !senha) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email, crn, senha' });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }
  
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS));
    
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), sanitizeInput(nome))
      .input('email', sql.NVarChar(100), email.toLowerCase())
      .input('crn', sql.NVarChar(20), sanitizeInput(crn))
      .input('senha', sql.NVarChar(100), hashedPassword)
      .input('telefone', sql.NVarChar(20), sanitizeInput(telefone))
      .input('especialidade', sql.NVarChar(100), sanitizeInput(especialidade))
      .input('status', sql.NVarChar(20), status)
      .input('ativo', sql.Bit, ativo)
      .query(`INSERT INTO Nutricionistas (nome, email, crn, senha, telefone, especialidade, status, ativo) 
              OUTPUT INSERTED.* VALUES (@nome, @email, @crn, @senha, @telefone, @especialidade, @status, @ativo)`);
    
    // Não retornar a senha hasheada
    const { senha: _, ...nutricionistaSemSenha } = result.recordset[0];
    res.json(nutricionistaSemSenha);
  } catch (err) {
    console.error(err);
    if (err.number === 2627) { // Violação de chave única
      res.status(409).json({ error: 'Email ou CRN já cadastrado' });
    } else {
      res.status(500).json({ error: 'Erro ao criar nutricionista' });
    }
  }
});

app.put('/nutricionistas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    try {
      let query = 'UPDATE Nutricionistas SET ';
      const request = pool.request().input('id', sql.Int, parseInt(id));
      
      const fields = [];
      Object.keys(updates).forEach(key => {
        fields.push(`${key} = @${key}`);
        if (key === 'foto') {
          request.input(key, sql.NVarChar(sql.MAX), updates[key]);
        } else {
          request.input(key, updates[key]);
        }
      });
      
      query += fields.join(', ') + ' WHERE id = @id';
      await request.query(query);
      res.json({ message: 'Nutricionista atualizado' });
    } finally {
      await pool.close();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar nutricionista: ' + err.message });
  }
});

app.delete('/nutricionistas/:id', authenticateToken, async (req, res) => {
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

app.get('/pacientes', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Pacientes');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});

app.get('/pacientes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Pacientes WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
});

app.post('/pacientes', authenticateToken, async (req, res) => {
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

app.get('/admin', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Admin');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar admins' });
  }
});

app.post('/admin', authenticateToken, async (req, res) => {
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

app.put('/admin/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    console.log('Atualizando admin ID:', id);
    console.log('Campos a atualizar:', Object.keys(updates));
    if (updates.foto) {
      console.log('Tamanho da foto:', updates.foto.length, 'caracteres');
    }
    
    const pool = await sql.connect(dbConfig);
    let query = 'UPDATE Admin SET ';
    const request = pool.request().input('id', sql.Int, parseInt(id));
    
    const fields = [];
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = @${key}`);
      if (key === 'foto') {
        request.input(key, sql.NVarChar(sql.MAX), updates[key]);
      } else {
        request.input(key, updates[key]);
      }
    });
    
    query += fields.join(', ') + ' WHERE id = @id';
    console.log('Query SQL:', query);
    
    const result = await request.query(query);
    console.log('Linhas afetadas:', result.rowsAffected[0]);
    
    res.json({ message: 'Admin atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar admin:', err);
    res.status(500).json({ error: 'Erro ao atualizar admin: ' + err.message });
  }
});

app.delete('/admin/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Admin WHERE id = @id');
    res.json({ message: 'Admin deletado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar admin' });
  }
});

// ===============================
// ROTAS SOLICITAÇÕES
// ===============================

app.get('/solicitacoesPendentes', authenticateToken, async (req, res) => {
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

app.delete('/solicitacoesPendentes/:id', authenticateToken, async (req, res) => {
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

app.put('/pacientes/:id', authenticateToken, async (req, res) => {
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

app.delete('/pacientes/:id', authenticateToken, async (req, res) => {
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

app.delete('/activityLog/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM ActivityLog WHERE Id = @id');
    res.json({ message: 'Log deletado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar log' });
  }
});

app.delete('/activityLog', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request().query('DELETE FROM ActivityLog');
    res.json({ message: 'Todos os logs deletados' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao limpar logs' });
  }
});

// ===============================
// ROTAS LOG
// ===============================

app.get('/activityLog', authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM ActivityLog ORDER BY Data DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar log' });
  }
});

app.post('/activityLog', authenticateToken, async (req, res) => {
  const { action, nutriName } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
    const result = await pool.request()
      .input('action', sql.NVarChar(100), action)
      .input('usuario', sql.NVarChar(100), nutriName || 'Sistema')
      .input('data', sql.DateTime, now)
      .query(`INSERT INTO ActivityLog (Acao, Usuario, Data) 
              OUTPUT INSERTED.* VALUES (@action, @usuario, @data)`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar log' });
  }
});

// Testar conexão e verificar estrutura na inicialização
const testConnection = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Conectado ao SQL Server com sucesso!');
    
    // Verificar se coluna foto existe na tabela Admin
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_NAME = 'Admin' AND COLUMN_NAME = 'foto')
        BEGIN
          ALTER TABLE Admin ADD foto NVARCHAR(MAX)
          PRINT 'Coluna foto adicionada à tabela Admin'
        END
      `);
      
      // Verificar se coluna prescricaoSemanal existe na tabela Pacientes
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_NAME = 'Pacientes' AND COLUMN_NAME = 'prescricaoSemanal')
        BEGIN
          ALTER TABLE Pacientes ADD prescricaoSemanal NVARCHAR(MAX)
          PRINT 'Coluna prescricaoSemanal adicionada à tabela Pacientes'
        END
      `);
      
      // Verificar se coluna foto existe na tabela Nutricionistas
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_NAME = 'Nutricionistas' AND COLUMN_NAME = 'foto')
        BEGIN
          ALTER TABLE Nutricionistas ADD foto NVARCHAR(MAX)
          PRINT 'Coluna foto adicionada à tabela Nutricionistas'
        END
      `);
      
      console.log('✅ Estrutura do banco verificada!');
    } catch (err) {
      console.log('⚠️ Erro ao verificar estrutura:', err.message);
    }
    
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
