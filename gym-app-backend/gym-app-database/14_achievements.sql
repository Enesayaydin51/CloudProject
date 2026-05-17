-- Rozet / başarı tanımları ve kullanıcı kilidi

CREATE TABLE IF NOT EXISTS achievement_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_key VARCHAR(64),
    xp INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(32),
    tier VARCHAR(16),
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_code ON achievement_definitions(code);

COMMENT ON TABLE achievement_definitions IS 'Sabit rozet kataloğu (seed)';
COMMENT ON TABLE user_achievements IS 'Kullanıcının açtığı rozetler';

INSERT INTO achievement_definitions (code, title, description, icon_key, xp, category, tier, sort_order) VALUES
('first_ai_exercise_plan', 'İlk AI programı', 'Yapay zeka ile ilk egzersiz programını oluşturdun.', 'dumbbell', 50, 'exercise', 'bronze', 10),
('first_nutrition_plan', 'Menü planlayıcı', 'İlk haftalık beslenme planını kaydettin.', 'food-apple', 50, 'nutrition', 'bronze', 20),
('profile_complete', 'Profil tamam', 'Boy, kilo ve hedef bilgilerini doldurdun.', 'account-check', 40, 'profile', 'bronze', 30),
('pro_member', 'Pro üye', 'Pro üyeliğini etkinleştirdin.', 'crown', 80, 'membership', 'gold', 40),
('ai_exercise_days_7', 'Haftalık disiplin', 'AI programında 7 antrenman gününü tamamladın.', 'calendar-week', 70, 'exercise', 'silver', 50),
('ai_exercise_days_30', 'Aylık kararlılık', 'AI programında 30 antrenman gününü tamamladın.', 'calendar-month', 150, 'exercise', 'gold', 60),
('ai_exercise_month_done', 'Dört haftalık hedef', 'Bir aylık AI egzersiz programını tamamladın.', 'flag-checkered', 120, 'exercise', 'gold', 70)
ON CONFLICT (code) DO NOTHING;
