-- COMPLETE FIX: All RLS Policies and Staff Permissions
-- Run this ENTIRE script in Supabase SQL Editor
-- This combines fix-rls-complete.sql + update-staff-rls-policies.sql
-- Safe to run multiple times (uses DROP IF EXISTS)

-- ============================================================================
-- STEP 1: Create SECURITY DEFINER function to get user role
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: Fix Profiles Policies (prevents infinite recursion)
-- ============================================================================

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

-- ============================================================================
-- STEP 3: Fix Rooms Policies (allow staff to update)
-- ============================================================================

DROP POLICY IF EXISTS "Staff can update room status" ON rooms;

CREATE POLICY "Staff can update room status" ON rooms
FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('staff', 'manager', 'admin'));

-- ============================================================================
-- STEP 4: Fix Bookings Policies (allow staff to create and update)
-- ============================================================================

-- SELECT policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

CREATE POLICY "Users can view own bookings" ON bookings
FOR SELECT TO authenticated
USING (
  guest_id = auth.uid()
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- INSERT policies
DROP POLICY IF EXISTS "Guests can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

CREATE POLICY "Users can create bookings" ON bookings
FOR INSERT TO authenticated
WITH CHECK (
  guest_id = auth.uid()
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- UPDATE policies
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

CREATE POLICY "Users can update own bookings" ON bookings
FOR UPDATE TO authenticated
USING (
  guest_id = auth.uid()
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- ============================================================================
-- STEP 5: Fix Booking Rooms Policies
-- ============================================================================

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

DROP POLICY IF EXISTS "Booking rooms insertable by booking owner" ON booking_rooms;
DROP POLICY IF EXISTS "Booking rooms insertable by authorized users" ON booking_rooms;

CREATE POLICY "Booking rooms insertable by authorized users" ON booking_rooms
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- ============================================================================
-- STEP 6: Fix Booking Services Policies
-- ============================================================================

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

DROP POLICY IF EXISTS "Booking services insertable by booking owner" ON booking_services;
DROP POLICY IF EXISTS "Booking services insertable by authorized users" ON booking_services;

CREATE POLICY "Booking services insertable by authorized users" ON booking_services
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND bookings.guest_id = auth.uid()
  )
  OR get_user_role(auth.uid()) IN ('staff', 'manager', 'admin')
);

-- ============================================================================
-- STEP 7: Verify Everything Was Created
-- ============================================================================

SELECT
  '=== VERIFICATION RESULTS ===' as status,
  '' as detail
UNION ALL
SELECT
  'Functions Created:' as status,
  COUNT(*)::text || ' functions' as detail
FROM information_schema.routines
WHERE routine_name = 'get_user_role'
UNION ALL
SELECT
  'Profiles Policies:' as status,
  COUNT(*)::text || ' policies' as detail
FROM pg_policies
WHERE tablename = 'profiles'
UNION ALL
SELECT
  'Bookings Policies:' as status,
  COUNT(*)::text || ' policies' as detail
FROM pg_policies
WHERE tablename = 'bookings'
UNION ALL
SELECT
  'Booking Rooms Policies:' as status,
  COUNT(*)::text || ' policies' as detail
FROM pg_policies
WHERE tablename = 'booking_rooms'
UNION ALL
SELECT
  'Booking Services Policies:' as status,
  COUNT(*)::text || ' policies' as detail
FROM pg_policies
WHERE tablename = 'booking_services'
UNION ALL
SELECT
  'Rooms Policies:' as status,
  COUNT(*)::text || ' policies' as detail
FROM pg_policies
WHERE tablename = 'rooms';

-- ============================================================================
-- STEP 8: Show All Policies (for manual verification)
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('profiles', 'rooms', 'bookings', 'booking_rooms', 'booking_services')
ORDER BY tablename, policyname;

-- ============================================================================
-- DONE!
-- ============================================================================
-- All RLS policies are now fixed and staff have full permissions.
-- Staff can now:
-- - Login to dashboard
-- - View all bookings
-- - Create bookings for guests
-- - Confirm, check-in, check-out bookings
-- - Update room statuses
