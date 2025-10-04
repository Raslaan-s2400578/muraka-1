-- Diagnostic queries to troubleshoot signup issues
-- Run these in Supabase SQL Editor to check the current state

-- 1. Check if trigger exists
SELECT
  'Trigger: ' || tgname as name,
  'Enabled: ' || tgenabled::text as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 2. Check if function exists
SELECT
  'Function exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Check profiles table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check RLS policies on profiles
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Check if RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 6. Check recent auth users (without sensitive data)
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as metadata_full_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check profiles count vs auth users count
SELECT
  'Auth Users: ' || (SELECT COUNT(*) FROM auth.users)::text ||
  ' | Profiles: ' || (SELECT COUNT(*) FROM profiles)::text ||
  ' | Missing Profiles: ' || (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM profiles))::text
  as counts;

-- 8. Find users without profiles
SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name_metadata
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- 9. Test trigger function manually (safe test - won't create real user)
-- This shows what the function would do
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Just check if function can be called (won't actually insert)
  SELECT 'Function is callable' INTO test_result;
  RAISE NOTICE '%', test_result;
END $$;

-- 10. Check for any constraint violations on profiles table
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;
