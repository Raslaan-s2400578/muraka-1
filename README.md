# Muraka Hotels - Luxury Resort Management System

Full-stack hotel management system for three Maldivian resort locations. Built with Next.js 15, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Next.js 15** - App Router, Server Components
- **TypeScript 5.9** - Full type safety
- **Supabase** - PostgreSQL, Auth, RLS
- **Tailwind CSS 4** - Responsive styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **React Hook Form + Zod** - Form validation
- **GSAP + Lenis** - Animations

## Quick Start

```bash
# Install
npm install

# Environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Database Setup
# 1. Create Supabase project
# 2. Run: supabase/schema.sql
# 3. Run: supabase/seed.sql

# Dev server
npm run dev
```

## Features

**Guests:** Room search, booking, profile management
**Staff:** Check-ins, room status, guest services
**Managers:** Analytics, pricing, staff oversight
**Admins:** User management, system configuration

## Database Schema

- **hotels** - 3 resort locations
- **room_types** - 4 room categories (pricing)
- **rooms** - Individual room inventory
- **profiles** - User profiles + roles
- **bookings** - Reservations
- **services** - Add-ons (transfers, spa, etc.)

Security: RLS enabled on all tables

## Test Accounts

Password for all: `Welcome@123`

```
admin@test.com    - Full access
manager@test.com  - Analytics & pricing
staff@test.com    - Operations
guest@test.com    - Booking only
```

After signup, set roles via SQL:
```sql
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');
```

## Deployment

**Vercel (Recommended):**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

**Cloudflare Pages:**
1. Disable Supabase Realtime (Edge Runtime incompatible)
2. Connect repository
3. Build: `npm run build`, Output: `.next`
4. Deploy

## Project Structure

```
app/
  (auth)/           - Login, signup
  dashboard/        - Role-based dashboards
  api/              - API routes
components/         - Reusable components
  ui/               - shadcn/ui
lib/
  supabase/         - Client & server instances
  email/            - Email templates
hooks/              - Custom React hooks
middleware.ts       - Auth & RBAC
supabase/           - Database files
```

## Scripts

```bash
npm run dev     # Development server
npm run build   # Production build
npm run lint    # ESLint
```

## Security

- Password: 8+ chars, mixed case, number, special char
- Session timeout: 15 minutes inactivity
- RLS policies: Role-based data access
- Environment variables: Secure credential management

## Production Status

✅ TypeScript: 0 errors
⚠️ ESLint: 10 warnings (image optimization recommended)
✅ Build: Successful
✅ Security: RLS + RBAC implemented
✅ Ready for deployment

Optional optimization: Replace `<img>` with Next.js `<Image>` component for 30-50% bandwidth reduction.

## License

MIT License - See LICENSE file

---

Built with ❤️ for Muraka Hotels
