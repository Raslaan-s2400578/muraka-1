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

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}