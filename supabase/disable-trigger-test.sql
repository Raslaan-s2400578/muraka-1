-- TEMPORARILY disable the trigger to test if it's causing the issue
-- This will help us isolate whether the trigger is the problem

-- Disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Verify it's disabled
SELECT
  'Trigger Status: ' || CASE tgenabled
    WHEN 'D' THEN 'DISABLED'
    WHEN 'O' THEN 'ENABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Instructions:
-- After running this, try to sign up again
-- If signup works, the trigger has a bug
-- If signup still fails, the issue is elsewhere

-- TO RE-ENABLE THE TRIGGER LATER, RUN:
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
