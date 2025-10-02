-- Fix Row Level Security (RLS) policies for rooms table
-- Run this in Supabase SQL Editor

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to insert rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to update rooms" ON rooms;
DROP POLICY IF EXISTS "Allow admins to delete rooms" ON rooms;

-- Policy 1: Everyone can read rooms (for browsing available rooms)
CREATE POLICY "Allow public read access to rooms"
ON rooms
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Only admins/managers/staff can insert rooms
CREATE POLICY "Allow admins to insert rooms"
ON rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Policy 3: Only admins/managers/staff can update rooms
CREATE POLICY "Allow admins to update rooms"
ON rooms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- Policy 4: Only admins/managers can delete rooms
CREATE POLICY "Allow admins to delete rooms"
ON rooms
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
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rooms';
