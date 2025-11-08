-- Script pentru a adăuga 1000 tokeni la toate conturile de profesori existente
-- Rulează acest script în Supabase SQL Editor

-- Pasul 1: Adaugă tranzacții de 1000 tokeni pentru toți profesorii care nu au primit deja bonus-ul inițial mare
INSERT INTO token_transactions (user_id, amount, type, description)
SELECT
  id as user_id,
  1000 as amount,
  'initial' as type,
  'Retroactive welcome bonus for teachers' as description
FROM profiles
WHERE role = 'teacher'
  AND id NOT IN (
    -- Exclude profesorii care au deja o tranzacție de 1000 tokeni
    SELECT user_id
    FROM token_transactions
    WHERE amount = 1000 AND type = 'initial'
  );

-- Alternativ, dacă vrei să adaugi 1000 tokeni la TOȚI profesorii (chiar dacă au primit deja):
-- Decomentează liniile de mai jos și comentează blocul de mai sus

-- INSERT INTO token_transactions (user_id, amount, type, description)
-- SELECT
--   id as user_id,
--   1000 as amount,
--   'initial' as type,
--   'Additional token bonus for teachers' as description
-- FROM profiles
-- WHERE role = 'teacher';

-- Notă: Soldurile de tokeni se actualizează automat prin database triggers
-- Nu trebuie să actualizezi manual coloana token_balance
