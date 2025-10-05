-- =============================================
-- BANCO DE DADOS NUTRIFYBE COMPLETO
-- =============================================

-- Criar banco se não existir
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'nutrifybeDB')
BEGIN
    CREATE DATABASE nutrifybeDB;
END
GO

USE nutrifybeDB;
GO

-- =============================================
-- TABELA ADMIN
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Admin' AND xtype='U')
BEGIN
    CREATE TABLE Admin (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        senha NVARCHAR(100) NOT NULL,
        dataCriacao DATETIME DEFAULT GETDATE()
    );
END
GO

-- =============================================
-- TABELA NUTRICIONISTAS
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Nutricionistas' AND xtype='U')
BEGIN
    CREATE TABLE Nutricionistas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        crn NVARCHAR(20) UNIQUE NOT NULL,
        senha NVARCHAR(100) NOT NULL,
        telefone NVARCHAR(20),
        especialidade NVARCHAR(100),
        status NVARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
        ativo BIT DEFAULT 1, -- 1=ativo, 0=inativo
        dataCriacao DATETIME DEFAULT GETDATE()
    );
END
GO

-- =============================================
-- TABELA PACIENTES
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pacientes' AND xtype='U')
BEGIN
    CREATE TABLE Pacientes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        idade INT,
        peso DECIMAL(5,2),
        altura DECIMAL(5,2),
        objetivo NVARCHAR(255),
        condicaoSaude NVARCHAR(255),
        nutricionistaId INT,
        status NVARCHAR(20) DEFAULT 'accepted', -- accepted, transferred, finished
        ativo BIT DEFAULT 1, -- 1=ativo, 0=inativo
        prescricaoSemanal NVARCHAR(MAX),
        dataCriacao DATETIME DEFAULT GETDATE(),
        dataUltimaAtualizacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (nutricionistaId) REFERENCES Nutricionistas(id)
    );
END
GO

-- =============================================
-- TABELA SOLICITAÇÕES PENDENTES
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SolicitacoesPendentes' AND xtype='U')
BEGIN
    CREATE TABLE SolicitacoesPendentes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        idade INT,
        peso DECIMAL(5,2),
        altura DECIMAL(5,2),
        objetivo NVARCHAR(255),
        condicaoSaude NVARCHAR(255),
        nutricionistaId INT,
        ativo BIT DEFAULT 1,
        dataSolicitacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (nutricionistaId) REFERENCES Nutricionistas(id)
    );
END
GO

-- =============================================
-- TABELA LOG DE ATIVIDADES
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActivityLog' AND xtype='U')
BEGIN
    CREATE TABLE ActivityLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        action NVARCHAR(100) NOT NULL, -- Aprovado, Rejeitado, Excluído, etc.
        nutriName NVARCHAR(100),
        descricao NVARCHAR(255),
        timestamp DATETIME DEFAULT GETDATE()
    );
END
GO

-- =============================================
-- TABELA PRESCRIÇÕES (NOVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Prescricoes' AND xtype='U')
BEGIN
    CREATE TABLE Prescricoes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        pacienteId INT NOT NULL,
        nutricionistaId INT NOT NULL,
        titulo NVARCHAR(100),
        conteudo NVARCHAR(MAX),
        semana INT DEFAULT 1,
        ativa BIT DEFAULT 1,
        dataCriacao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (pacienteId) REFERENCES Pacientes(id),
        FOREIGN KEY (nutricionistaId) REFERENCES Nutricionistas(id)
    );
END
GO

