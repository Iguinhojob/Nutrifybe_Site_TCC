-- =============================================
-- CORRIGIR BANCO NUTRIFYBE EXISTENTE
-- =============================================

USE nutrifybeDB;
GO

-- Adicionar colunas que faltam na tabela Nutricionistas
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Nutricionistas') AND name = 'telefone')
    ALTER TABLE Nutricionistas ADD telefone NVARCHAR(20);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Nutricionistas') AND name = 'especialidade')
    ALTER TABLE Nutricionistas ADD especialidade NVARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Nutricionistas') AND name = 'ativo')
    ALTER TABLE Nutricionistas ADD ativo BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Nutricionistas') AND name = 'dataCriacao')
    ALTER TABLE Nutricionistas ADD dataCriacao DATETIME DEFAULT GETDATE();

-- Adicionar colunas que faltam na tabela Pacientes
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pacientes') AND name = 'ativo')
    ALTER TABLE Pacientes ADD ativo BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pacientes') AND name = 'prescricaoSemanal')
    ALTER TABLE Pacientes ADD prescricaoSemanal NVARCHAR(MAX);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pacientes') AND name = 'dataCriacao')
    ALTER TABLE Pacientes ADD dataCriacao DATETIME DEFAULT GETDATE();

-- Adicionar colunas que faltam na tabela ActivityLog
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ActivityLog') AND name = 'action')
    ALTER TABLE ActivityLog ADD action NVARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ActivityLog') AND name = 'nutriName')
    ALTER TABLE ActivityLog ADD nutriName NVARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ActivityLog') AND name = 'descricao')
    ALTER TABLE ActivityLog ADD descricao NVARCHAR(255);

-- Adicionar coluna ativo na tabela SolicitacoesPendentes
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SolicitacoesPendentes') AND name = 'ativo')
    ALTER TABLE SolicitacoesPendentes ADD ativo BIT DEFAULT 1;

-- Inserir dados iniciais se não existirem
IF NOT EXISTS (SELECT * FROM Admin WHERE email = 'admin@nutrifybe.com')
BEGIN
    INSERT INTO Admin (nome, email, senha) VALUES 
    ('Administrador Sistema', 'admin@nutrifybe.com', 'admin123');
END

IF NOT EXISTS (SELECT * FROM Nutricionistas WHERE email = 'nutri@teste.com')
BEGIN
    INSERT INTO Nutricionistas (nome, email, crn, senha, telefone, especialidade, status, ativo) VALUES 
    ('Dr. João Silva', 'nutri@teste.com', '12345', '123456', '(11) 99999-9999', 'Nutrição Clínica', 'approved', 1);
END

PRINT '✅ Banco corrigido com sucesso!';
GO