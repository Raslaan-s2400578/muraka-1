-- DISABLE the sync_user_email_trigger that's blocking signups
-- This is the trigger causing the "Database error saving new user"

-- Drop the sync_user_email_trigger
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;

-- Verify it's gone
SELECT
  'Triggers remaining on auth.users:' as status,
  COUNT(*)::text as count
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;

-- List remaining triggers
SELECT
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;

SELECT 'sync_user_email_trigger has been removed - try signup now!' as message;
