/**
 * Script to check and update your user role to admin
 * Run this with: npx tsx scripts/check-user-role.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndUpdateUserRole() {
  try {
    console.log('Fetching current user...')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ No user logged in or error:', userError)
      console.log('\n📝 Please login first by visiting your app and signing in')
      return
    }

    console.log('✅ Found user:', user.email)
    console.log('User ID:', user.id)

    // Check current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      return
    }

    console.log('\n📊 Current Profile:')
    console.log('Name:', profile.full_name)
    console.log('Role:', profile.role)
    console.log('Phone:', profile.phone)

    if (profile.role === 'admin') {
      console.log('\n✅ You already have admin role!')
      return
    }

    // Update to admin
    console.log('\n🔄 Updating role to admin...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating role:', updateError)
      return
    }

    console.log('✅ Successfully updated role to admin!')
    console.log('\n🎉 You can now access the admin dashboard at /dashboard/admin')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAndUpdateUserRole()