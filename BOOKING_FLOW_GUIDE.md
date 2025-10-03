# Muraka Hotels - Complete Booking Flow Guide

## Overview
This document explains the complete guest booking flow and how admins can manage bookings.

---

## 🎯 Guest Booking Flow (Step-by-Step)

### Step 1: Guest Registration/Login
1. **New Guest**: Visit `/signup` to create an account
   - Provide: Full Name, Email, Password
   - Account automatically created with `role = 'guest'`

2. **Existing Guest**: Visit `/login` to sign in
   - Enter email and password
   - Redirected to guest dashboard

### Step 2: Search for Rooms
**From Home Page (`/`):**
1. Select:
   - **Location**: Male, Laamu, or Faafu
   - **Check-in Date**: Any future date
   - **Check-out Date**: Must be after check-in
   - **Number of Guests**: 1-6+
   - **Room Type** (Optional): Filter by room type

2. Click "Search Rooms"

**From Guest Dashboard (`/dashboard/guest`):**
1. Click the **"Search & Book Rooms"** button in the Quick Actions card
2. Follow the same process as above

### Step 3: Browse Available Rooms (`/search`)
The search page shows:
- Available room types for selected location and dates
- Price per night and total price
- Room capacity and amenities
- Number of rooms available

**Filters Available:**
- Sort by: Price, Capacity, Room Type
- Minimum Capacity: Filter by guest count

### Step 4: Select and Book (`/booking`)
1. Click **"Book Now"** on desired room
2. **Guest Information** (auto-filled if logged in):
   - Full Name
   - Email
   - Phone Number
   - Special Requests

3. **Additional Services** (Optional):
   - Select services like Airport Transfer, Spa, etc.
   - Set quantity for each service

4. **Review Booking Summary**:
   - Room details
   - Check-in/Check-out dates
   - Total price breakdown
   - Cancellation policy

5. Click **"Confirm Booking"**
   - **Important**: Must be logged in to complete booking
   - If not logged in, prompted to sign in/sign up

### Step 5: Booking Confirmation
- Booking created with status: `pending` (awaiting admin confirmation)
- Redirected to Guest Dashboard with booking highlighted
- Booking appears in "Upcoming Bookings" tab

### Step 6: View Bookings (`/dashboard/guest`)
**Tabs Available:**
- **Upcoming Bookings**: All pending and confirmed future bookings
- **Past Bookings**: Completed, cancelled, or checked-out bookings
- **Profile**: View and edit profile information

**Booking Statuses:**
- 🟡 **Pending**: Awaiting admin/staff confirmation
- 🟢 **Confirmed**: Approved by admin, ready for check-in
- 🔵 **Checked In**: Guest has arrived
- ⚪ **Checked Out**: Stay completed
- 🔴 **Cancelled**: Booking cancelled

**Guest Actions:**
- Cancel pending/confirmed bookings (up to 24 hours before check-in)
- View booking details
- See total spent across all bookings

---

## 🛡️ Admin/Staff Management Flow

### Admin Dashboard (`/dashboard/admin/bookings`)

**What Admins Can See:**
- **All bookings** from all guests across all hotels
- Booking details: Guest info, hotel, room, dates, status, amount
- Real-time updates when guests create bookings

**Admin Capabilities:**

### 1. View All Bookings
- Search by: Booking ID, Guest Name, Email
- Filter by: Status (Pending, Confirmed, Cancelled)
- See complete booking information

### 2. Create Bookings for Guests (Manual Booking)
Click **"Add New Booking"** button:

1. **Select Guest**: Choose from registered guests (role='guest')
2. **Select Hotel**: Male, Laamu, or Faafu
3. **Select Room**: Rooms filtered by selected hotel
4. **Set Dates**: Check-in and Check-out
5. **Set Guests**: Number of guests
6. **Set Status**: Pending, Confirmed, or Cancelled
7. **Review Total Price**: Automatically calculated

**Important**:
- Only existing guest users can be selected
- If booking for Emma Davis (emma.davis@email.com), she must:
  1. Have an account in the system
  2. Have role = 'guest'

### 3. Confirm/Update Bookings
Click **Edit** button on any booking:

- **Pending → Confirmed**: Approve the booking
- **Confirmed → Checked In**: Guest has arrived
- **Checked In → Checked Out**: Guest has left
- **Any Status → Cancelled**: Cancel the booking

**Booking Lifecycle:**
```
Guest Creates → Pending → Admin Confirms → Confirmed →
Staff Checks In → Checked In → Staff Checks Out → Checked Out
```

