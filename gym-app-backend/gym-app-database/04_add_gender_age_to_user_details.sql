-- Add gender and age columns to user_details table
ALTER TABLE user_details 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add comments
COMMENT ON COLUMN user_details.gender IS 'User gender: Erkek, Kadın, Diğer';
COMMENT ON COLUMN user_details.age IS 'User age in years';

