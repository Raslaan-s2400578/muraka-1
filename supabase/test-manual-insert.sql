-- Manual test to see the exact error
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
  test_metadata JSONB := '{"full_name": "Test User", "phone": "+960-1234567"}'::jsonb;
BEGIN
  -- Simulate what the trigger would do
  INSERT INTO public.profiles (id, full_name, phone, email, role)
  VALUES (
    test_user_id,
    COALESCE(NULLIF(TRIM(test_metadata->>'full_name'), ''), 'Guest'),
    NULLIF(TRIM(test_metadata->>'phone'), ''),
    test_email,
    'guest'
  );

  RAISE NOTICE 'Test insert successful!';

  -- Clean up test data
  DELETE FROM public.profiles WHERE id = test_user_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;
