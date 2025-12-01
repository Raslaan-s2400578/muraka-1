# Automated Setup - Quick Start Guide

One-command automation for everything. No manual clicking needed!

---

## 🚀 Full Automation (Recommended)

Create all accounts and bookings in under 1 minute:

### Step 1: Create All Accounts (2 managers + 4 staff + 20 guests)

```bash
node scripts/batch-create-accounts.js all
```

**Output:**
```
✅ Success!
   Created: 26 accounts
   Failed: 0 accounts
```

### Step 2: Seed All Bookings

Go to Supabase SQL Editor and run `supabase/seed-bookings.sql`:

```sql
-- Copy from supabase/seed-bookings.sql
-- Paste into SQL Editor and click Run
```

**Result:** 20 bookings created automatically with varied dates, statuses, and services

---

## 📋 Step-by-Step Commands

### Create Just Guests (20 accounts)
```bash
node scripts/batch-create-accounts.js guests
```

### Create Just Staff (4 additional staff)
```bash
node scripts/batch-create-accounts.js staff
```

### Create Just Managers (2 accounts)
```bash
node scripts/batch-create-accounts.js managers
```

### Create Guests + Managers (no staff)
```bash
node scripts/batch-create-accounts.js guests
node scripts/batch-create-accounts.js managers
```

---

## 🔌 API Endpoints

You can also call the APIs directly from curl or JavaScript:

### Batch Create Users API

```bash
curl -X POST http://localhost:3000/api/admin/batch-create-users \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "ali@muraka.dev",
        "full_name": "Ali Mohammed",
        "role": "guest",
        "password": "Welcome@123"
      },
      {
        "email": "sara.manager@muraka.dev",
        "full_name": "Sara Hassan",
        "role": "manager",
        "password": "Welcome@123"
      }
    ]
  }'
```

### Seed Bookings API

```bash
curl -X POST http://localhost:3000/api/admin/seed-bookings
```

---

## 📊 What Gets Created

### Batch Create Users
- ✅ 2 Managers
- ✅ 4 Additional Staff (+ 1 existing = 5 total)
- ✅ 20 Guests

**Total: 26 accounts in seconds**

### Seed Bookings
- ✅ 20 bookings (one per guest)
- ✅ Room assignments
- ✅ Service add-ons
- ✅ Mixed statuses & dates

**Total: 20 bookings + 20 rooms + 10-15 services**

---

## ⚡ Complete Workflow

Run these commands in order:

```bash
# 1. Start dev server (if not running)
npm run dev

# Wait for server to be ready...
# Then in another terminal:

# 2. Create all accounts (26 accounts in ~30 seconds)
node scripts/batch-create-accounts.js all

# 3. Create bookings via Supabase SQL Editor
# - Go to: https://supabase.com/
# - Open SQL Editor
# - Copy supabase/seed-bookings.sql
# - Paste and click Run
# - Takes ~5 seconds

# 4. Done! 🎉
```

**Total time: ~1 minute**

---

## ✅ Verification

After automation, verify everything:

### Check Accounts Created
1. Login as admin: `test@muraka.dev` / `Welcome@123`
2. Go to Users tab
3. Should see:
   - Staff Members: 5
   - Managers: 2
   - Administrators: 1 (test)
   - Guests: 20

### Check Bookings Created
1. Go to Bookings tab
2. Should see ~20 bookings
3. Filter by status to see variety:
   - Pending
   - Confirmed
   - Checked In
   - Checked Out
   - Cancelled

### Test Guest Login
1. Try logging in as: `ali@muraka.dev` / `Welcome@123`
2. Should see their bookings
3. Can view booking details

---

## 🔧 Troubleshooting

### Error: "Cannot connect to localhost:3000"
- Make sure dev server is running: `npm run dev`
- Wait 10 seconds for server to start

### Error: "Service role key not configured"
- Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Restart dev server

### Some accounts failed to create
- Check the error messages in output
- Usually due to duplicate emails or invalid data
- Script will continue and create the rest

### Bookings not appearing
- Refresh the page
- Make sure you ran the SQL seeder
- Check Supabase dashboard directly

---

## 🎯 All-In-One Curl Command

Create everything with one command:

