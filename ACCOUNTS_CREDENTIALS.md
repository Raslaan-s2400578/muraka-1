# Test Accounts - Credentials Reference

**All passwords:** `Welcome@123`

---

## ADMIN (1)

| Email            | Name                 | Password    |
| ---------------- | -------------------- | ----------- |
| admin@muraka.dev | System Administrator | Welcome@123 |

---

## MANAGERS (2)

| Email                     | Name         | Password    |
| ------------------------- | ------------ | ----------- |
| ahmed.manager@muraka.dev  | Ahmed Hassan | Welcome@123 |
| fatima.manager@muraka.dev | Fatima Ahmed | Welcome@123 |

---

## STAFF (5)

| Email                     | Name            | Password    |
| ------------------------- | --------------- | ----------- |
| mohammed.staff@muraka.dev | Mohammed Hassan | Welcome@123 |
| aisha.staff@muraka.dev    | Aisha Ahmed     | Welcome@123 |
| hassan.staff@muraka.dev   | Hassan Omar     | Welcome@123 |
| layla.staff@muraka.dev    | Layla Ibrahim   | Welcome@123 |
| omar.staff@muraka.dev     | Omar Khalil     | Welcome@123 |

---

## GUESTS (10)

| Email             | Name          | Password    |
| ----------------- | ------------- | ----------- |
| ali@muraka.dev    | Ali Mohammed  | Welcome@123 |
| sara@muraka.dev   | Sara Abdullah | Welcome@123 |
| noor@muraka.dev   | Noor Hassan   | Welcome@123 |
| zainab@muraka.dev | Zainab Ahmed  | Welcome@123 |
| karim@muraka.dev  | Karim Ibrahim | Welcome@123 |
| dina@muraka.dev   | Dina Saleh    | Welcome@123 |
| rashid@muraka.dev | Rashid Ahmed  | Welcome@123 |
| hana@muraka.dev   | Hana Ibrahim  | Welcome@123 |
| tariq@muraka.dev  | Tariq Hassan  | Welcome@123 |
| leila@muraka.dev  | Leila Ahmed   | Welcome@123 |

---

## How to Seed

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create **New Query**
3. Open file: `supabase/seed-accounts.sql`
4. Copy ALL content
5. Paste into SQL Editor
6. Click **Run**
7. Done! ✅

## Testing

Login at: `http://localhost:3000/login`

```
Admin:    admin@muraka.dev / Welcome@123 → /dashboard/admin
Manager:  ahmed.manager@muraka.dev / Welcome@123 → /dashboard/manager
Staff:    mohammed.staff@muraka.dev / Welcome@123 → /dashboard/staff
Guest:    ali@muraka.dev / Welcome@123 → /dashboard/guest
```
