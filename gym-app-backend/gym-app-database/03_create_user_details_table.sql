-- User Details Table
-- Bu tablo kullanıcıların kişisel bilgilerini (boy, kilo, rahatsızlıklar) saklar

CREATE TABLE IF NOT EXISTS user_details (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height INTEGER, -- Boy (cm)
    weight DECIMAL(5,2), -- Kilo (kg)
    injuries TEXT[], -- Rahatsızlıklar array olarak
    goal VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id) -- Her kullanıcı için sadece bir kayıt
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_details_user_id ON user_details(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_details_updated_at
    BEFORE UPDATE ON user_details
    FOR EACH ROW
    EXECUTE FUNCTION update_user_details_updated_at();

-- Örnek veri (opsiyonel)
-- INSERT INTO user_details (user_id, height, weight, injuries) 
-- VALUES (1, 175, 70.5, ARRAY['Diz Ağrısı', 'Bel Ağrısı']);
