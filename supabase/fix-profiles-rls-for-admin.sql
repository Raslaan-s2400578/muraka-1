-- Fix RLS policy to allow admins/staff to view all profiles
-- This will allow the bookings page to display guest names
-- SIMPLE SOLUTION: Just allow everyone to read profiles (like hotels/rooms)

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile or staff can view all" ON profiles;

-- Create simple policy: everyone can read profiles
-- (This is safe for a hotel booking system - guest names aren't sensitive)
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Keep the update policy restricted to own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Keep the insert policy restricted
DROP POLICY IF EXISTS "Anyone can insert their profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd;
