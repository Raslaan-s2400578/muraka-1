-- Fix Row Level Security (RLS) policies for bookings and booking_rooms tables
-- Run this in Supabase SQL Editor

-- ===== BOOKINGS TABLE =====

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can create all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON bookings;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings
FOR SELECT
TO authenticated
USING (guest_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (guest_id = auth.uid());

-- Admins can create bookings for anyone
CREATE POLICY "Admins can create all bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can delete all bookings
CREATE POLICY "Admins can delete all bookings"
ON bookings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- ===== BOOKING_ROOMS TABLE =====

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can view all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Users can create their booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can create all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can update all booking rooms" ON booking_rooms;
DROP POLICY IF EXISTS "Admins can delete all booking rooms" ON booking_rooms;

-- Users can view their own booking rooms
CREATE POLICY "Users can view their booking rooms"
ON booking_rooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_rooms.booking_id
    AND bookings.guest_id = auth.uid()
  )
);

-- Admins can view all booking rooms
CREATE POLICY "Admins can view all booking rooms"
ON booking_rooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Users can create their own booking rooms
CREATE POLICY "Users can create their booking rooms"
ON booking_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_rooms.booking_id
    AND bookings.guest_id = auth.uid()
  )
);

-- Admins can create all booking rooms
CREATE POLICY "Admins can create all booking rooms"
ON booking_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can update all booking rooms
CREATE POLICY "Admins can update all booking rooms"
ON booking_rooms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Admins can delete all booking rooms
CREATE POLICY "Admins can delete all booking rooms"
ON booking_rooms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('bookings', 'booking_rooms')
ORDER BY tablename, policyname;