-- =============================================
-- TABELA TRANSFERÊNCIAS (NOVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Transferencias' AND xtype='U')
BEGIN
    CREATE TABLE Transferencias (
        id INT IDENTITY(1,1) PRIMARY KEY,
        pacienteId INT NOT NULL,
        nutricionistaOrigemId INT NOT NULL,
        nutricionistaDestinoId INT NOT NULL,
        motivo NVARCHAR(255),
        dataTransferencia DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (pacienteId) REFERENCES Pacientes(id),
        FOREIGN KEY (nutricionistaOrigemId) REFERENCES Nutricionistas(id),
        FOREIGN KEY (nutricionistaDestinoId) REFERENCES Nutricionistas(id)
    );
END
GO

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Admin padrão
IF NOT EXISTS (SELECT * FROM Admin WHERE email = 'admin@nutrifybe.com')
BEGIN
    INSERT INTO Admin (nome, email, senha) VALUES 
    ('Administrador Sistema', 'admin@nutrifybe.com', 'admin123');
END
GO

-- Nutricionista de teste
IF NOT EXISTS (SELECT * FROM Nutricionistas WHERE email = 'nutri@teste.com')
BEGIN
    INSERT INTO Nutricionistas (nome, email, crn, senha, telefone, especialidade, status, ativo) VALUES 
    ('Dr. João Silva', 'nutri@teste.com', '12345', '123456', '(11) 99999-9999', 'Nutrição Clínica', 'approved', 1);
END
GO

-- Nutricionista adicional
IF NOT EXISTS (SELECT * FROM Nutricionistas WHERE email = 'maria@nutrifybe.com')
BEGIN
    INSERT INTO Nutricionistas (nome, email, crn, senha, telefone, especialidade, status, ativo) VALUES 
    ('Dra. Maria Santos', 'maria@nutrifybe.com', '54321', 'senha123', '(11) 88888-8888', 'Nutrição Esportiva', 'approved', 1);
END
GO

-- Paciente de exemplo
IF NOT EXISTS (SELECT * FROM Pacientes WHERE email = 'paciente@teste.com')
BEGIN
    INSERT INTO Pacientes (nome, email, idade, peso, altura, objetivo, condicaoSaude, nutricionistaId, status, ativo) VALUES 
    ('Ana Costa', 'paciente@teste.com', 28, 65.5, 1.65, 'Perder peso', 'Nenhuma condição especial', 1, 'accepted', 1);
END
GO

-- Log inicial
INSERT INTO ActivityLog (action, nutriName, descricao) VALUES 
('Sistema Iniciado', 'Sistema', 'Banco de dados Nutrifybe criado com sucesso');
GO

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para buscas frequentes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Nutricionistas_Email')
    CREATE INDEX IX_Nutricionistas_Email ON Nutricionistas(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Nutricionistas_CRN')
    CREATE INDEX IX_Nutricionistas_CRN ON Nutricionistas(crn);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Pacientes_NutricionistaId')
    CREATE INDEX IX_Pacientes_NutricionistaId ON Pacientes(nutricionistaId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_Timestamp')
    CREATE INDEX IX_ActivityLog_Timestamp ON ActivityLog(timestamp DESC);

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View para estatísticas do dashboard
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_EstatisticasSistema')
    DROP VIEW vw_EstatisticasSistema;
GO

CREATE VIEW vw_EstatisticasSistema AS
SELECT 
    (SELECT COUNT(*) FROM Nutricionistas) AS TotalNutricionistas,
    (SELECT COUNT(*) FROM Nutricionistas WHERE status = 'approved' AND ativo = 1) AS NutricionistasAtivos,
    (SELECT COUNT(*) FROM Nutricionistas WHERE status = 'pending') AS NutricionistasPendentes,
    (SELECT COUNT(*) FROM Pacientes) AS TotalPacientes,
    (SELECT COUNT(*) FROM Pacientes WHERE ativo = 1) AS PacientesAtivos,
    (SELECT COUNT(*) FROM SolicitacoesPendentes) AS SolicitacoesPendentes,
    (SELECT COUNT(*) FROM Admin) AS TotalAdmins;
GO

-- View para pacientes com nutricionista
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_PacientesCompleto')
    DROP VIEW vw_PacientesCompleto;
GO

CREATE VIEW vw_PacientesCompleto AS
SELECT 
    p.id,
    p.nome AS pacienteNome,
    p.email AS pacienteEmail,
    p.idade,
    p.peso,
    p.altura,
    p.objetivo,
    p.condicaoSaude,
    p.status AS pacienteStatus,
    p.ativo AS pacienteAtivo,
    p.prescricaoSemanal,
    p.dataCriacao,
    n.nome AS nutricionistaNome,
    n.email AS nutricionistaEmail,
    n.crn AS nutricionistaCRN,
    n.especialidade
FROM Pacientes p
LEFT JOIN Nutricionistas n ON p.nutricionistaId = n.id;
GO

-- =============================================
-- PROCEDURES ÚTEIS
-- =============================================

-- Procedure para transferir paciente
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_TransferirPaciente')
    DROP PROCEDURE sp_TransferirPaciente;
GO

CREATE PROCEDURE sp_TransferirPaciente
    @PacienteId INT,
    @NovoNutricionistaId INT,
    @Motivo NVARCHAR(255) = NULL
AS
BEGIN
    DECLARE @NutricionistaAtualId INT;
    
    -- Buscar nutricionista atual
    SELECT @NutricionistaAtualId = nutricionistaId 
    FROM Pacientes 
    WHERE id = @PacienteId;
    
    -- Atualizar paciente
    UPDATE Pacientes 
    SET nutricionistaId = @NovoNutricionistaId,
        dataUltimaAtualizacao = GETDATE()
    WHERE id = @PacienteId;
    
    -- Registrar transferência
    INSERT INTO Transferencias (pacienteId, nutricionistaOrigemId, nutricionistaDestinoId, motivo)
    VALUES (@PacienteId, @NutricionistaAtualId, @NovoNutricionistaId, @Motivo);
    
    -- Log da atividade
    INSERT INTO ActivityLog (action, nutriName, descricao)
    VALUES ('Transferência', 'Sistema', 'Paciente ID ' + CAST(@PacienteId AS NVARCHAR) + ' transferido');
END
GO

-- =============================================
-- TRIGGERS PARA AUDITORIA
-- =============================================

-- Trigger para log de alterações em nutricionistas
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_Nutricionistas_Audit')
    DROP TRIGGER tr_Nutricionistas_Audit;
GO

CREATE TRIGGER tr_Nutricionistas_Audit
ON Nutricionistas
AFTER UPDATE
AS
BEGIN
    IF UPDATE(status)
    BEGIN
        INSERT INTO ActivityLog (action, nutriName, descricao)
        SELECT 
            CASE 
                WHEN i.status = 'approved' THEN 'Aprovado'
                WHEN i.status = 'rejected' THEN 'Rejeitado'
                ELSE 'Status Alterado'
            END,
            i.nome,
            'Status alterado para: ' + i.status
        FROM inserted i;
    END
    
    IF UPDATE(ativo)
    BEGIN
        INSERT INTO ActivityLog (action, nutriName, descricao)
        SELECT 
            CASE WHEN i.ativo = 1 THEN 'Ativado' ELSE 'Desativado' END,
            i.nome,
            'Status de ativação alterado'
        FROM inserted i;
    END
END
GO

PRINT '✅ Banco de dados Nutrifybe criado com sucesso!';
PRINT '📊 Tabelas: Admin, Nutricionistas, Pacientes, SolicitacoesPendentes, ActivityLog, Prescricoes, Transferencias';
PRINT '👤 Admin padrão: admin@nutrifybe.com / admin123';
PRINT '🩺 Nutricionista teste: nutri@teste.com / CRN: 12345 / Senha: 123456';
GO