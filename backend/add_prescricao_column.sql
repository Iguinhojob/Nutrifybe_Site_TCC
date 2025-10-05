-- Adicionar campo prescricaoSemanal na tabela Pacientes
USE nutrifybeDB;
GO

-- Verificar se a coluna já existe antes de adicionar
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Pacientes' AND COLUMN_NAME = 'prescricaoSemanal')
BEGIN
    ALTER TABLE Pacientes ADD prescricaoSemanal NVARCHAR(MAX);
    PRINT 'Coluna prescricaoSemanal adicionada à tabela Pacientes';
END
ELSE
BEGIN
    PRINT 'Coluna prescricaoSemanal já existe na tabela Pacientes';
END
GO