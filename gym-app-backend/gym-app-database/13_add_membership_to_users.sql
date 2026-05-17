-- Üyelik: normal (free) ve Pro (AI video analiz vb.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(20) NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN users.membership_tier IS 'free | pro';
COMMENT ON COLUMN users.pro_expires_at IS 'Pro bitiş zamanı; NULL = ücretsiz veya süresi dolmuş';
