export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'Muraka Hotels <onboarding@resend.dev>',
  replyTo: 'support@muraka-hotels.com',
  brandColor: '#9333ea', // Purple from your theme
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const
