-- Check Auth Configuration and Constraints
-- This will show us what's blocking user creation

-- 1. Check if there are any constraints on auth.users that might fail
SELECT
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- 2. Check auth schema permissions
SELECT
  schemaname,
  schemaowner
FROM pg_namespace
JOIN pg_roles ON pg_namespace.nspowner = pg_roles.oid
WHERE nspname = 'auth';

-- 3. Try to see recent auth errors (if logged)
-- Note: You might not have access to this
SELECT
  created_at,
  level,
  msg
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if email is already in auth.users (even if deleted)
SELECT
  id,
  email,
  deleted_at,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'test456@gmail.com';

-- 5. Check auth configuration settings
SELECT
  name,
  value
FROM auth.config
LIMIT 20;
