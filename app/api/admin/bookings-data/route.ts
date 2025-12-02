import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    // Fetch all profiles from profiles table
    const { data: profilesTableData, error: profilesTableError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, role')

    let profilesData: any[] = []

    if (profilesTableError) {
      console.error('Profiles table fetch error:', profilesTableError)
    } else {
      profilesData = profilesTableData || []
      console.log('Profiles from table:', profilesData.length)
    }

    // Fetch emails from auth.users and merge with profile data
    try {
      const { data: authData } = await adminSupabase.auth.admin.listUsers()
      if (authData?.users) {
        const emailMap = new Map(authData.users.map(u => [u.id, u.email || 'N/A']))
        profilesData = profilesData.map(p => ({
          ...p,
          email: emailMap.get(p.id) || 'N/A'
        }))
        console.log('Added emails to profiles, total:', profilesData.length)
      }
    } catch (authError) {
      console.error('Failed to fetch emails from auth:', authError)
      // Add placeholder emails if auth fetch fails
      profilesData = profilesData.map(p => ({
        ...p,
        email: 'N/A'
      }))
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
