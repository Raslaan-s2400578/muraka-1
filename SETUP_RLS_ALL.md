# Complete RLS Setup Guide

Run all these SQL queries in your Supabase SQL Editor to enable all admin dashboard functionality.

## Step 0: Add Missing Columns (IMPORTANT - Run this first!)

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

-- Add missing columns to bookings table

-- Add num_guests column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 NOT NULL;

-- Update any NULL values in existing rows
UPDATE bookings SET num_guests = 1 WHERE num_guests IS NULL;

-- Add missing columns to profiles table

-- Add email column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create a function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically sync email
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Backfill existing users' emails
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id;
```

## Step 1: Hotels Table

```sql
DROP POLICY IF EXISTS "Allow public read access to hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to insert hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to update hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to delete hotels" ON hotels;

CREATE POLICY "Allow public read access to hotels"
ON hotels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to insert hotels"
ON hotels FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Allow admins to update hotels"
ON hotels FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Allow admins to delete hotels"
ON hotels FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
```

## Step 2: Rooms Table

```sql
DROP POLICY IF EXISTS "Allow public read access to rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to insert rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to update rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to delete rooms" ON rooms;

CREATE POLICY "Allow public read access to rooms"
ON rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to insert rooms"
ON rooms FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Allow admins to update rooms"
ON rooms FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Allow admins to delete rooms"
ON rooms FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
);
```

## Step 3: Bookings Table

```sql
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can create all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON bookings;

CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT TO authenticated
USING (guest_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT TO authenticated
WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Admins can create all bookings"
ON bookings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Admins can update all bookings"
ON bookings FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Admins can delete all bookings"
ON bookings FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
);
```

## Step 4: Booking Rooms Table

```sql
DROP POLICY IF EXISTS "Users can view their booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can view all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Users can create their booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can create all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can update all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can delete all booking rooms" ON booking_rooms;

CREATE POLICY "Users can view their booking rooms"
ON booking_rooms FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_rooms.booking_id AND bookings.guest_id = auth.uid())
);

CREATE POLICY "Admins can view all booking rooms"
ON booking_rooms FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Users can create their booking rooms"
ON booking_rooms FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_rooms.booking_id AND bookings.guest_id = auth.uid())
);

CREATE POLICY "Admins can create all booking rooms"
ON booking_rooms FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Admins can update all booking rooms"
ON booking_rooms FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
);

CREATE POLICY "Admins can delete all booking rooms"
ON booking_rooms FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
);
```

## Step 5: Profiles Table

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Allow admins/managers/staff to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
```

## Verify All Policies

Run this to check all policies are created:

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'hotels', 'rooms', 'bookings', 'booking_rooms')
ORDER BY tablename, policyname;
```

## Complete Workflow

After running all SQL:

1. **Create Hotels** → Go to Hotels page → Add New Hotel
2. **Create Rooms** → Go to Rooms page → Add New Room (select hotel)
3. **Create Bookings** → Go to Bookings page → Add New Booking (select guest, hotel, room, dates)

✅ All done! Your admin dashboard is fully functional!
