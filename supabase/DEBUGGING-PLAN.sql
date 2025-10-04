-- ========================================
-- COMPREHENSIVE DEBUGGING PLAN
-- Run each section and report results
-- ========================================

-- ========================================
-- SECTION 1: Check ALL triggers on auth.users
-- ========================================
SELECT
  'SECTION 1: All triggers on auth.users' as section;

SELECT
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- ========================================
-- SECTION 2: Check for ANY function that mentions profiles
-- ========================================
SELECT
  'SECTION 2: Functions that might affect profiles' as section;

SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname LIKE '%profile%'
  OR proname LIKE '%user%'
  OR prosrc LIKE '%profiles%';

-- ========================================
-- SECTION 3: Check auth.users table constraints
-- ========================================
SELECT
  'SECTION 3: Constraints on auth.users' as section;

SELECT
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- ========================================
-- SECTION 4: Check profiles table constraints
-- ========================================
SELECT
  'SECTION 4: Constraints on profiles table' as section;

SELECT
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- ========================================
-- SECTION 5: Test if we can insert into auth.users directly
-- (This will show if the issue is at auth level)
-- ========================================
SELECT
  'SECTION 5: Testing auth.users permissions' as section;

-- Note: We can't actually insert, but we can check permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'auth'
  AND table_name = 'users';

-- ========================================
-- SECTION 6: Check for hooks or extensions
-- ========================================
SELECT
  'SECTION 6: Installed extensions' as section;

SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension;

-- ========================================
-- SECTION 7: Check Supabase-specific auth config
-- ========================================
SELECT
  'SECTION 7: Auth configuration' as section;

-- Try to see auth config (might not have access)
SELECT * FROM auth.config LIMIT 10;

-- ========================================
-- SECTION 8: Recent failed auth attempts
-- ========================================
SELECT
  'SECTION 8: Recent auth events' as section;

SELECT
  created_at,
  action,
  actor_id,
  actor_username,
  actor_via_sso
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- FINAL SUMMARY
-- ========================================
SELECT
  'DEBUGGING SUMMARY' as section,
  'Check each section above for issues' as instructions;
