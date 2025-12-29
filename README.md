# Muraka Hotels - Hotel Management System

**Students:**

- Aminath Yaula Yaarid (S2400576)
- Hawwa Saha Nasih (S2400566)
- Milyaaf Abdul Sattar (S2300565)
- Mohamed Raslaan Najeeb (S2400578)

**Module:** UFCF8S-30-2 Advanced Software Development  
**Institution:** UWE Bristol

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The `.env.local` file is included with Supabase credentials.

### 3. Run Application

```bash
npm run dev
```

Open: http://localhost:3000

### 4. Login

See `ACCOUNTS_CREDENTIALS.md` for all test accounts.

---

## Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

---

## Key Features

**User Roles:** Admin, Manager, Staff, Guest (RBAC + RLS)  
**Hotels:** 3 locations (Male, Laamu, Faafu)  
**Rooms:** 144 rooms across 4 types  
**Booking:** Search, book, cancel with dynamic pricing  
**Pricing:** Peak/off-peak seasons, cancellation fees  
**Services:** Breakfast, spa, airport transfers  
**Security:** Row-level security, session management

---

## Project Structure

```
muraka/
├── app/              # Next.js pages & API routes
├── components/       # React components
├── lib/              # Utilities & database clients
├── supabase/         # Database schema & migrations
└── types/            # TypeScript definitions
```

---

## Database Tables

- `profiles` - User accounts (4 roles)
- `hotels` - Hotel locations
- `room_types` - Room categories & pricing
- `rooms` - Room inventory
- `bookings` - Reservations
- `payments` - Payment records
- `services` - Add-on services
- `peak_seasons` - Pricing rules
- `cancellation_fees` - Cancellation policy

---

## Setup Instructions

Detailed setup guide available in `SETUP_INSTRUCTIONS.txt`
