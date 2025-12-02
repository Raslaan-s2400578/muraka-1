# Payments Table Migration Guide

The payments page is now ready to display data, but the `payments` table needs to be created in your Supabase database first. Follow these steps to complete the setup.

## Quick Summary

The payments table has been defined and is ready to be deployed. Once you run this migration:
- The `payments` table will be created with proper schema and constraints
- Row-level security (RLS) policies will be configured for staff/admin access
- Test payment data will be automatically populated from confirmed bookings
- The payments page will display all payment records

## Steps to Run the Migration

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to your Supabase project dashboard**
   - Navigate to https://app.supabase.com
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and execute the migration SQL**
   - Open the file: `supabase/migrations/20250202_create_payments_table.sql`
   - Copy all the SQL content
   - Paste it into the Supabase SQL Editor
   - Click "Run" (or press Cmd+Enter / Ctrl+Enter)

4. **Verify success**
   - You should see a success message
   - Check the "Tables" section in the left sidebar
   - You should now see a `payments` table listed

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed and configured:

```bash
# Push all pending migrations to your database
npx supabase push
```

This will automatically apply all migration files that haven't been run yet.

## What Gets Created

The migration will create:

- **payments table** with columns:
  - `id` (UUID, primary key)
  - `booking_id` (UUID, foreign key to bookings)
  - `amount` (decimal, payment amount)
  - `status` (pending, successful, failed, refunded, completed)
  - `payment_method` (credit_card, debit_card, bank_transfer)
  - `transaction_id` (unique transaction identifier)
  - `payment_date` (when payment was made)
  - `created_at`, `updated_at` (timestamps)

- **Indexes** for performance on:
  - booking_id
  - status
  - created_at

- **Row-Level Security (RLS)** policies:
  - Guests can view/create payments for their own bookings
  - Staff/Managers can view and update all payments
  - Only admins can delete payments

- **Test data**: Payment records will be auto-populated for all confirmed bookings

## Troubleshooting

**Q: I get an error about the table already existing**
A: The SQL includes `IF NOT EXISTS`, so this shouldn't happen. If you get this error, the table may already be partially created. Contact support or check your Supabase logs.

**Q: No test data appears after running the migration**
A: The auto-insert at the end only creates payments for bookings with status 'confirmed', 'checked_in', or 'checked_out'. Check that you have bookings with these statuses.

**Q: The payments page still shows "No payments found"**
A:
1. Make sure the migration ran successfully (no errors in Supabase dashboard)
2. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. Check that you're logged in as a staff/admin user
4. Check the browser console for any error messages

## After Migration

Once the migration is complete:

1. **Refresh your application**
   - Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
   - You may need to restart the dev server: `npm run dev`

2. **Verify the payments page**
   - Navigate to `/dashboard/staff/payments`
   - You should see payment records in the table
   - Search and filter by status should work

3. **Check the data**
   - Filter by different statuses (completed, pending, failed)
   - Verify payment amounts match booking prices
   - Check that customer details are displayed correctly

## Support

If you encounter any issues:
1. Check the browser console for error messages (F12 > Console tab)
2. Check your Supabase project logs (Dashboard > Logs)
3. Verify your Supabase URL and keys in `.env.local` are correct
4. Make sure you're logged in as a staff or admin user to view payments

## Files Involved

- Migration: `supabase/migrations/20250202_create_payments_table.sql`
- Page: `app/dashboard/staff/payments/page.tsx`
- API: `app/api/admin/seed-payments/route.ts` (for manual seeding if needed)

---

That's it! Once you run the migration, your payments page will be fully functional with real data.
