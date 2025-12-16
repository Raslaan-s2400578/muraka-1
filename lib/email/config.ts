/**
 * Hotel Management System - Muraka
 * 
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 * 
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'Muraka Hotels <onboarding@resend.dev>',
  replyTo: 'support@muraka-hotels.com',
  brandColor: '#9333ea', // Purple from your theme
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const
