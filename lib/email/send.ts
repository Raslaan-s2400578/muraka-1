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

import { resend, isEmailConfigured } from './resend-client'
import { EMAIL_CONFIG } from './config'
import { WelcomeEmail } from './templates/welcome-email'
import { BookingConfirmationEmail } from './templates/booking-confirmation'
import { render } from '@react-email/render'

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  if (!isEmailConfigured()) {
    console.warn('Resend API key not configured - skipping welcome email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const emailHtml = await render(WelcomeEmail({ name, email }))

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Welcome to Muraka Hotels',
      html: emailHtml,
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false, error }
    }

    console.log('Welcome email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmation(
  email: string,
  booking: {
    guestName: string
    bookingId: string
    hotelName: string
    roomNumber: string
    roomType: string
    checkIn: string
    checkOut: string
    numberOfGuests: number
    totalAmount: number
    phone?: string
    specialRequests?: string
  }
) {
  if (!isEmailConfigured()) {
    console.warn('Resend API key not configured - skipping booking confirmation email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const emailHtml = await render(BookingConfirmationEmail(booking))

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Booking Confirmation - ${booking.hotelName}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Failed to send booking confirmation:', error)
      return { success: false, error }
    }

    console.log('Booking confirmation sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

/**
 * Format date for email display
 */
export function formatEmailDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
