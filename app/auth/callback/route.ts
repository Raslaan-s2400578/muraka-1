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

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle OAuth/email confirmation errors
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error_description || error)}`,
        request.url
      )
    )
  }

  // Handle successful callback with code
  if (code) {
    const supabase = await createClient()

    try {
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(exchangeError.message)}`,
            request.url
          )
        )
      }

      // Session established, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('An error occurred during authentication')}`,
          request.url
        )
      )
    }
  }

  // No code or error provided
  return NextResponse.redirect(new URL('/login', request.url))
}
