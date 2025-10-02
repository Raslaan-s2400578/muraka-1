-- Fix Row Level Security (RLS) policies for hotels table
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled (it should be)
-- If not enabled, enable it:
-- ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to insert hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to update hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to delete hotels" ON hotels;

-- Policy 1: Everyone can read hotels (for public browsing)
CREATE POLICY "Allow public read access to hotels"
ON hotels
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Only admins can insert hotels
CREATE POLICY "Allow admins to insert hotels"
ON hotels
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 3: Only admins can update hotels
CREATE POLICY "Allow admins to update hotels"
ON hotels
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Only admins can delete hotels
CREATE POLICY "Allow admins to delete hotels"
ON hotels
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'hotels';
