-- Aktivite XP defteri (tekrarlanabilir ödüller, dedupe_key ile tekilleştirme)

CREATE TABLE IF NOT EXISTS user_xp_ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason VARCHAR(64) NOT NULL,
    dedupe_key VARCHAR(256) NOT NULL,
    program_id INTEGER REFERENCES ai_exercise_programs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_user_xp_ledger_user_id ON user_xp_ledger(user_id);

COMMENT ON TABLE user_xp_ledger IS 'Rozet dışı aktivite XP kayıtları (günlük/haftalık/aylık tamamlama)';
COMMENT ON COLUMN user_xp_ledger.reason IS 'Örn: daily_workout, week_complete, month_complete';
COMMENT ON COLUMN user_xp_ledger.dedupe_key IS 'Aynı ödülün iki kez yazılmasını engelleyen benzersiz anahtar';
