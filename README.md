# Muraka Hotels - Maldives Booking System

Full-stack hotel booking system built with Next.js 15, Supabase, and Cloudflare Pages.

## Quick Start

### 1. Install
```bash
git clone https://github.com/Raslaan-s2400578/muraka.git
cd muraka
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup
Run SQL files in Supabase SQL Editor (in order):
1. `supabase/schema.sql`
2. Hotels & room types seeder
3. `supabase/seed-accounts.sql`
4. `supabase/migrations/20250125_implement_pricing_system.sql`
5. `supabase/migrations/20250130_fix_pricing_data.sql`
6. `supabase/seed-rooms.sql` (optional - 144 rooms)

### 4. Run Dev Server
```bash
npm run dev
```
Visit: http://localhost:3000

## Test Accounts

All passwords: `Welcome@123`

- **Admin**: admin@muraka.dev → /dashboard/admin
- **Manager**: ahmed.manager@muraka.dev → /dashboard/manager
- **Staff**: mohammed.staff@muraka.dev → /dashboard/staff
- **Guest**: ali@muraka.dev → /dashboard/guest

See [ACCOUNTS_CREDENTIALS.md](ACCOUNTS_CREDENTIALS.md) for full list.

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Cloudflare Pages

## Features

### Guest
- Search & book rooms
- Manage bookings
- Payment history
- Leave reviews

### Staff
- Booking management
- Customer support
- Payment tracking
- Room status

### Manager
- Analytics & occupancy
- Revenue reports
- Hotel management
- Performance metrics

### Admin
- User management
- Complete system overview
- Pricing & services
- Room configuration

## Project Structure

```
muraka/
├── app/                      # Next.js app
│   ├── api/                 # API endpoints
│   ├── (auth)/              # Login/signup
│   └── dashboard/           # Role-based dashboards
├── components/              # UI components
├── lib/                     # Utilities
│   ├── supabase/           # Database client
│   └── pricing/            # Pricing calculations
├── supabase/               # Database
│   ├── schema.sql          # Tables & RLS
│   ├── migrations/         # Migrations
│   └── seed-*.sql          # Seeders
└── types/                  # TypeScript types
```

## Database Schema

**Core Tables**:
- `auth.users` - Supabase authentication
- `profiles` - User profiles & roles (guest, staff, manager, admin)
- `hotels` - 3 locations (Male, Laamu, Faafu)
- `room_types` - 4 room types with pricing
- `rooms` - 144 rooms (48 per location)
- `bookings` - Guest reservations
- `booking_rooms` - Room assignments
- `services` - Ancillary services (transfer, food, wellness)

**Pricing Tables**:
- `peak_seasons` - Peak season pricing multipliers
- `cancellation_fees` - Cancellation policy rules
- `pricing_audit` - Price change history

## Key Features

✅ RBAC with 4 roles and RLS policies
✅ Pricing system with peak/off-peak rates
✅ Cancellation policy (>14 days: free, 3-14 days: 50%, <72h: 100%)
✅ 144 rooms with status tracking
✅ Service add-ons (breakfast, spa, transfers)
✅ Email authentication via Supabase
✅ Role-based route protection
✅ 18 test accounts pre-seeded

## Documentation

- [Session Summary](SESSION_SUMMARY.md) - Recent changes
- [Pricing Details](PRICING.md) - Pricing structure
- [Account Credentials](ACCOUNTS_CREDENTIALS.md) - Test accounts
