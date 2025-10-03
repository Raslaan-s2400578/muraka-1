-- Fix all circular references in RLS policies across all tables
-- Run this in Supabase SQL Editor after running fix-profiles-rls-infinite-recursion.sql

-- The get_user_role function should already exist from the previous fix
-- If not, uncomment and run:
-- CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
-- RETURNS TEXT AS $$
--   SELECT role FROM public.profiles WHERE id = user_id;
-- $$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Fix Rooms policies
DROP POLICY IF EXISTS "Staff can update room status" ON rooms;

CREATE POLICY "Staff can update room status" ON rooms
FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('staff', 'manager', 'admin'));

-- Fix Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

CREATE POLICY "Users can view own bookings" ON bookings
FOR SELECT TO authenticated
USING (
  guest_id = auth.uid()
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

CREATE POLICY "Users can update own bookings" ON bookings
FOR UPDATE TO authenticated
USING (
  guest_id = auth.uid()
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- Fix Booking rooms policies
DROP POLICY IF EXISTS "Booking rooms viewable by booking owner or staff" ON booking_rooms;

CREATE POLICY "Booking rooms viewable by booking owner or staff" ON booking_rooms
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- Fix Booking services policies
DROP POLICY IF EXISTS "Booking services viewable by booking owner or staff" ON booking_services;

CREATE POLICY "Booking services viewable by booking owner or staff" ON booking_services
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- Verify all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'rooms', 'bookings', 'booking_rooms', 'booking_services')
ORDER BY tablename, policyname;
