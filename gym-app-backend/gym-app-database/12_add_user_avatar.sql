-- Profil fotoğrafı (data URL: data:image/jpeg;base64,...)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data_url TEXT;

COMMENT ON COLUMN users.avatar_data_url IS 'Optional profile image as data URL (data:image/*;base64,...)';
