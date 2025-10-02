-- Add num_guests column to bookings table
-- Run this in Supabase SQL Editor

-- Add the num_guests column with a default value of 1
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 NOT NULL;

-- Update existing bookings to have 1 guest by default
UPDATE bookings
SET num_guests = 1
WHERE num_guests IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'num_guests';
