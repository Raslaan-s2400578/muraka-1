# Booking Seeder Guide

Automate the creation of test bookings for your guest accounts.

## Option 1: Using the SQL Seeder (Manual)

The easiest way to seed bookings for all your guests.

### Steps:

1. **Create all guest accounts first** using the admin panel (User Management → Add User)
   - Create all 20 guests from ACCOUNTS_CREDENTIALS.md

2. **Go to Supabase Dashboard**
   - Navigate to: **SQL Editor**
   - Create a **New Query**

3. **Copy the SQL seeder**
   - Open file: `supabase/seed-bookings.sql`
   - Copy ALL content

4. **Run the query**
   - Paste into the SQL Editor
   - Click **Run**

5. **Done!**
   - All 20 bookings created automatically
   - Each booking includes:
     - Random check-in/check-out dates (past, present, future)
     - Room assignments
     - Random services (breakfast, spa, transfers)
     - Varied booking statuses (pending, confirmed, checked_in, checked_out, cancelled)

---

## Option 2: Using the API Endpoint (Automatic)

Use this if you want to trigger booking creation programmatically.

### Setup:

The endpoint is already created at: `/api/admin/seed-bookings`

### How to Use:

#### From the Command Line:

```bash
curl -X POST http://localhost:3000/api/admin/seed-bookings \
  -H "Content-Type: application/json"
```

#### From JavaScript/Frontend:

```javascript
const response = await fetch("/api/admin/seed-bookings", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
});

const result = await response.json();
console.log(result);
// Output: { success: true, bookingsCreated: 20, guestCount: 20 }
```

#### From Next.js Page Component:

```typescript
const seedBookings = async () => {
	try {
		const response = await fetch("/api/admin/seed-bookings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});

		const result = await response.json();
		if (result.success) {
			alert(`Success! Created ${result.bookingsCreated} bookings`);
		} else {
			alert(`Error: ${result.error}`);
		}
	} catch (error) {
		console.error("Seeding error:", error);
	}
};
```

### Requirements:

Before running the seeder, ensure you have:

1. ✅ **Guest accounts created** (at least 1 guest account)
2. ✅ **Hotels in database** (should already exist from schema.sql)
3. ✅ **Rooms in database** (created by seed-rooms.sql)
4. ✅ **Services in database** (optional, but recommended)

If you get an error saying "No guest accounts found", create some guest accounts first using the admin panel.

---

## What Gets Created

Each booking includes:

- **Guest**: Randomly assigned from your 20 guest accounts
- **Hotel**: Randomly selected from your 3 hotels
- **Dates**: Mix of past, present, and future bookings
  - Past: Up to 30 days ago
  - Present: Today to 7 days from now
  - Future: 7-90 days from now
- **Duration**: 3-7 nights per booking
- **Status**: Mix of statuses
  - `pending` - Awaiting confirmation
  - `confirmed` - Confirmed booking
  - `checked_in` - Currently in hotel
  - `checked_out` - Completed stay
  - `cancelled` - Cancelled booking (10% chance)
- **Price**: $500-$1500 per booking
- **Room**: One random room from selected hotel
- **Services**: Random add-ons (breakfast, spa, transfers, etc.)

---

## Total Data Created

Running the seeder creates:

- **20 bookings** (1 per guest account)
- **20 booking_rooms** (room assignments)
- **10-15 booking_services** (random services added to 50% of bookings)

---

## Troubleshooting

### Error: "No guest accounts found"

**Solution**: Create guest accounts first using the admin panel (User Management → Add User)

### Error: "No hotels found in database"

**Solution**: The hotels should be created by schema.sql. Run the schema setup again.

### Error: "No rooms found in database"

**Solution**: Run the room seeder: `supabase/seed-rooms.sql`

### Bookings not appearing in UI

**Solution**:

1. Refresh the page
2. Check browser console for errors
3. Verify guests are properly logged in
4. Check Supabase dashboard to confirm bookings were created

---

## Manual Booking Creation

If you prefer to create bookings manually via the UI instead of seeding:

1. Login as admin: `test@muraka.dev`
2. Go to **Bookings** section
3. Click **Create Booking**
4. Select guest, hotel, dates, rooms, and services
5. Save

However, with 20 guests, the seeder is much faster!

---

## Resetting Bookings

If you need to delete and recreate bookings:

```sql
-- Delete all bookings and related data
DELETE FROM booking_services;
DELETE FROM booking_rooms;
DELETE FROM bookings;

-- Then run the seeder again
```

**Important**: Only delete bookings you created for testing. Don't delete real bookings!

---

## Next Steps

After seeding bookings:

1. ✅ Guests can now log in and view their bookings
2. ✅ Staff can view all bookings
3. ✅ Managers can see analytics with booking data
4. ✅ Admin can see revenue reports with booking data
5. ✅ System is ready for testing payment flows, cancellations, reviews, etc.

---

## Quick Start Checklist

- [ ] Create all 20 guest accounts via admin panel
- [ ] Run `supabase/seed-bookings.sql` in Supabase SQL Editor
- [ ] Verify bookings appear in admin dashboard
- [ ] Test logging in as a guest and viewing bookings
- [ ] Test staff member viewing all bookings
- [ ] Check booking analytics in manager dashboard
