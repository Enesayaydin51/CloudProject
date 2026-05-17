-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    gram_weight DECIMAL(10, 2) NOT NULL,
    calories_per_gram DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

-- Create index on calories_per_gram for filtering
CREATE INDEX IF NOT EXISTS idx_foods_calories ON foods(calories_per_gram);

-- Add comments
COMMENT ON TABLE foods IS 'Foods table for nutrition tracking';
COMMENT ON COLUMN foods.id IS 'Primary key';
COMMENT ON COLUMN foods.name IS 'Food name';
COMMENT ON COLUMN foods.gram_weight IS 'Weight in grams';
COMMENT ON COLUMN foods.calories_per_gram IS 'Calories per gram';
COMMENT ON COLUMN foods.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN foods.updated_at IS 'Record last update timestamp';

-- Create trigger function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_foods_updated_at 
    BEFORE UPDATE ON foods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_foods_updated_at();

-- Insert sample foods data
INSERT INTO foods (name, gram_weight, calories_per_gram) VALUES
('Tavuk Göğsü', 100.00, 1.65),
('Pirinç', 100.00, 1.30),
('Brokoli', 100.00, 0.34),
('Yumurta', 50.00, 1.55),
('Yulaf', 100.00, 3.89),
('Somon', 100.00, 2.08),
('Tatlı Patates', 100.00, 0.86),
('Beyaz Peynir', 100.00, 2.64),
('Badem', 100.00, 5.79),
('Muz', 100.00, 0.89),
('Elma', 100.00, 0.52),
('Yoğurt', 100.00, 0.59),
('Tavuk Bütün', 100.00, 2.39),
('Kinoa', 100.00, 3.68),
('Ispanak', 100.00, 0.23),
('Ton Balığı', 100.00, 1.32),
('Avokado', 100.00, 1.60),
('Yer Fıstığı', 100.00, 5.67),
('Süt', 100.00, 0.42),
('Makarna', 100.00, 1.31)
ON CONFLICT DO NOTHING;

