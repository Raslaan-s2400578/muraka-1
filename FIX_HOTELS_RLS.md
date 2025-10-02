# Fix Hotels Table RLS Policies

You're getting this error because the Row Level Security (RLS) policies on the `hotels` table don't allow inserts.

## Quick Fix - Run this SQL in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to insert hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to update hotels" ON hotels;
DROP POLICY IF EXISTS "Allow admins to delete hotels" ON hotels;

-- Everyone can read hotels
CREATE POLICY "Allow public read access to hotels"
ON hotels
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert hotels
CREATE POLICY "Allow admins to insert hotels"
ON hotels
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can update hotels
CREATE POLICY "Allow admins to update hotels"
ON hotels
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete hotels
CREATE POLICY "Allow admins to delete hotels"
ON hotels
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

5. Click **Run** or press `Ctrl+Enter`

## What This Does:

- ✅ Allows **everyone** to read/view hotels (SELECT)
- ✅ Allows **only admins** to create hotels (INSERT)
- ✅ Allows **only admins** to update hotels (UPDATE)
- ✅ Allows **only admins** to delete hotels (DELETE)

## Verify It Worked:

After running the SQL:
1. Refresh your admin dashboard
2. Try clicking "Add New Hotel" again
3. Fill in the form and click "Create Hotel"
4. It should work now! ✅

## Alternative: Disable RLS (NOT RECOMMENDED for production)

If you want to quickly test without RLS (only for development):

```sql
ALTER TABLE hotels DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning:** This removes all security. Anyone can modify your hotels table!

## For Other Tables

If you get similar errors for other tables (bookings, rooms, etc.), you'll need similar RLS policies. Let me know which table and I'll create the policies for it.
