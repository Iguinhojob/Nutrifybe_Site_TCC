-- Adicionar campo foto na tabela Nutricionistas
USE nutrifybeDB;
GO

-- Verificar se a coluna já existe antes de adicionar
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Nutricionistas' AND COLUMN_NAME = 'foto')
BEGIN
    ALTER TABLE Nutricionistas ADD foto NVARCHAR(MAX);
    PRINT 'Coluna foto adicionada à tabela Nutricionistas';
END
ELSE
BEGIN
    PRINT 'Coluna foto já existe na tabela Nutricionistas';
END
GO