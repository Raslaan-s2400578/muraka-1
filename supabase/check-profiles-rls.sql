-- Check if RLS policies are blocking profile reads
-- This will help diagnose why profiles aren't showing

-- 1. Check all profiles exist
SELECT COUNT(*) as total_profiles, COUNT(DISTINCT role) as distinct_roles
FROM profiles;

-- 2. List all profiles
SELECT id, full_name, email, role, created_at
FROM profiles
ORDER BY created_at DESC;

-- 3. Check RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Verify bookings can see their guest profiles
SELECT 
  b.id as booking_id,
  b.guest_id,
  p.full_name,
  p.email,
  p.role
FROM bookings b
LEFT JOIN profiles p ON b.guest_id = p.id
ORDER BY b.created_at DESC
LIMIT 10;
