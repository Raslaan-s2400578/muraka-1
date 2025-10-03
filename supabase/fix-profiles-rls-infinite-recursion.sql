-- Fix infinite recursion in profiles RLS policies
-- Run this in Supabase SQL Editor

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON profiles;

-- Create a SECURITY DEFINER function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Allow admins/managers/staff to view all profiles (using SECURITY DEFINER function)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

-- Allow admins to update all profiles (using SECURITY DEFINER function)
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
