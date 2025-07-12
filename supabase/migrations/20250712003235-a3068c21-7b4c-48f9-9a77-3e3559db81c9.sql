-- Adicionar datas de nascimento de teste para demonstrar o sistema
-- Algumas com aniversário hoje, outras em datas variadas

-- Pegar alguns leads aleatórios e definir datas de nascimento
UPDATE leads 
SET data_nascimento = CURRENT_DATE 
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 3
);

-- Adicionar mais algumas datas variadas para outros leads
UPDATE leads 
SET data_nascimento = CURRENT_DATE - INTERVAL '1 day'
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 2
);

UPDATE leads 
SET data_nascimento = CURRENT_DATE + INTERVAL '2 days'
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 2
);

UPDATE leads 
SET data_nascimento = CURRENT_DATE - INTERVAL '15 days'
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 3
);

UPDATE leads 
SET data_nascimento = CURRENT_DATE + INTERVAL '30 days'
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 2
);

-- Adicionar algumas datas de anos anteriores mas com aniversário hoje
UPDATE leads 
SET data_nascimento = CURRENT_DATE - INTERVAL '25 years'
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 2
);

UPDATE leads 
SET data_nascimento = CURRENT_DATE - INTERVAL '35 years'
WHERE id IN (
  SELECT id FROM leads 
  WHERE data_nascimento IS NULL 
  LIMIT 1
);