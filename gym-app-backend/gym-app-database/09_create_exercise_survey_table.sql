-- Exercise Survey Table
-- Bu tablo kullanıcıların egzersiz anketi sonuçlarını saklar

CREATE TABLE IF NOT EXISTS exercise_survey (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    equipment TEXT[], -- Hangi ekipmana sahipsin (array)
    days_per_week INTEGER, -- Haftada kaç gün egzersiz yapıyorsun
    is_working BOOLEAN, -- Çalışıyor musunuz
    work_hours_per_day INTEGER, -- Kaç saat çalışıyorsunuz
    work_intensity VARCHAR(50), -- Çalıştığın iş ne kadar yorucu (Az, Orta, Çok)
    sport_experience_years INTEGER, -- Ne kadar süredir spor geçmişin var
    priority_muscle_groups TEXT[], -- Hangi kas grubuna öncelik vermek istiyorsun
    sport_type VARCHAR(100), -- Herhangi bir spor dalı ile mi kas kazanmak istiyorsun (powerlifting, vücut geliştirme, calisthenics, vb.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id) -- Her kullanıcı için sadece bir anket kaydı
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_exercise_survey_user_id ON exercise_survey(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_exercise_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercise_survey_updated_at
    BEFORE UPDATE ON exercise_survey
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_survey_updated_at();

-- Comments
COMMENT ON TABLE exercise_survey IS 'Kullanıcı egzersiz anketi sonuçları';
COMMENT ON COLUMN exercise_survey.equipment IS 'Kullanıcının sahip olduğu ekipmanlar';
COMMENT ON COLUMN exercise_survey.days_per_week IS 'Haftada kaç gün egzersiz yapıyor';
COMMENT ON COLUMN exercise_survey.is_working IS 'Çalışıyor mu';
COMMENT ON COLUMN exercise_survey.work_hours_per_day IS 'Günde kaç saat çalışıyor';
COMMENT ON COLUMN exercise_survey.work_intensity IS 'İş yoruculuğu seviyesi';
COMMENT ON COLUMN exercise_survey.sport_experience_years IS 'Spor geçmişi (yıl)';
COMMENT ON COLUMN exercise_survey.priority_muscle_groups IS 'Öncelik verilen kas grupları';
COMMENT ON COLUMN exercise_survey.sport_type IS 'Hedeflenen spor dalı';

