-- ========================================
-- Fix Supabase Email Authentication Provider
-- ========================================
-- Run this in your Supabase SQL Editor if email auth is not working

-- Check current auth configuration
SELECT 'Checking auth.config table...' as status;
SELECT name, value FROM auth.config WHERE name LIKE '%email%' OR name LIKE '%provider%';

-- Check if email provider is configured
SELECT 'Checking auth.provider settings...' as status;
SELECT * FROM auth.identities LIMIT 1;

-- Enable email provider (if disabled)
-- Note: This typically needs to be done through the Supabase dashboard
-- Go to: Authentication → Providers → Email (toggle ON)

-- Verify auth.users table has email column
SELECT 'Checking auth.users table structure...' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'auth';

-- Check for any auth-related errors
SELECT 'Checking recent auth errors (if any)...' as status;
SELECT created_at, error_code, error_message
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '24 hours'
AND NOT EXISTS(SELECT 1)
LIMIT 10;

-- Check if there are any RLS policies blocking auth
SELECT 'Checking auth.users RLS policies...' as status;
SELECT schemaname, tablename, policyname, permissive, roles
FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';

-- Ensure public.profiles has proper RLS for profile creation
SELECT 'Checking public.profiles RLS policies...' as status;
SELECT schemaname, tablename, policyname, permissive, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Test if signup trigger exists and is enabled
SELECT 'Checking signup trigger...' as status;
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname LIKE '%profile%';
