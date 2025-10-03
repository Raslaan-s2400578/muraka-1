-- Complete fix for RLS infinite recursion across all tables
-- Run this entire file in Supabase SQL Editor

-- Step 1: Create SECURITY DEFINER function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 2: Fix Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Step 3: Fix Rooms policies
DROP POLICY IF EXISTS "Staff can update room status" ON rooms;

CREATE POLICY "Staff can update room status" ON rooms
FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('staff', 'manager', 'admin'));

-- Step 4: Fix Bookings policies
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

-- Step 5: Fix Booking rooms policies
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

-- Step 6: Fix Booking services policies
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

-- Step 7: Verify all policies were created successfully
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'rooms', 'bookings', 'booking_rooms', 'booking_services')
ORDER BY tablename, policyname;
