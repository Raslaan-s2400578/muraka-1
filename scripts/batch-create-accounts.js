#!/usr/bin/env node

/**
 * Batch Create Accounts Script
 *
 * Creates multiple user accounts at once via the API
 * Usage: node scripts/batch-create-accounts.js [type]
 *
 * Types:
 *   - guests    : Create all 20 guest accounts
 *   - staff     : Create additional 4 staff members
 *   - managers  : Create 2 manager accounts
 *   - all       : Create guests + staff + managers
 */

const accounts = {
  managers: [
    { email: 'sara.manager@muraka.dev', full_name: 'Sara Hassan', role: 'manager', password: 'Welcome@123' },
    { email: 'amira.manager@muraka.dev', full_name: 'Amira Abdullah', role: 'manager', password: 'Welcome@123' }
  ],
  staff: [
    { email: 'aisha.staff@muraka.dev', full_name: 'Aisha Ahmed', role: 'staff', password: 'Welcome@123' },
    { email: 'hassan.staff@muraka.dev', full_name: 'Hassan Omar', role: 'staff', password: 'Welcome@123' },
    { email: 'layla.staff@muraka.dev', full_name: 'Layla Ibrahim', role: 'staff', password: 'Welcome@123' },
    { email: 'omar.staff@muraka.dev', full_name: 'Omar Khalil', role: 'staff', password: 'Welcome@123' }
  ],
  guests: [
    { email: 'ali@muraka.dev', full_name: 'Ali Mohammed', role: 'guest', password: 'Welcome@123' },
    { email: 'sara.guest@muraka.dev', full_name: 'Sara Abdullah', role: 'guest', password: 'Welcome@123' },
    { email: 'noor@muraka.dev', full_name: 'Noor Hassan', role: 'guest', password: 'Welcome@123' },
    { email: 'zainab@muraka.dev', full_name: 'Zainab Ahmed', role: 'guest', password: 'Welcome@123' },
    { email: 'karim@muraka.dev', full_name: 'Karim Ibrahim', role: 'guest', password: 'Welcome@123' },
    { email: 'dina@muraka.dev', full_name: 'Dina Saleh', role: 'guest', password: 'Welcome@123' },
    { email: 'rashid@muraka.dev', full_name: 'Rashid Ahmed', role: 'guest', password: 'Welcome@123' },
    { email: 'hana@muraka.dev', full_name: 'Hana Ibrahim', role: 'guest', password: 'Welcome@123' },
    { email: 'tariq@muraka.dev', full_name: 'Tariq Hassan', role: 'guest', password: 'Welcome@123' },
    { email: 'leila@muraka.dev', full_name: 'Leila Ahmed', role: 'guest', password: 'Welcome@123' },
    { email: 'amina@muraka.dev', full_name: 'Amina Fatima', role: 'guest', password: 'Welcome@123' },
    { email: 'hassan.guest@muraka.dev', full_name: 'Hassan Mohammed', role: 'guest', password: 'Welcome@123' },
    { email: 'fatima.guest@muraka.dev', full_name: 'Fatima Ibrahim', role: 'guest', password: 'Welcome@123' },
    { email: 'youssef@muraka.dev', full_name: 'Youssef Ahmed', role: 'guest', password: 'Welcome@123' },
    { email: 'layla.guest@muraka.dev', full_name: 'Layla Hassan', role: 'guest', password: 'Welcome@123' },
    { email: 'maryam@muraka.dev', full_name: 'Maryam Abdullah', role: 'guest', password: 'Welcome@123' },
    { email: 'ahmed.guest@muraka.dev', full_name: 'Ahmed Khalil', role: 'guest', password: 'Welcome@123' },
    { email: 'nadia@muraka.dev', full_name: 'Nadia Hassan', role: 'guest', password: 'Welcome@123' },
    { email: 'jamal@muraka.dev', full_name: 'Jamal Ibrahim', role: 'guest', password: 'Welcome@123' },
    { email: 'maya@muraka.dev', full_name: 'Maya Ahmed', role: 'guest', password: 'Welcome@123' }
  ]
}

const type = process.argv[2] || 'all'
const baseUrl = process.argv[3] || 'http://localhost:3000'

let usersToCreate = []

if (type === 'all') {
  usersToCreate = [...accounts.managers, ...accounts.staff, ...accounts.guests]
} else if (type === 'guests') {
  usersToCreate = accounts.guests
} else if (type === 'staff') {
  usersToCreate = accounts.staff
} else if (type === 'managers') {
  usersToCreate = accounts.managers
} else {
  console.error(`Invalid type: ${type}`)
  console.log('Usage: node scripts/batch-create-accounts.js [guests|staff|managers|all]')
  process.exit(1)
}

async function batchCreateAccounts() {
  try {
    console.log(`🚀 Creating ${usersToCreate.length} ${type} accounts...`)
    console.log(`📍 Target: ${baseUrl}/api/admin/batch-create-users`)

    const response = await fetch(`${baseUrl}/api/admin/batch-create-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        users: usersToCreate
      })
    })

    const result = await response.json()

    if (result.success || result.created > 0) {
      console.log(`✅ Success!`)
      console.log(`   Created: ${result.created} accounts`)
      console.log(`   Failed: ${result.failed} accounts`)

      if (result.errors && result.errors.length > 0) {
        console.log(`\n⚠️  Errors:`)
        result.errors.forEach((err) => {
          console.log(`   - ${err.email}: ${err.error}`)
        })
      }
    } else {
      console.error(`❌ Failed to create accounts`)
      console.error(result)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

batchCreateAccounts()
