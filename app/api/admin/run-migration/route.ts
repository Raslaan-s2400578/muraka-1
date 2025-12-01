import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Create admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('Running migration: Adding num_guests, phone, special_requests to bookings table')

    // Execute the migration using raw SQL
    // Note: Supabase JavaScript client doesn't have direct SQL execution
    // We need to use the service role to execute this
    const { data, error } = await supabase.rpc('exec', {
      query: `
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS special_requests TEXT;
      `
    })

    if (error) {
      // RPC might not exist, log the error but provide instructions
      console.error('RPC Error:', error)

      return NextResponse.json(
        {
          status: 'needs_manual_execution',
          message: 'Migration requires manual SQL execution in Supabase dashboard',
          sql: `ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT;`,
          instructions: 'Go to Supabase Dashboard > SQL Editor and run the provided SQL'
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: 'Migration executed successfully',
      data
    })
  } catch (error: any) {
    console.error('Migration error:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        message: 'Please run the migration manually in Supabase dashboard',
        sql: `ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1 CHECK (num_guests > 0),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT;`
      },
      { status: 200 }
    )
  }
}
