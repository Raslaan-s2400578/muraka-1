-- Complete setup for rooms table with all necessary columns
-- Run this in Supabase SQL Editor

-- First, let's check what columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rooms'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist

-- Add price_per_night column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(10, 2) DEFAULT 100.00 NOT NULL;

-- Add room_type column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS room_type VARCHAR(100) DEFAULT 'Standard' NOT NULL;

-- Add is_available column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true NOT NULL;

-- Update any NULL values
UPDATE rooms
SET price_per_night = 100.00
WHERE price_per_night IS NULL;

UPDATE rooms
SET room_type = 'Standard'
WHERE room_type IS NULL OR room_type = '';

UPDATE rooms
SET is_available = true
WHERE is_available IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'rooms'
ORDER BY ordinal_position;
