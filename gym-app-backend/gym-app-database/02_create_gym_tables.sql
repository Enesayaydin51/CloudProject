-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    muscle_group VARCHAR(100) NOT NULL,
    sub_target VARCHAR(100),
    equipment_type VARCHAR(100),
    level VARCHAR(50) DEFAULT 'Intermediate',
    sets INTEGER,
    reps VARCHAR(50),
    duration INTEGER,
    rest_time INTEGER,
    notes TEXT,
    disease_restriction VARCHAR(100)
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps VARCHAR(255),
    duration INTEGER, --in seconds
    rest_time INTEGER, --in seconds
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);


-- Add comments
COMMENT ON TABLE workouts IS 'User workout sessions';
COMMENT ON TABLE workout_exercises IS 'Individual exercises within workouts';
