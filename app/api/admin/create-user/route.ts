import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json(
        { error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 500 }
      )
    }

    // Initialize Supabase Admin client
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

    const { email, password, full_name, nid, role } = await request.json()

    console.log('Creating user with:', { email, full_name, nid, role })

    // Validate required fields
    if (!email || !password || !full_name || !nid || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['staff', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if NID already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('nid', nid)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'A user with this NID already exists' },
        { status: 400 }
      )
    }

    // Create auth user using admin API
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        nid,
        role
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the profile with NID and role (profile is auto-created by trigger)
    console.log('Updating profile with NID and role...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nid,
        role
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      console.error('Profile error details:', JSON.stringify(profileError, null, 2))

      // Rollback: delete auth user if profile update fails
      console.log('Rolling back auth user...')
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: `Failed to update user profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    console.log('Profile updated successfully')

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name,
        nid,
        role
      }
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
