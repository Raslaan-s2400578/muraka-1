-- ========================================
-- COMPREHENSIVE DEBUGGING PLAN (FIXED)
-- Run each section separately and report results
-- ========================================

-- ========================================
-- SECTION 1: Check ALL triggers on auth.users
-- THIS IS THE MOST IMPORTANT ONE
-- ========================================
SELECT '========== SECTION 1: All triggers on auth.users ==========' as info;

SELECT
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- ========================================
-- SECTION 2: Check for ANY function that mentions profiles
-- ========================================
SELECT '========== SECTION 2: Functions related to profiles/users ==========' as info;

SELECT
  proname as function_name,
  prokind as kind
FROM pg_proc
WHERE proname LIKE '%profile%'
  OR proname LIKE '%handle%user%'
ORDER BY proname;

-- ========================================
-- SECTION 3: Check profiles table constraints
-- ========================================
SELECT '========== SECTION 3: Constraints on profiles table ==========' as info;

SELECT
  conname as constraint_name,
  contype as type,
  CASE contype
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- ========================================
-- SECTION 4: Check for ALL triggers in database
-- ========================================
SELECT '========== SECTION 4: ALL triggers in database ==========' as info;

SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
  AND n.nspname IN ('auth', 'public')
ORDER BY n.nspname, c.relname, t.tgname;

-- ========================================
-- SECTION 5: Check profiles table structure
-- ========================================
SELECT '========== SECTION 5: Profiles table columns ==========' as info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- SECTION 6: Check recent users (see if any were created)
-- ========================================
SELECT '========== SECTION 6: Recent auth.users (last 5) ==========' as info;

SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as metadata_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- SECTION 7: Test manual profile insert
-- ========================================
SELECT '========== SECTION 7: Testing manual profile insert ==========' as info;

DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (test_id, 'test@test.com', 'guest');

    RAISE NOTICE 'SUCCESS: Manual insert worked!';

    -- Clean up
    DELETE FROM public.profiles WHERE id = test_id;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: % (Code: %)', SQLERRM, SQLSTATE;
  END;
END $$;

-- ========================================
-- FINAL SUMMARY
-- ========================================
SELECT '========== SUMMARY ==========' as info;

SELECT
  'Total triggers on auth.users: ' || COUNT(*)::text as result
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
