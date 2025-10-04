-- Check the exact foreign key constraint names for the bookings table
-- We need these to use proper Supabase joins

SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
  AND contype = 'f'  -- foreign key constraints
ORDER BY conname;
