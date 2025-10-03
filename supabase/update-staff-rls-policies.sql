-- Update RLS policies to give staff full booking management permissions
-- Run this in Supabase SQL Editor

-- The get_user_role function should already exist from fix-rls-complete.sql
-- If not, run that script first!

-- Update bookings policies to allow staff to create bookings
DROP POLICY IF EXISTS "Guests can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

CREATE POLICY "Users can create bookings" ON bookings
FOR INSERT TO authenticated
WITH CHECK (
  -- Guest creating their own booking
  guest_id = auth.uid()
  OR
  -- Staff/Manager/Admin creating booking for any guest
  get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- Ensure booking_rooms policies allow staff to insert
DROP POLICY IF EXISTS "Booking rooms insertable by booking owner" ON booking_rooms;
DROP POLICY IF EXISTS "Booking rooms insertable by authorized users" ON booking_rooms;

CREATE POLICY "Booking rooms insertable by authorized users" ON booking_rooms
FOR INSERT TO authenticated
WITH CHECK (
  -- Booking owner can insert
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR
  -- Staff can insert
  get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- Ensure booking_services policies allow staff to insert
DROP POLICY IF EXISTS "Booking services insertable by booking owner" ON booking_services;
DROP POLICY IF EXISTS "Booking services insertable by authorized users" ON booking_services;

CREATE POLICY "Booking services insertable by authorized users" ON booking_services
FOR INSERT TO authenticated
WITH CHECK (
  -- Booking owner can insert
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR
  -- Staff can insert
  get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- Verify all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('bookings', 'booking_rooms', 'booking_services')
ORDER BY tablename, policyname;
