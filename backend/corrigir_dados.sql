-- Corrigir dados inconsistentes no banco
USE nutrifybeDB;
GO

-- Corrigir valores NULL na coluna ativo
UPDATE Nutricionistas 
SET ativo = 1 
WHERE ativo IS NULL;

-- Padronizar status para lowercase
UPDATE Nutricionistas 
SET status = 'approved' 
WHERE status = 'Aprovado';

-- Verificar resultado
SELECT nome, email, status, ativo FROM Nutricionistas;

PRINT '✅ Dados corrigidos!';