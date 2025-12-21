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
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all auth routes without any checks
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/signup') || 
      pathname === '/') {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in and trying to access dashboard, redirect to login
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in, fetch profile for role-based routing
  if (user && pathname.startsWith('/dashboard')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const roleRoutes: Record<string, string> = {
          admin: '/dashboard/admin',
          manager: '/dashboard/manager',
          staff: '/dashboard/staff',
          guest: '/dashboard/guest',
        }

        const expectedRoute = roleRoutes[profile.role]
        
        // Only redirect if they're on the wrong dashboard
        if (expectedRoute && !pathname.startsWith(expectedRoute)) {
          const url = request.nextUrl.clone()
          url.pathname = expectedRoute
          return NextResponse.redirect(url)
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      // Don't block the request if profile fetch fails
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}