-- Criar banco de dados
CREATE DATABASE NutrifybeDB;
GO

USE NutrifybeDB;
GO

-- Tabela Nutricionistas
CREATE TABLE Nutricionistas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    crn NVARCHAR(20) UNIQUE NOT NULL,
    senha NVARCHAR(100) NOT NULL,
    telefone NVARCHAR(20),
    especialidade NVARCHAR(100),
    status NVARCHAR(20) DEFAULT 'pending',
    ativo BIT DEFAULT 1,
    dataCriacao DATETIME DEFAULT GETDATE()
);

-- Tabela Pacientes
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
    status NVARCHAR(20) DEFAULT 'accepted',
    ativo BIT DEFAULT 1,
    prescricaoSemanal NVARCHAR(MAX),
    dataCriacao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (nutricionistaId) REFERENCES Nutricionistas(id)
);

-- Tabela Admin
CREATE TABLE Admin (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    senha NVARCHAR(100) NOT NULL,
    dataCriacao DATETIME DEFAULT GETDATE()
);

-- Tabela Solicitações Pendentes
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
    dataSolicitacao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (nutricionistaId) REFERENCES Nutricionistas(id)
);

-- Tabela Log de Atividades
CREATE TABLE ActivityLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    action NVARCHAR(100) NOT NULL,
    nutriName NVARCHAR(100),
    timestamp DATETIME DEFAULT GETDATE()
);

-- Inserir dados iniciais
INSERT INTO Admin (nome, email, senha) VALUES 
('Administrador', 'admin@nutrifybe.com', 'admin123');

INSERT INTO Nutricionistas (nome, email, crn, senha, telefone, especialidade, status, ativo) VALUES 
('Dr. João Silva', 'nutri@teste.com', '12345', '123456', '(11) 99999-9999', 'Nutrição Clínica', 'approved', 1);

GO