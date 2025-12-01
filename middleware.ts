import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.error('Auth error:', error)
    // Continue without user if auth fails
  }

  const { pathname } = request.nextUrl

  // Skip middleware for API routes
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/search']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/search')

  // Auth routes that should redirect to dashboard if user is logged in
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Skip profile queries for auth routes
  if (isAuthRoute) {
    return supabaseResponse
  }

  // Role-based access control for dashboard routes
  if (pathname.startsWith('/dashboard') && user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile query error:', error)
        // If there's an error fetching the profile, redirect to guest dashboard
        return NextResponse.redirect(new URL('/dashboard/guest', request.url))
      }

      const userRole = profile?.role || 'guest'

      // Define role-based route access
      const roleRoutes = {
        guest: ['/dashboard/guest'],
        staff: ['/dashboard/staff', '/dashboard/guest'],
        manager: ['/dashboard/manager', '/dashboard/staff', '/dashboard/guest'],
        admin: ['/dashboard/admin', '/dashboard/manager', '/dashboard/staff', '/dashboard/guest'],
      }

      const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || []

      // Check if the current path is allowed for the user's role
      const isAllowed = allowedRoutes.some(route => pathname.startsWith(route))

      if (!isAllowed) {
        // Redirect to appropriate dashboard based on role
        const defaultRoute = allowedRoutes[0] || '/dashboard/guest'
        return NextResponse.redirect(new URL(defaultRoute, request.url))
      }
    } catch (error) {
      console.error('Middleware error:', error)
      // If there's an error fetching the profile, redirect to guest dashboard
      return NextResponse.redirect(new URL('/dashboard/guest', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
  // Exclude auth routes from full middleware processing
}