-- Add NID (National ID) field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS nid TEXT;

-- Create unique constraint for NID (allows NULL values)
-- Drop constraint if exists to avoid errors on re-run
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_nid_unique;

ALTER TABLE profiles
ADD CONSTRAINT profiles_nid_unique UNIQUE (nid);

-- Create index for faster NID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nid ON profiles(nid);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
