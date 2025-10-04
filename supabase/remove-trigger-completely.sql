-- REMOVE THE TRIGGER COMPLETELY
-- We'll use client-side profile creation instead

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Verify they're gone
SELECT
  'Triggers remaining: ' || COUNT(*)::text as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

SELECT
  'Functions remaining: ' || COUNT(*)::text as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Ensure RLS allows client-side inserts
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.profiles;

CREATE POLICY "allow_insert_during_signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts

SELECT 'Trigger removed - signup should work now with client-side profile creation' as message;
