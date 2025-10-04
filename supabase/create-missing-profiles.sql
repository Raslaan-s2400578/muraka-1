-- Create missing profiles for bookings that have guest_ids without profiles
-- This will create placeholder profiles so bookings can display properly

-- First, let's see what guest_ids are missing profiles
SELECT DISTINCT b.guest_id, 'Guest' || SUBSTRING(b.guest_id::text, 1, 8) as suggested_name
FROM bookings b
LEFT JOIN profiles p ON b.guest_id = p.id
WHERE p.id IS NULL;

-- Create profiles for missing guest_ids
-- Using a placeholder name and email based on their ID
INSERT INTO profiles (id, full_name, email, role)
SELECT DISTINCT 
  b.guest_id,
  'Guest ' || SUBSTRING(b.guest_id::text, 1, 8) as full_name,
  'guest.' || SUBSTRING(b.guest_id::text, 1, 8) || '@placeholder.com' as email,
  'guest' as role
FROM bookings b
LEFT JOIN profiles p ON b.guest_id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the profiles were created
SELECT p.id, p.full_name, p.email, p.role
FROM profiles p
WHERE p.id IN (
  SELECT DISTINCT guest_id FROM bookings
)
ORDER BY p.created_at DESC;
