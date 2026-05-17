-- Create nutrition_plans table
-- Bu tablo kullanıcıların haftalık beslenme planlarını JSON formatında saklar

CREATE TABLE IF NOT EXISTS nutrition_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL, -- Haftalık plan JSON verisi
    plan_name VARCHAR(255), -- Plan adı (opsiyonel)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_id ON nutrition_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_created_at ON nutrition_plans(created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_nutrition_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nutrition_plans_updated_at
    BEFORE UPDATE ON nutrition_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_nutrition_plans_updated_at();

-- Comments
COMMENT ON TABLE nutrition_plans IS 'Haftalık beslenme planları tablosu';
COMMENT ON COLUMN nutrition_plans.id IS 'Primary key';
COMMENT ON COLUMN nutrition_plans.user_id IS 'Plan sahibi kullanıcı ID';
COMMENT ON COLUMN nutrition_plans.plan_data IS 'Haftalık plan JSON verisi';
COMMENT ON COLUMN nutrition_plans.plan_name IS 'Plan adı (opsiyonel)';
COMMENT ON COLUMN nutrition_plans.created_at IS 'Plan oluşturulma tarihi';
COMMENT ON COLUMN nutrition_plans.updated_at IS 'Plan güncellenme tarihi';

