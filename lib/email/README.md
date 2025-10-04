# Muraka Hotels - Email Service

This directory contains the email service implementation using Resend for all transactional emails.

## Setup

### 1. Install Dependencies (Already Done)
```bash
npm install resend @react-email/components @react-email/render
```

### 2. Get Your Resend API Key

1. Go to [Resend](https://resend.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `re_`)

### 3. Update Environment Variables

Edit `.env.local` and replace the placeholder:

```env
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=Muraka Hotels <onboarding@resend.dev>
```

**For Production:**
```env
RESEND_FROM_EMAIL=Muraka Hotels <noreply@yourdomain.com>
```

### 4. Verify Domain (Production Only)

For production, you need to verify your domain in Resend:
1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add the DNS records they provide
4. Wait for verification

**For Testing:** Use `onboarding@resend.dev` (no domain verification needed)

## Testing Emails

### Test via API Endpoint

Visit these URLs in your browser:

```
# Test welcome email
http://localhost:3000/api/test-email?type=welcome&email=your@email.com

# Test booking confirmation
http://localhost:3000/api/test-email?type=booking&email=your@email.com
```

### Test in Development

1. Create a booking through the booking flow
2. Sign up for a new account
3. Check your email inbox

## Email Templates

### Available Templates

- **Welcome Email** (`welcome-email.tsx`) - Sent when users sign up
- **Booking Confirmation** (`booking-confirmation.tsx`) - Sent when bookings are created
- **Base Template** (`base.tsx`) - Shared layout for all emails

### Creating New Templates

```typescript
// lib/email/templates/your-template.tsx
import * as React from 'react'
import { Heading, Text, Link } from '@react-email/components'
import { BaseEmail } from './base'
import { EMAIL_CONFIG } from '../config'

interface YourTemplateProps {
  name: string
}

export function YourTemplate({ name }: YourTemplateProps) {
  return (
    <BaseEmail previewText="Your preview text">
      <Heading className="text-2xl font-bold">Hello {name}!</Heading>
      <Text>Your email content here</Text>
    </BaseEmail>
  )
}
```

### Add to Service

```typescript
// lib/email/send.ts
export async function sendYourEmail(email: string, name: string) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: email,
    subject: 'Your Subject',
    react: YourTemplate({ name }),
  })

  return { success: !error, data, error }
}
```

## Usage in Code

### Async Pattern (Recommended)

Never block user flows waiting for emails:

```typescript
// ✅ Good - Don't await, fire and forget
const handleBooking = async () => {
  const booking = await createBooking()

  // Send email async, don't block
  sendBookingConfirmation(user.email, booking)
    .catch(err => console.error('Email failed:', err))

  router.push('/success')
}
```

### Import Pattern

Use dynamic imports to reduce bundle size:

```typescript
const sendEmail = async () => {
  const { sendWelcomeEmail } = await import('@/lib/email/send')
  await sendWelcomeEmail(email, name)
}
```

## Email Styling

All templates use **Tailwind CSS** classes. The following are supported:

### Text Styles
- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- `font-bold`, `font-semibold`
- `text-gray-600`, `text-gray-900`

### Spacing
- `mb-4`, `mt-6`, `p-5`, `px-6`, `py-3`

### Layout
- `rounded-lg`, `bg-gray-50`
- `text-center`

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   # Verify key is set
   echo $RESEND_API_KEY
   ```

2. **Check Console Logs**
   Look for errors in your terminal or browser console

3. **Test Endpoint**
   Visit `/api/test-email?type=welcome&email=your@email.com`

### Emails Going to Spam

1. **Use verified domain** (not onboarding@resend.dev)
2. **Add SPF/DKIM records** in Resend dashboard
3. **Don't send too many emails** in short period

### Rate Limits

Resend free tier:
- 100 emails/day
- 3,000 emails/month

For production, upgrade to paid plan.

## Security

- ✅ Never expose API key in client-side code
- ✅ API key is only in `.env.local` (server-side)
- ✅ Email sending only happens on server
- ✅ `.env.local` is in `.gitignore`

## Production Checklist

- [ ] Replace API key with production key
- [ ] Verify your domain in Resend
- [ ] Update `RESEND_FROM_EMAIL` to use your domain
- [ ] Test all email templates
- [ ] Set up email monitoring
- [ ] Configure retry logic if needed
- [ ] Review rate limits and upgrade plan if needed

## Support

- Resend Docs: https://resend.com/docs
- React Email Docs: https://react.email
- Muraka Support: support@muraka-hotels.com
