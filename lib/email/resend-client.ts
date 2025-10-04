import { Resend } from 'resend'

// Use a default test key for development if not set
const apiKey = process.env.RESEND_API_KEY || 're_123456789'

export const resend = new Resend(apiKey)

// Check if API key is configured
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_123456789'
}