```bash
# Create accounts
curl -X POST http://localhost:3000/api/admin/batch-create-users \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "users": [
    {"email": "sara.manager@muraka.dev", "full_name": "Sara Hassan", "role": "manager", "password": "Welcome@123"},
    {"email": "amira.manager@muraka.dev", "full_name": "Amira Abdullah", "role": "manager", "password": "Welcome@123"},
    {"email": "aisha.staff@muraka.dev", "full_name": "Aisha Ahmed", "role": "staff", "password": "Welcome@123"},
    {"email": "hassan.staff@muraka.dev", "full_name": "Hassan Omar", "role": "staff", "password": "Welcome@123"},
    {"email": "layla.staff@muraka.dev", "full_name": "Layla Ibrahim", "role": "staff", "password": "Welcome@123"},
    {"email": "omar.staff@muraka.dev", "full_name": "Omar Khalil", "role": "staff", "password": "Welcome@123"},
    {"email": "ali@muraka.dev", "full_name": "Ali Mohammed", "role": "guest", "password": "Welcome@123"},
    {"email": "sara.guest@muraka.dev", "full_name": "Sara Abdullah", "role": "guest", "password": "Welcome@123"},
    {"email": "noor@muraka.dev", "full_name": "Noor Hassan", "role": "guest", "password": "Welcome@123"},
    {"email": "zainab@muraka.dev", "full_name": "Zainab Ahmed", "role": "guest", "password": "Welcome@123"},
    {"email": "karim@muraka.dev", "full_name": "Karim Ibrahim", "role": "guest", "password": "Welcome@123"},
    {"email": "dina@muraka.dev", "full_name": "Dina Saleh", "role": "guest", "password": "Welcome@123"},
    {"email": "rashid@muraka.dev", "full_name": "Rashid Ahmed", "role": "guest", "password": "Welcome@123"},
    {"email": "hana@muraka.dev", "full_name": "Hana Ibrahim", "role": "guest", "password": "Welcome@123"},
    {"email": "tariq@muraka.dev", "full_name": "Tariq Hassan", "role": "guest", "password": "Welcome@123"},
    {"email": "leila@muraka.dev", "full_name": "Leila Ahmed", "role": "guest", "password": "Welcome@123"},
    {"email": "amina@muraka.dev", "full_name": "Amina Fatima", "role": "guest", "password": "Welcome@123"},
    {"email": "hassan.guest@muraka.dev", "full_name": "Hassan Mohammed", "role": "guest", "password": "Welcome@123"},
    {"email": "fatima.guest@muraka.dev", "full_name": "Fatima Ibrahim", "role": "guest", "password": "Welcome@123"},
    {"email": "youssef@muraka.dev", "full_name": "Youssef Ahmed", "role": "guest", "password": "Welcome@123"},
    {"email": "layla.guest@muraka.dev", "full_name": "Layla Hassan", "role": "guest", "password": "Welcome@123"},
    {"email": "maryam@muraka.dev", "full_name": "Maryam Abdullah", "role": "guest", "password": "Welcome@123"},
    {"email": "ahmed.guest@muraka.dev", "full_name": "Ahmed Khalil", "role": "guest", "password": "Welcome@123"},
    {"email": "nadia@muraka.dev", "full_name": "Nadia Hassan", "role": "guest", "password": "Welcome@123"},
    {"email": "jamal@muraka.dev", "full_name": "Jamal Ibrahim", "role": "guest", "password": "Welcome@123"},
    {"email": "maya@muraka.dev", "full_name": "Maya Ahmed", "role": "guest", "password": "Welcome@123"}
  ]
}
EOF

# Then seed bookings
curl -X POST http://localhost:3000/api/admin/seed-bookings
```

---

## 📝 Manual Alternative

If scripts don't work:

1. **Batch Create via API UI**
   - POST to: `http://localhost:3000/api/admin/batch-create-users`
   - Body: JSON with users array
   - (Use Postman, Insomnia, or curl)

2. **Seed Bookings via SQL Editor**
   - Open Supabase SQL Editor
   - Copy `supabase/seed-bookings.sql`
   - Paste and Run

---

## 🎉 You're Done!

After running the automation commands, you have:
- ✅ 26 test accounts (2 managers, 4 staff, 20 guests)
- ✅ 20 test bookings with varied data
- ✅ Full operational system ready for testing

Test by logging in as different roles and exploring the system!
