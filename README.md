# 🏝️ Muraka Hotels - Maldives Luxury Resort Booking System

A full-stack hotel booking and management system built with Next.js 15, Supabase, and deployed on Cloudflare Pages.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Raslaan-s2400578/muraka.git
cd muraka
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
Run these SQL files in your Supabase SQL Editor (in order):
1. `supabase/migrations/20250101000000_add_reviews.sql`
2. `supabase/migrations/20250101000001_add_promotions.sql`
3. `supabase/migrations/20250101000002_fix_payments_policy.sql`

### 4. Run Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

---

## 👥 Default Login Credentials

### Admin Portal
```
Email: admin@muraka.com
Password: admin123
Dashboard: /dashboard/admin
```

### Manager Portal
```
Email: manager@muraka.com
Password: manager123
Dashboard: /dashboard/manager
```

### Staff Portal
```
Email: staff@muraka.com
Password: staff123
Dashboard: /dashboard/staff
```

### Guest Portal
```
Email: guest@muraka.com
Password: guest123
Dashboard: /dashboard/guest
```

---

## 🏗️ Tech Stack

- **Framework:** Next.js 15.5.4 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Deployment:** Cloudflare Pages
- **Email:** Resend

---

## ✨ Features

### Guest Features
- 🔍 Search & book rooms across 3 locations
- 💳 Payment history with downloadable receipts
- ⭐ 5-star review system for completed stays
- 👤 Profile management
- 📧 Email notifications
- 📱 Responsive design

### Staff Features
- 📊 Booking management
- 👥 Customer management
- 💰 Payment tracking
- 🏨 Hotel & room overview

### Manager Features
- 📈 Analytics dashboard
- 📉 Occupancy tracking
- 💵 Revenue reports
- 🎯 Performance metrics

### Admin Features
- 👨‍💼 User management (create staff/manager accounts)
- 🏨 Hotel & room management
- 💸 Payment management
- 📊 Complete system overview
- ⚙️ System configuration

---

## 📁 Project Structure

```
muraka/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages (admin/staff/manager/guest)
│   ├── booking/           # Booking flow
│   ├── login/             # Authentication
│   └── signup/            # Registration
├── components/            # Reusable components
├── lib/                   # Utilities & config
│   ├── supabase/         # Supabase client
│   └── email/            # Email templates
├── supabase/
│   └── migrations/       # Database migrations (REQUIRED)
└── public/               # Static assets
```

---

## 🗄️ Database Schema

### Main Tables
- `profiles` - User profiles with roles (admin/staff/manager/guest)
- `hotels` - 3 hotel locations in Maldives
- `room_types` - Different room categories
- `rooms` - Individual room inventory
- `bookings` - Guest reservations
- `payments` - Payment records
- `reviews` - Guest reviews (5-star rating)
- `promotions` - Seasonal discounts
- `newsletter_subscribers` - Email list

---

## 🚀 Deployment to Cloudflare Pages

### Prerequisites
⚠️ **CRITICAL:** All 3 SQL migrations MUST be run first!

### Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production deployment"
   git push origin feature/roles
   ```

2. **Cloudflare Pages Setup:**
   - Go to [Cloudflare Pages](https://dash.cloudflare.com/)
   - Create project → Connect Git
   - Select repository: `muraka`
   - Branch: `feature/roles`

3. **Build Settings:**
   ```
   Build command: npm run build
   Build output: .next
   Framework: Next.js
   ```

4. **Environment Variables:**
   Add these in Cloudflare:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

5. **Deploy!**
   Build time: ~2 minutes

6. **Post-Deployment:**
   - Update Supabase Auth redirect URLs with your Cloudflare domain
   - Test all login flows
   - Verify payments work

---

## 🏨 Hotel Locations

1. **Muraka Male** - Urban luxury near capital
2. **Muraka Laamu** - Pristine nature & diving
3. **Muraka Faafu** - Secluded paradise

---

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access control
- ✅ Secure password hashing
- ✅ Email verification
- ✅ Protected API routes
- ✅ Service role key isolation

---

## 📧 Email Notifications

Automated emails for:
- Welcome message on signup
- Booking confirmation
- Payment receipts
- (Newsletter coming soon)

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean build cache
rm -rf .next
npm run build
```

### Database Connection Issues
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project is not paused

### Login Not Working
- Run database migrations
- Check RLS policies are enabled
- Verify user exists in `profiles` table

### Payment Creation Fails
- **CRITICAL:** Run migration #3 (`fix_payments_policy.sql`)
- This enables guests to create payment records

---

## 📝 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🎯 API Routes

### Public
- `POST /api/auth/*` - Authentication (Supabase)

### Protected (Admin Only)
- `POST /api/admin/create-user` - Create staff/manager/admin accounts

### Development
- `GET /api/test-email` - Test email sending

---

## 🔄 Workflow

### Guest Booking Flow
1. Search rooms → Select dates & location
2. Choose room type → Review details
3. Enter guest info → Make payment
4. Receive email confirmation
5. View booking in dashboard
6. After checkout → Leave review

### Admin User Creation Flow
1. Login as admin
2. Dashboard → Users → Create User
3. Enter: email, password, name, NID, role
4. User receives welcome email
5. User can login immediately

---

## 📊 Features by Version

### v1.0 (Current - Production Ready)
- ✅ Multi-role authentication system
- ✅ Booking & payment management
- ✅ Review/rating system
- ✅ Email notifications
- ✅ Admin user creation
- ✅ Real-time hotel metrics
- ✅ Responsive design

### v1.1 (Planned)
- 🔜 Booking modifications
- 🔜 Dynamic availability calendar
- 🔜 Interactive location map
- 🔜 Newsletter system
- 🔜 Seasonal promotions UI

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is for educational/portfolio purposes.

---

## 👨‍💻 Developer

**Mohamed Raslaan**
- GitHub: [@Raslaan-s2400578](https://github.com/Raslaan-s2400578)
- Project: Muraka Hotels Management System

---

## 🙏 Acknowledgments

- Next.js Team for the amazing framework
- Supabase for the backend infrastructure
- shadcn/ui for beautiful components
- Cloudflare for edge deployment

---

## 📞 Support

Need help?
1. Check the troubleshooting section above
2. Review database migrations are all run
3. Verify environment variables are set
4. Check Supabase project is active

---

**Built with ❤️ in the Maldives**

**Version:** 1.0.0
**Last Updated:** October 6, 2025
**Status:** 🟢 Production Ready
