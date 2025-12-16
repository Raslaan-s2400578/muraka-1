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

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchIcon, UsersIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Customer {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
  bookings_count: number
}

export default function StaffCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // Check user profile and permissions
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'staff' && profile?.role !== 'manager' && profile?.role !== 'admin') {
        router.push('/dashboard/guest')
        return
      }

      // Fetch all guest profiles with their booking counts
      let query = supabase
        .from('profiles')
        .select('id, full_name, phone, created_at')
        .eq('role', 'guest')

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      }

      const { data: profilesData, error: profilesError } = await query.order('created_at', { ascending: false })

      if (profilesError) {
        throw profilesError
      }

      // Get booking counts for each customer
      let customersWithCounts: Customer[] = []
      if (profilesData && profilesData.length > 0) {
        const customerIds = profilesData.map(p => p.id)
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('guest_id')
          .in('guest_id', customerIds)

        const bookingCountsMap = new Map<string, number>()
        bookingsData?.forEach(booking => {
          bookingCountsMap.set(booking.guest_id, (bookingCountsMap.get(booking.guest_id) || 0) + 1)
        })

        customersWithCounts = profilesData.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.full_name.includes('@') ? profile.full_name : 'N/A',
          phone: profile.phone || 'No phone',
          created_at: profile.created_at,
          bookings_count: bookingCountsMap.get(profile.id) || 0
        }))
      }

      setCustomers(customersWithCounts)
    } catch (err) {
      console.error('Error loading customers:', err)
      setError('Failed to load customers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Sidebar
        activeView="customers"
        setActiveView={(view) => {
          if (view === 'dashboard') {
            router.push('/dashboard/staff')
          } else {
            router.push(`/dashboard/staff/${view}`)
          }
        }}
        user={{ name: 'Staff', role: 'Staff' }}
        onLogout={handleSignOut}
      />

      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers Management</h1>
            <p className="text-gray-600">View and manage guest information</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                Guest list with booking history ({customers.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customers Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Total Bookings</TableHead>
                    <TableHead className="font-semibold text-gray-700">Member Since</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No customers found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id} className="border-b border-gray-100">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{customer.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-gray-900">{customer.email}</p>
                            <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {customer.bookings_count} {customer.bookings_count === 1 ? 'booking' : 'bookings'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
