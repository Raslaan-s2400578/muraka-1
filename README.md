# Muraka Hotels Management System

A comprehensive hotel management system built with Next.js 14, TypeScript, Supabase, and shadcn/ui for managing three luxury hotel locations in the Maldives.

## 🏨 Overview

Muraka Hotels operates three stunning locations across the Maldives:
- **Muraka Male** - Urban luxury near the capital
- **Muraka Laamu** - Pristine nature and marine life
- **Muraka Faafu** - Tranquil paradise with sunset views

## ✨ Features

### Guest Features
- **Room Search & Booking** - Search available rooms across locations with date filters
- **Multiple Room Types** - Standard Double, Deluxe King, Family Suite, and Penthouse
- **Additional Services** - Airport Transfer, Breakfast, Spa Access, Late Checkout
- **Guest Dashboard** - View bookings, cancel reservations, manage profile
- **Secure Authentication** - Password strength validation and session management

### Staff Features
- **Daily Operations** - Manage check-ins and check-outs
- **Room Management** - Update room statuses and availability
- **Guest Services** - Search and manage guest bookings

### Manager Features
- **Analytics Dashboard** - Revenue reports and occupancy analytics
- **Rate Management** - Update room pricing for peak/off-peak seasons
- **Staff Oversight** - Monitor staff operations

### Admin Features
- **User Management** - Create accounts and assign roles
- **System Settings** - Hotel management and system configuration
- **Full Access** - Complete system administration

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
cd Muraka
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the schema migration:

```sql
-- Copy and execute the contents of supabase/schema.sql
```

3. Run the seed data:

```sql
-- Copy and execute the contents of supabase/seed.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables

- **hotels** - Hotel locations and details
- **room_types** - Room configurations and pricing
- **rooms** - Individual room inventory
- **profiles** - User profiles extending Supabase auth
- **bookings** - Reservation records
- **booking_rooms** - Room assignments for bookings
- **services** - Additional services available
- **booking_services** - Services added to bookings

### Security

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** with policies for guest, staff, manager, and admin
- **Session management** with automatic timeout
- **Data validation** at both client and database levels

## 🎯 User Roles & Permissions

| Feature | Guest | Staff | Manager | Admin |
|---------|-------|-------|---------|-------|
| Book Rooms | ✅ | ✅ | ✅ | ✅ |
| View Own Bookings | ✅ | ✅ | ✅ | ✅ |
| Manage Check-ins/outs | ❌ | ✅ | ✅ | ✅ |
| Update Room Status | ❌ | ✅ | ✅ | ✅ |
| View Analytics | ❌ | ❌ | ✅ | ✅ |
| Manage Room Rates | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ✅ |

## 🏗 Project Structure

```
Muraka/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/                # Role-based dashboards
│   │   ├── admin/
│   │   ├── manager/
│   │   ├── staff/
│   │   └── guest/
│   ├── search/                   # Search results
│   ├── booking/                  # Booking process
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities and configurations
│   ├── supabase/                 # Supabase clients
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript type definitions
├── supabase/                     # Database files
│   ├── schema.sql                # Database schema
│   └── seed.sql                  # Sample data
├── middleware.ts                 # Route protection
└── README.md
```

## 🔐 Security Implementation

### Authentication
- **Password Requirements**: 8+ characters with uppercase, lowercase, number, and special character
- **Failed Login Protection**: Account lockout after 5 failed attempts
- **Session Timeout**: 15 minutes of inactivity

### Authorization
- **Route Protection**: Middleware-based role checking
- **API Security**: Row-level security policies
- **Data Access**: Users can only access their own data unless privileged

### Database Security
- **RLS Policies**: Comprehensive row-level security
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase

## 🏨 Hotel Locations & Pricing

### Room Types & Capacity

| Room Type | Capacity | Off-Peak | Peak |
|-----------|----------|----------|------|
| Standard Double | 2 guests | $120-150 | $180-220 |
| Deluxe King | 2 guests | $200-250 | $280-350 |
| Family Suite | 4 guests | $350-400 | $450-550 |
| Penthouse | 6 guests | $800-900 | $1200-1400 |

### Additional Services

- **Airport Transfer**: $50
- **Breakfast**: $20 per person
- **Spa Access**: $35 per person
- **Late Checkout**: $40

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all production environment variables
2. **Database**: Run migrations and seed data on production database
3. **Authentication**: Configure Supabase auth settings
4. **RLS**: Verify all row-level security policies
5. **Testing**: Run comprehensive testing suite

### Recommended Platforms

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Supabase** (for database hosting)

## 🧪 Testing

### Test User Accounts

For testing the application, use these pre-configured test accounts:

**All test users use the same password: `Welcome@123`**

| Role | Email | Full Name | Access Level |
|------|-------|-----------|--------------|
| **Admin** | `admin@test.com` | Test Admin | Full system access |
| **Manager** | `manager@test.com` | Test Manager | Analytics, rates, staff oversight |
| **Staff** | `staff@test.com` | Test Staff | Check-ins, room management |
| **Guest** | `guest@test.com` | Test Guest | Booking and profile management |

### Creating Test Users

1. **Disable email confirmation** in Supabase Dashboard → Authentication → Settings
2. **Sign up** at `/signup` with the emails above using password `Welcome@123`
3. **Set user roles** by running this SQL in Supabase SQL Editor:

```sql
-- Update user roles after signup
UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');
UPDATE profiles SET role = 'manager' WHERE id = (SELECT id FROM auth.users WHERE email = 'manager@test.com');
UPDATE profiles SET role = 'staff' WHERE id = (SELECT id FROM auth.users WHERE email = 'staff@test.com');
UPDATE profiles SET role = 'guest' WHERE id = (SELECT id FROM auth.users WHERE email = 'guest@test.com');
```

### Testing Features

- **Guest Flow**: Login as `guest@test.com` to test booking process
- **Staff Operations**: Login as `staff@test.com` to test daily operations
- **Manager Analytics**: Login as `manager@test.com` to test reports and settings
- **Admin Panel**: Login as `admin@test.com` to test user management

## 📚 API Documentation

### Key Endpoints

- **Authentication**: Handled by Supabase Auth
- **Bookings**: CRUD operations with RLS
- **Room Search**: Complex queries with availability checking
- **User Management**: Admin-only user creation and role management

### Example API Usage

```typescript
// Search available rooms
const { data: rooms } = await supabase
  .from('room_types')
  .select(`
    *,
    hotel:hotels(*),
    rooms!inner(id, status)
  `)
  .eq('hotels.location', 'Male')
  .eq('rooms.status', 'Available')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🗺 Roadmap

### Phase 2 Features
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics with charts
- [ ] Multi-language support
- [ ] Loyalty program
- [ ] Review and rating system
- [ ] Real-time chat support

### Technical Improvements
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] PWA features
- [ ] Advanced caching strategies
- [ ] Monitoring and logging
- [ ] CI/CD pipeline
- [ ] Docker containerization

---

Built with ❤️ for Muraka Hotels - Experience Paradise in the Maldives
