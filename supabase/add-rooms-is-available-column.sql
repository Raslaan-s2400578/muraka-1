-- Add is_available column to rooms table
-- Run this in Supabase SQL Editor

-- Add the is_available column with a default value of true
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true NOT NULL;

-- Update existing rooms to be available by default
UPDATE rooms
SET is_available = true
WHERE is_available IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'rooms' AND column_name = 'is_available';