### 4. View Guest Information
- Guest full name and email
- Contact information
- Booking history

---

## 🔄 Complete Data Flow

### When a Guest Books a Room:

```
1. Guest searches for rooms
   ↓
2. System queries database:
   - Finds matching room types
   - Checks room availability
   - Filters out rooms with conflicting bookings
   ↓
3. Guest selects room and clicks "Book Now"
   ↓
4. Guest completes booking form
   ↓
5. System creates booking record:
   - Insert into 'bookings' table (status = 'pending')
   - Insert into 'booking_rooms' table (links booking to specific room)
   - Insert into 'booking_services' table (if services selected)
   ↓
6. Guest redirected to dashboard
   ↓
7. Admin sees new booking in admin dashboard
   ↓
8. Admin clicks Edit and changes status to 'confirmed'
   ↓
9. Guest sees updated status in their dashboard
```

---

## 🔐 Row Level Security (RLS) Policies

**Important**: Must run `fix-rls-complete.sql` first to prevent infinite recursion!

### Profiles Table:
- ✅ Users can view their own profile
- ✅ Admins/managers/staff can view all profiles
- ✅ Users can update their own profile
- ✅ Admins can update all profiles

### Bookings Table:
- ✅ Guests can view their own bookings
- ✅ Staff/managers/admins can view all bookings
- ✅ Guests can create bookings
- ✅ Guests can update their own bookings
- ✅ Staff/managers/admins can update all bookings

### Booking Rooms & Services:
- ✅ Viewable by booking owner or staff
- ✅ Insertable by booking owner

---

## 🐛 Troubleshooting

### Issue: Guest bookings don't appear in admin dashboard
**Solution**:
1. Check RLS policies are set correctly
2. Run `fix-rls-complete.sql` in Supabase SQL Editor
3. Verify admin user has role = 'admin'

### Issue: Guest can't complete booking
**Solution**:
1. Ensure guest is logged in
2. Check that room is available for selected dates
3. Verify all required fields are filled

### Issue: Admin booking for guest doesn't show in guest dashboard
**Solution**:
1. Verify the selected guest has an active account
2. Check the guest_id matches the profile ID
3. Ensure the guest is logging in with correct email

### Issue: "Infinite recursion in policy for relation profiles"
**Solution**:
Run `fix-rls-complete.sql` to fix circular RLS policy references

---

## 📊 Database Schema

### Key Tables:
- **profiles**: User accounts (guests, staff, managers, admins)
- **hotels**: Three hotel locations
- **room_types**: Types of rooms (Standard, Deluxe, Suite, Penthouse)
- **rooms**: Individual rooms at each hotel
- **bookings**: Guest reservations
- **booking_rooms**: Links bookings to specific rooms
- **services**: Additional services (Airport Transfer, Spa, etc.)
- **booking_services**: Links bookings to services

### Key Fields in Bookings:
- `guest_id`: Foreign key to profiles table
- `hotel_id`: Foreign key to hotels table
- `check_in`: Date
- `check_out`: Date
- `num_guests`: Number of guests
- `total_price`: Calculated total
- `status`: pending | confirmed | checked_in | checked_out | cancelled

---

## ✅ Testing Checklist

### Guest Booking:
- [ ] Guest can sign up and create account
- [ ] Guest can search for rooms
- [ ] Guest can view available rooms
- [ ] Guest can complete booking
- [ ] Booking appears in guest dashboard with "pending" status
- [ ] Guest can cancel booking

### Admin Management:
- [ ] Admin can see all guest bookings
- [ ] Admin can create booking for existing guest
- [ ] Admin can update booking status
- [ ] Status changes appear in guest dashboard
- [ ] Admin can search and filter bookings

### Integration:
- [ ] RLS policies don't cause errors
- [ ] No infinite recursion errors
- [ ] Bookings created by guests appear in admin panel
- [ ] Bookings created by admin appear in guest dashboard
- [ ] All status changes sync properly

---

## 🎉 Summary

**Guest Flow**: Home → Search → Browse → Book → Dashboard → See Bookings
**Admin Flow**: View All Bookings → Confirm/Manage → Update Status

**Key Points:**
1. ✅ Guests must be logged in to complete bookings
2. ✅ All bookings start with status "pending"
3. ✅ Admins must confirm bookings (pending → confirmed)
4. ✅ Both guests and admins see real-time booking updates
5. ✅ Run RLS fix script to ensure proper access control

