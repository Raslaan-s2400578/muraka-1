-- RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor

-- First, ensure RLS is enabled
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

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
