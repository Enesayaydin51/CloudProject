CREATE TABLE IF NOT EXISTS training_programs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL,       -- beginner | intermediate | pro
    days_per_week INTEGER NOT NULL,        -- 3,4,5,6
    split_type VARCHAR(20) NOT NULL,       -- full_body | upper_lower | ppl
    goal VARCHAR(50),                      -- Kilo Alma / Kilo Verme
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_program_days (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL,            -- 1-7
    day_label VARCHAR(100) NOT NULL        -- "Upper A", "Full Body B" vb.
);

CREATE TABLE IF NOT EXISTS training_program_exercises (
    id SERIAL PRIMARY KEY,
    program_day_id INTEGER NOT NULL REFERENCES training_program_days(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,          -- o gün içindeki sıralaması
    sets INTEGER,
    reps VARCHAR(50),
    rest_time INTEGER,
    notes TEXT
);
