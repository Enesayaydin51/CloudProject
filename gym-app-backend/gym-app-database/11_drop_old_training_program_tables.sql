-- Drop old training program tables
-- Bu tablolar artık kullanılmıyor, tüm programlar ai_exercise_programs tablosunda JSON formatında saklanıyor

-- Önce foreign key constraint'leri kaldır
ALTER TABLE IF EXISTS training_program_exercises DROP CONSTRAINT IF EXISTS training_program_exercises_program_day_id_fkey;
ALTER TABLE IF EXISTS training_program_days DROP CONSTRAINT IF EXISTS training_program_days_program_id_fkey;

-- Tabloları sil
DROP TABLE IF EXISTS training_program_exercises;
DROP TABLE IF EXISTS training_program_days;
DROP TABLE IF EXISTS training_programs;

-- Comments
COMMENT ON TABLE ai_exercise_programs IS 'Tüm egzersiz programları (AI ve normal) JSON formatında bu tabloda saklanır';

