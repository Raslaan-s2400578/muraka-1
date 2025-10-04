-- Quick check of current database state
-- Run this to see what's actually in your database

-- 1. Does the trigger exist?
SELECT
  'Trigger Status' as check_type,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as result
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 2. Does the function exist?
SELECT
  'Function Status' as check_type,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as result
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. What columns exist in profiles table?
SELECT
  'Column: ' || column_name as check_type,
  data_type || ' | Nullable: ' || is_nullable || ' | Default: ' || COALESCE(column_default, 'NONE') as result
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. How many RLS policies exist?
SELECT
  'RLS Policies Count' as check_type,
  COUNT(*)::text as result
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Is RLS enabled?
SELECT
  'RLS Enabled' as check_type,
  CASE
    WHEN rowsecurity THEN '✓ YES'
    ELSE '✗ NO'
  END as result
FROM pg_tables
WHERE tablename = 'profiles';
