# Complete Debugging Checklist

## Current Situation
- ✅ All SQL scripts run successfully
- ✅ Trigger and function created (then removed)
- ✅ Email column exists in profiles table
- ✅ RLS policies created
- ❌ **STILL getting "Database error saving new user (Code 500)"**

## This means the issue is NOT:
- ~~Our trigger~~ (we removed it, still fails)
- ~~Missing email column~~ (we verified it exists)
- ~~RLS policies~~ (we made them permissive)

## The issue MUST be one of these:

### Possibility 1: OTHER Triggers on auth.users
**Action**: Run `DEBUGGING-PLAN.sql` SECTION 1
**Look for**: Any OTHER triggers besides `on_auth_user_created`
**Fix**: If found, disable them

### Possibility 2: Supabase Auth Configuration Issue
**Action**: Check Supabase Dashboard → Authentication → Settings
**Look for**:
- [ ] "Enable email confirmations" - status
- [ ] "Enable phone confirmations" - should be OFF
- [ ] "Enable custom access token hook" - should be OFF
- [ ] Minimum password length requirements
- [ ] Any custom auth hooks

### Possibility 3: Email Provider Not Configured
**Action**: Supabase Dashboard → Settings → Auth → Email Auth
**Look for**:
- [ ] SMTP settings configured OR using Supabase default
- [ ] "Enable Email Signup" is enabled
- [ ] Email templates exist

### Possibility 4: Rate Limiting
**Action**: Supabase Dashboard → Authentication → Rate Limits
**Look for**:
- [ ] Check if IP is rate-limited
- [ ] Try from different network/browser

### Possibility 5: Foreign Key Constraint Violation
**Action**: Run `DEBUGGING-PLAN.sql` SECTION 4
**Look for**: Foreign key constraints on profiles table that might fail
**Fix**: Drop problematic constraints temporarily

### Possibility 6: Supabase Project Issue
**Action**: Check Supabase Dashboard → Settings → General
**Look for**:
- [ ] Project status (paused/active)
- [ ] Database health
- [ ] Any warnings or alerts

### Possibility 7: Client Configuration Issue
**Action**: Check `.env.local` file
**Verify**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gqrpyhidaqzhqgvuvqjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (should be LONG)
```
**Test**: Try using Supabase REST API directly

### Possibility 8: The Error is Actually From a Different Trigger
**Action**: Run `DEBUGGING-PLAN.sql` SECTION 2
**Look for**: Functions with names like `handle_user_*`, `on_*_created`, etc.
**Fix**: Drop them temporarily

## Step-by-Step Debugging Process

### Step 1: Run SQL Diagnostics
```bash
Run: supabase/DEBUGGING-PLAN.sql
```
- Copy ALL results
- Share SECTION 1 (triggers)
- Share SECTION 2 (functions)
- Share SECTION 4 (constraints)

### Step 2: Check Supabase Dashboard Auth Settings
1. Go to: https://gqrpyhidaqzhqgvuvqjr.supabase.co
2. Authentication → Settings → Auth Providers
3. Screenshot the Email Auth section
4. Check if "Confirm email" is enabled

### Step 3: Test Minimal Signup
Create a minimal test to isolate the issue:

```typescript
// In browser console on signup page
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'https://gqrpyhidaqzhqgvuvqjr.supabase.co',
  'YOUR_ANON_KEY'
);

const { data, error } = await supabase.auth.signUp({
  email: 'minimaltest@example.com',
  password: 'TestPassword123!',
});

console.log('Result:', { data, error });
```

### Step 4: Check Supabase Postgres Logs Detail
1. Dashboard → Logs → Postgres Logs
2. Click on one of the ERROR entries
3. Look for "detail" field
4. Copy the FULL error message

### Step 5: Try Disabling Email Confirmation
1. Dashboard → Authentication → Settings
2. Under "Email Auth"
3. **Disable** "Enable email confirmations"
4. Save
5. Try signup again

### Step 6: Check for Hidden Triggers
Run this to find ALL triggers in the database:

```sql
SELECT
  event_object_schema,
  event_object_table,
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY event_object_table, trigger_name;
```

### Step 7: Nuclear Option - Create New Test User Via SQL
Try creating a user manually in Supabase SQL Editor:

```sql
-- This should work if auth is configured correctly
-- Run in SQL Editor
SELECT auth.signup(
  email := 'sqltest@example.com',
  password := 'TestPassword123!'
);
```

If this FAILS, the issue is in Supabase auth configuration, not our code.

## What to Report Back

Please provide:
1. **Results from DEBUGGING-PLAN.sql** (especially SECTION 1, 2, 4)
2. **Screenshot of**: Dashboard → Authentication → Settings → Email Auth
3. **Result of**: Manual SQL signup test (Step 7)
4. **Full error details from**: Postgres Logs (click on one ERROR entry)
5. **Status of**: Email confirmation setting (enabled/disabled)

## Most Likely Culprits (in order)

1. **Another trigger exists** that we don't know about
2. **Email confirmation is required** but SMTP isn't configured
3. **A foreign key constraint** is failing
4. **Supabase auth hooks** are configured
5. **Project has auth restrictions** we can't see

Let's systematically eliminate each possibility!
