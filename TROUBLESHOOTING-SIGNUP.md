# Troubleshooting Signup Database Error

## Step 1: Get Detailed Error Information

### A. Check Browser Console
1. Open your browser DevTools (F12)
2. Go to the **Console** tab
3. Try to sign up a new user
4. Look for console logs showing:
   - "Attempting signup with: ..."
   - "Signup error: ..." or "Signup response: ..."
5. **Copy the exact error message** including error code

### B. Check Network Tab
1. In DevTools, go to **Network** tab
2. Try signup again
3. Look for requests to `auth/v1/signup`
4. Click on it and check the **Response** tab
5. Look for detailed error information

## Step 2: Check Supabase Dashboard Logs

1. Go to: https://gqrpyhidaqzhqgvuvqjr.supabase.co
2. Click **Logs** in the left sidebar
3. Select **Postgres Logs**
4. Try signup again
5. Refresh logs and look for:
   - Any WARNING messages about "Failed to create profile"
   - Any ERROR messages
   - Constraint violations
6. **Copy any error messages you see**

## Step 3: Run Database Diagnostics

1. In Supabase Dashboard, go to **SQL Editor**
2. Open and run: `supabase/diagnose-signup-issue.sql`
3. Check the results for:
   - ✓ Trigger exists and is enabled
   - ✓ Function exists
   - ✓ All required columns exist in profiles table
   - ✓ RLS is enabled
   - ✓ Policies are created
4. **Screenshot or copy the results**

## Step 4: Check for Common Issues

### Issue 1: Email Confirmation Required
**Symptom**: User is created but you get an error message
**Solution**: Check if email confirmation is required
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Check "Enable email confirmations"
3. If enabled, you MUST click the confirmation link in email before login

### Issue 2: Duplicate Email
**Symptom**: "User already registered" error
**Solution**:
1. Go to **Authentication** → **Users**
2. Search for the email you're trying to use
3. Delete the old user or use a different email

### Issue 3: Missing Columns in Profiles Table
**Symptom**: Column "email" does not exist
**Solution**: Run `supabase/fix-signup-complete.sql` again

### Issue 4: RLS Policy Blocking Insert
**Symptom**: "new row violates row-level security policy"
**Solution**: The trigger uses SECURITY DEFINER which should bypass RLS, but verify:
```sql
-- Run this in SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Issue 5: NOT NULL Constraint Violation
**Symptom**: "null value in column violates not-null constraint"
**Solution**: Check which column and run:
```sql
-- Make full_name nullable
ALTER TABLE profiles ALTER COLUMN full_name DROP NOT NULL;
```

## Step 5: Manual Profile Creation Test

Try creating a profile manually to test the table:

```sql
-- Replace with a real user ID from auth.users
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  'USER_ID_HERE',
  'Test User',
  'test@example.com',
  'guest'
);
```

If this fails, the error message will tell you exactly what's wrong.

## Step 6: Test Trigger Manually

```sql
-- Check if trigger fires correctly
-- First, check recent auth users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then check if they have profiles
SELECT u.id, u.email, p.full_name, p.email as profile_email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
```

## What to Report Back

Please provide:
1. **Exact error message** from browser console
2. **Error code** (if shown)
3. **Results from diagnose-signup-issue.sql**
4. **Any errors from Supabase Postgres Logs**
5. Whether the user appears in Authentication → Users
6. Whether a profile was created (even partially)

## Quick Fixes to Try

### Fix 1: Reset Everything
```sql
-- Run in SQL Editor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Then run fix-signup-complete.sql again
```

### Fix 2: Disable Email Confirmation (for testing)
1. Dashboard → Authentication → Settings
2. Under "Email Auth" → Disable "Enable email confirmations"
3. Try signup again

### Fix 3: Check Supabase Client Configuration
Verify `.env.local` has correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gqrpyhidaqzhqgvuvqjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```
