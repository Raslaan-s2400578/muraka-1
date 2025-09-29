# Muraka Hotels Setup Guide

This guide will walk you through setting up the Muraka Hotels Management System step by step.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- A **Supabase account** ([Sign up here](https://supabase.com/))
- A **code editor** (VS Code recommended)
- **Git** installed for version control

## 🚀 Step 1: Project Setup

### 1.1 Navigate to Project Directory
```bash
cd Muraka
```

### 1.2 Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase client libraries
- Form handling libraries

## 🗄️ Step 2: Database Setup

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `muraka-hotels`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### 2.2 Get Project Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL**
   - **anon public key**
   - **service_role secret key** (keep this secure!)

### 2.3 Configure Environment Variables

1. In the `Muraka` directory, create `.env.local`:

```bash
# Copy .env.local template
cp .env.local.example .env.local
```

2. Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2.4 Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. This will create:
   - All required tables
   - Row Level Security policies
   - Triggers and functions
   - Initial constraints

### 2.5 Seed Sample Data

1. In SQL Editor, copy contents of `supabase/seed.sql`
2. Run the script to populate:
   - 3 hotel locations
   - Room types for each hotel
   - 120 total rooms (40 per hotel)
   - 4 additional services
   - Sample room configurations

## 🔐 Step 3: Authentication Setup

### 3.1 Configure Auth Settings

1. In Supabase dashboard, go to **Authentication > Settings**
2. Configure the following:

**Site URL**: `http://localhost:3000` (for development)

**Redirect URLs**: Add these URLs:
- `http://localhost:3000/dashboard`
- `http://localhost:3000/dashboard/guest`
- `http://localhost:3000/dashboard/staff`
- `http://localhost:3000/dashboard/manager`
- `http://localhost:3000/dashboard/admin`

**Email Templates**: Customize if needed (optional)

### 3.2 Set Up Email Provider (Optional)

For production, configure an email provider:
1. Go to **Authentication > Settings > SMTP Settings**
2. Configure your SMTP provider (SendGrid, AWS SES, etc.)

## 🎨 Step 4: Frontend Configuration

### 4.1 Verify shadcn/ui Setup

The project comes pre-configured with shadcn/ui. Verify installation:

```bash
# Check components are installed
ls components/ui/
```

You should see files like:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `table.tsx`
- etc.

### 4.2 Tailwind CSS Configuration

Tailwind is pre-configured. Check `tailwind.config.js` for custom settings.

## 🚀 Step 5: Run the Application

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Muraka Hotels homepage with:
- Hero section
- Search form
- Room types display
- Location information

## 👥 Step 6: Create Test Users

### 6.1 Create Admin User

1. Go to `http://localhost:3000/signup`
2. Create an account with admin privileges:
   - **Email**: `admin@muraka.com`
   - **Password**: `Admin123!@#`
   - **Full Name**: `Admin User`

3. After signup, manually set admin role in Supabase:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE id = 'your-user-id-here';
   ```

### 6.2 Create Test Users for Each Role

Using the admin dashboard or SQL, create:

```sql
-- After creating users through signup, update their roles
UPDATE profiles SET role = 'manager' WHERE email = 'manager@muraka.com';
UPDATE profiles SET role = 'staff' WHERE email = 'staff@muraka.com';
UPDATE profiles SET role = 'guest' WHERE email = 'guest@muraka.com';
```

## 🧪 Step 7: Test Core Functionality

### 7.1 Test Authentication
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Password validation works
- [ ] Redirect to appropriate dashboard

### 7.2 Test Search & Booking
- [ ] Search for rooms
- [ ] Filter by location and dates
- [ ] View search results
- [ ] Complete booking process

### 7.3 Test Role-Based Access
- [ ] Guest dashboard shows bookings
- [ ] Staff dashboard shows operations
- [ ] Manager dashboard shows analytics
- [ ] Admin dashboard shows user management

### 7.4 Test Room Management
- [ ] Staff can update room status
- [ ] Manager can update pricing
- [ ] Booking system respects availability

## 🔧 Step 8: Development Tools Setup

### 8.1 TypeScript Configuration

TypeScript is pre-configured. Check `tsconfig.json` for settings.

### 8.2 ESLint Setup

```bash
# Run linting
npm run lint
```

### 8.3 VS Code Extensions (Recommended)

Install these extensions:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- Auto Rename Tag

## 📊 Step 9: Verify Database Policies

### 9.1 Test Row Level Security

1. Create a test booking as a guest user
2. Try to access it from another user account
3. Verify that access is properly restricted

### 9.2 Test Role Permissions

1. Log in as different user roles
2. Verify each role can only access appropriate features
3. Test middleware redirects work correctly

## 🚨 Troubleshooting

### Common Issues

**Environment Variables Not Loading**
- Restart development server after changing `.env.local`
- Ensure no spaces around `=` in environment variables
- Check file is named exactly `.env.local`

**Supabase Connection Errors**
- Verify project URL and keys are correct
- Check Supabase project is active
- Ensure API keys have proper permissions

**Build Errors**
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

**Database Errors**
- Verify RLS policies are enabled
- Check foreign key constraints
- Ensure user has proper role set in profiles table

### Getting Help

1. Check the README.md for detailed documentation
2. Review code comments for implementation details
3. Check Supabase dashboard for database errors
4. Use browser developer tools to debug frontend issues

## 🚀 Next Steps

Once setup is complete:

1. **Customize branding** - Update colors, logos, and content
2. **Configure production environment** - Set up Vercel, Netlify, or similar
3. **Add payment integration** - Implement Stripe or similar
4. **Set up monitoring** - Add error tracking and analytics
5. **Implement testing** - Add unit and integration tests

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Congratulations!** 🎉 You now have a fully functional hotel management system running locally. The system includes all the core features needed to manage bookings, users, and hotel operations across multiple locations.