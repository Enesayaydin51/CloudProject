-- Create ai_exercise_programs table
-- Bu tablo AI tarafından oluşturulan egzersiz programlarını JSON formatında saklar
-- Beslenme planları gibi basit bir yapı

CREATE TABLE IF NOT EXISTS ai_exercise_programs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_data JSONB NOT NULL, -- AI programı JSON verisi (weeklySchedule, weeklySummary, vb.)
    program_name VARCHAR(255), -- Program adı (opsiyonel)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_ai_exercise_programs_user_id ON ai_exercise_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_exercise_programs_created_at ON ai_exercise_programs(created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_exercise_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_exercise_programs_updated_at
    BEFORE UPDATE ON ai_exercise_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_exercise_programs_updated_at();

-- Comments
COMMENT ON TABLE ai_exercise_programs IS 'AI tarafından oluşturulan egzersiz programları tablosu';
COMMENT ON COLUMN ai_exercise_programs.id IS 'Primary key';
COMMENT ON COLUMN ai_exercise_programs.user_id IS 'Program sahibi kullanıcı ID';
COMMENT ON COLUMN ai_exercise_programs.program_data IS 'AI programı JSON verisi (weeklySchedule, weeklySummary)';
COMMENT ON COLUMN ai_exercise_programs.program_name IS 'Program adı (opsiyonel)';
COMMENT ON COLUMN ai_exercise_programs.created_at IS 'Program oluşturulma tarihi';
COMMENT ON COLUMN ai_exercise_programs.updated_at IS 'Program güncellenme tarihi';

