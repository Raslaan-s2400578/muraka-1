import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    console.log('bookings-data API called')

    // Create admin client with service role key for privileged access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Missing Supabase credentials', profiles: [], hotels: [], roomTypes: [] },
        { status: 200 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    console.log('Fetching profiles...')
    // Fetch all profiles (using service role for full access)
    // First try the normal way
    let profilesData: any[] = []
    const { data, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, role')

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError)
      // Try fetching from auth.users as fallback
      try {
        const { data: authData } = await adminSupabase.auth.admin.listUsers()
        if (authData?.users) {
          profilesData = authData.users.map(u => ({
            id: u.id,
            full_name: u.user_metadata?.full_name || u.email || 'Unknown',
            email: u.email,
            role: u.user_metadata?.role || 'guest'
          }))
          console.log('Profiles from auth.users:', profilesData.length)
        }
      } catch (authError) {
        console.error('Auth users fetch error:', authError)
      }
    } else {
      profilesData = data || []
      console.log('Profiles fetched:', profilesData.length)
    }

    console.log('Fetching hotels...')
    // Fetch all hotels
    const { data: hotelsData, error: hotelsError } = await adminSupabase
      .from('hotels')
      .select('id, name, location')

    if (hotelsError) {
      console.error('Hotels fetch error:', hotelsError)
    } else {
      console.log('Hotels fetched:', hotelsData?.length)
    }

    console.log('Fetching room types...')
    // Fetch room types
    const { data: roomTypesData, error: roomTypesError } = await adminSupabase
      .from('room_types')
      .select('id, name')

    if (roomTypesError) {
      console.error('Room types fetch error:', roomTypesError)
    } else {
      console.log('Room types fetched:', roomTypesData?.length)
    }

    if (profilesData && profilesData.length > 0) {
      console.log('Sample profiles:', profilesData.slice(0, 3).map(p => ({ id: p.id, name: p.full_name })))
    }

    return NextResponse.json({
      profiles: profilesData || [],
      hotels: hotelsData || [],
      roomTypes: roomTypesData || []
    })
  } catch (error: any) {
    console.error('Bookings data API error:', error)
    return NextResponse.json(
      { error: error.message, profiles: [], hotels: [], roomTypes: [] },
      { status: 200 }
    )
  }
}
