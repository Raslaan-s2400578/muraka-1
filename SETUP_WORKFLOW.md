# Complete Setup Workflow for Muraka Hotels

Follow this step-by-step guide to get your system fully operational with test data.

## Phase 1: Environment & Admin Setup (✅ Already Done)

- [x] Database schema created (`supabase/schema.sql`)
- [x] Hotels seeded
- [x] Room types created
- [x] Admin account created (test@muraka.dev)
- [x] Pricing system implemented
- [x] User roles configured (guest, staff, manager, admin)

---

## Phase 2: Create Staff & Managers (🟡 Next Step)

Create staff and manager accounts using the admin panel.

### Step 1: Login as Admin
```
Email: test@muraka.dev
Password: Welcome@123
URL: http://localhost:3000/login
```

### Step 2: Navigate to User Management
- Click on sidebar → **Users**
- Or go to: `http://localhost:3000/dashboard/admin/users`

### Step 3: Create 2 Managers
Use the **Add User** button and create:

| Email | Name | Password | Role |
|-------|------|----------|------|
| sara.manager@muraka.dev | Sara Hassan | Welcome@123 | Manager |
| amira.manager@muraka.dev | Amira Abdullah | Welcome@123 | Manager |

### Step 4: Create 4 Additional Staff
Use the **Add User** button and create (in addition to staff@muraka.dev):

| Email | Name | Password | Role |
|-------|------|----------|------|
| aisha.staff@muraka.dev | Aisha Ahmed | Welcome@123 | Staff |
| hassan.staff@muraka.dev | Hassan Omar | Welcome@123 | Staff |
| layla.staff@muraka.dev | Layla Ibrahim | Welcome@123 | Staff |
| omar.staff@muraka.dev | Omar Khalil | Welcome@123 | Staff |

**Total: 5 staff members + 2 managers**

---

## Phase 3: Create Guest Accounts (🟡 Next Step)

Create 20 guest accounts. This is tedious to do manually, so we recommend using a script.

### Option A: Manual (Slow - 10+ minutes)
Use the **Add User** button and create all 20 guests from `ACCOUNTS_CREDENTIALS.md`

### Option B: Automated Script (Recommended)
**Coming soon**: We'll create a batch import feature that lets you upload a CSV of accounts.

For now, you can create them manually one by one, or we can create a helper script.

---

## Phase 4: Seed Test Bookings (🟡 After Phase 3)

Once all 20 guest accounts are created, seed the bookings.

### Step 1: Open Supabase SQL Editor
- Go to: https://supabase.com/
- Select your project
- Click **SQL Editor** in sidebar
- Create **New Query**

### Step 2: Copy Seeder SQL
- Open file: `supabase/seed-bookings.sql`
- Copy ALL content
- Paste into SQL Editor

### Step 3: Run Query
Click **Run** button

Result: 20 bookings created automatically

---

## Phase 5: Verify Everything Works

### Step 1: Test Admin Account
- Login: `test@muraka.dev` / `Welcome@123`
- Should see: Dashboard with stats
- Check: **Users** tab shows all staff, managers, and guests

### Step 2: Test Manager Account
- Login: `sara.manager@muraka.dev` / `Welcome@123`
- Should see: Manager dashboard with analytics
- Check: **Bookings** tab shows all bookings

### Step 3: Test Staff Account
- Login: `staff@muraka.dev` / `Welcome@123`
- Should see: Staff dashboard with bookings
- Check: **Customers** tab shows guest profiles

### Step 4: Test Guest Account
- Login: `ali@muraka.dev` / `Welcome@123`
- Should see: Guest dashboard with their bookings
- Check: Can view only their own bookings and profile

---

## Phase 6: System Features Testing

Now that you have data, test these features:

### Bookings Management
- [ ] View bookings by status
- [ ] Filter bookings by date range
- [ ] Cancel a booking
- [ ] Modify booking details

### Revenue & Analytics
- [ ] View total revenue
- [ ] Check occupancy rates
- [ ] See booking trends
- [ ] Generate reports

### User Management
- [ ] Create new users
- [ ] Edit user roles
- [ ] Delete test users
- [ ] View user activity

### Guest Features
- [ ] Search hotels
- [ ] View room availability
- [ ] Create booking
- [ ] View booking history
- [ ] Cancel booking
- [ ] Leave review

---

## Phase 7: Production Checklist

Before deploying to production:

- [ ] Update admin credentials (don't use test@muraka.dev)
- [ ] Set up real email service
- [ ] Configure payment gateway
- [ ] Set up backup strategy
- [ ] Configure monitoring/logging
- [ ] Set up automated backups
- [ ] Test all email flows
- [ ] Test payment flows
- [ ] Security audit
- [ ] Performance testing

---

## Quick Command Reference

### View All Test Accounts
```
cat ACCOUNTS_CREDENTIALS.md
```

### View Booking Seeder Script
```
cat supabase/seed-bookings.sql
```

### View Booking Seeder API
```
cat app/api/admin/seed-bookings/route.ts
```

### Check User Counts
Login as admin and go to Users tab - you'll see the stats:
- Staff Members: X
- Managers: X
- Administrators: X
- Guests: X

---

## Estimated Time

- **Phase 2** (Managers & Staff): 5 minutes
- **Phase 3** (Guests - Manual): 15-20 minutes
- **Phase 3** (Guests - Script): 1 minute
- **Phase 4** (Seed Bookings): 30 seconds
- **Phase 5** (Verify): 10 minutes

**Total**: 30-50 minutes (depending on how you create guests)

---

## Troubleshooting

### Guests can't login
- [ ] Verify email is correct in ACCOUNTS_CREDENTIALS.md
- [ ] Check password is exactly: `Welcome@123`
- [ ] Verify guest account exists in Users tab

### Can't see bookings
- [ ] Run the booking seeder
- [ ] Refresh page
- [ ] Check browser console for errors
- [ ] Verify user is logged in

### Permission errors
- [ ] Check user role matches dashboard (admin → /admin, staff → /staff, etc)
- [ ] Verify RLS policies are correct
- [ ] Check Supabase Auth token is valid

---

## Next: Pushing to Git

Once everything is working:

```bash
git add .
git commit -m "Add booking seeder and automation"
git push
```

This will include:
- New guest accounts documentation
- Booking seeder scripts
- Updated credentials guide
- Setup workflow documentation
