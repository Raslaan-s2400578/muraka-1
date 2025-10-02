# Fix: Add Missing Columns to Rooms Table

You're getting errors because the `rooms` table is missing several columns needed for the admin dashboard.

## Quick Fix - Run this SQL in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste:

```sql
-- Add all missing columns to rooms table

-- Add price_per_night column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(10, 2) DEFAULT 100.00 NOT NULL;

-- Add room_type column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS room_type VARCHAR(100) DEFAULT 'Standard' NOT NULL;

-- Add is_available column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true NOT NULL;

-- Update any NULL values in existing rows
UPDATE rooms SET price_per_night = 100.00 WHERE price_per_night IS NULL;
UPDATE rooms SET room_type = 'Standard' WHERE room_type IS NULL OR room_type = '';
UPDATE rooms SET is_available = true WHERE is_available IS NULL;
```

5. Click **Run** or press `Ctrl+Enter`

## What This Does:

- ✅ Adds `price_per_night` column (DECIMAL) - Default: $100.00
- ✅ Adds `room_type` column (VARCHAR) - Default: 'Standard'
- ✅ Adds `is_available` column (BOOLEAN) - Default: true
- ✅ Updates all existing rooms with default values

## After Running:

1. Refresh your admin dashboard
2. Go to Hotels → Click "View Rooms" on any hotel
3. The room availability status will now work correctly
4. You can toggle room availability when creating/editing rooms

## How It Works:

- **is_available = true** → Room shows "Available" (green badge)
- **is_available = false** → Room shows "Occupied" (red badge)
- Only available rooms appear in the booking form dropdown

All fixed! 🎉
