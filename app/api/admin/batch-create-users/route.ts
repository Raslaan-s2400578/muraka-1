import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

interface UserToCreate {
  email: string
  full_name: string
  role: 'guest' | 'staff' | 'manager' | 'admin'
  password: string
}

export async function POST(request: Request) {
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { users } = await request.json()

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of users to create' },
        { status: 400 }
      )
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    }

    // Create each user
    for (const user of users) {
      try {
        // Validate required fields
        if (!user.email || !user.full_name || !user.password || !user.role) {
          results.failed++
          results.errors.push({
            email: user.email || 'unknown',
            error: 'Missing required fields (email, full_name, password, role)'
          })
          continue
        }

        // Validate password length
        if (user.password.length < 6) {
          results.failed++
          results.errors.push({
            email: user.email,
            error: 'Password must be at least 6 characters'
          })
          continue
        }

        // Validate role
        if (!['guest', 'staff', 'manager', 'admin'].includes(user.role)) {
          results.failed++
          results.errors.push({
            email: user.email,
            error: 'Invalid role. Must be: guest, staff, manager, or admin'
          })
          continue
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role
          }
        })

        if (authError) {
          results.failed++
          results.errors.push({
            email: user.email,
            error: authError.message
          })
          continue
        }

        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 100))

        results.created++
      } catch (err: any) {
        results.failed++
        results.errors.push({
          email: user.email || 'unknown',
          error: err.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: results.created > 0,
      message: `Created ${results.created} users, ${results.failed} failed`,
      ...results
    })
  } catch (error: any) {
    console.error('Batch create users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to batch create users' },
      { status: 500 }
    )
  }
}
