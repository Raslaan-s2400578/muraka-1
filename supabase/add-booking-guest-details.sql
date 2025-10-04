-- Add phone and special_requests fields to bookings table
-- These fields store additional information guests provide during booking confirmation

-- Add phone column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add special_requests column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('phone', 'special_requests');
