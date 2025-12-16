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
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Star, RefreshCw, Mail, Phone, MapPin, Calendar, DollarSign, Search } from 'lucide-react'

interface Customer {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
  booking_count: number
  total_spent: number
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('customers')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin' && profile?.role !== 'staff' && profile?.role !== 'manager') {
        router.push('/dashboard/guest')
        return
      }

      setProfile(profile)
      await loadCustomers()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadCustomers = async () => {
    try {
      setLoading(true)

      // Get all profiles
      const { data: customersData, error: customersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at')
        .order('created_at', { ascending: false })

      if (customersError) {
        console.error('Customers error:', customersError)
        setCustomers([])
        return
      }

      if (!customersData || customersData.length === 0) {
        setCustomers([])
        return
      }

      // Get all bookings with guest_id and total_price
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('guest_id, total_price')

      // Calculate booking stats for each customer
      const bookingStats = new Map<string, { count: number; total: number }>()

      bookingsData?.forEach(booking => {
        const existing = bookingStats.get(booking.guest_id) || { count: 0, total: 0 }
        bookingStats.set(booking.guest_id, {
          count: existing.count + 1,
          total: existing.total + (booking.total_price || 0)
        })
      })

      // Combine customer data with booking stats
      const customersWithStats = customersData.map(customer => ({
        ...customer,
        booking_count: bookingStats.get(customer.id)?.count || 0,
        total_spent: bookingStats.get(customer.id)?.total || 0
      }))

      setCustomers(customersWithStats)
    } catch (err) {
      console.error('Loading error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Stack trace:', err.stack);
      } else {
        console.error('Error details:', JSON.stringify(err, null, 2));
      }
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

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'vip' && customer.role === 'admin') ||
      (typeFilter === 'premium' && customer.role === 'manager') ||
      (typeFilter === 'regular' && customer.role === 'guest')

    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'dashboard') router.push('/dashboard/manager')
          else if (view === 'bookings') router.push('/dashboard/manager/bookings')
          else if (view === 'hotels') router.push('/dashboard/manager/hotels')
          else if (view === 'customers') router.push('/dashboard/manager/customers')
          else if (view === 'payments') router.push('/dashboard/manager/payments')
          else if (view === 'reports') router.push('/dashboard/manager/reports')
        }}
        user={{ name: profile?.full_name || '', role: profile?.role || 'Manager' }}
        onLogout={handleSignOut}
      />

      {/* Main Content */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
              <p className="text-gray-600">Manage customer profiles and track activity</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Add Customer
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">VIP Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.role === 'admin' || c.role === 'manager').length}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">92%</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No customers found</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {customer.full_name}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          ID: {customer.id.slice(0, 8)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {(customer.role === 'admin' || customer.role === 'manager') && (
                          <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                            VIP
                          </Badge>
                        )}
                        {customer.role === 'manager' && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Active Status */}
                    <Badge className="bg-green-100 text-green-700 border-0 mb-4 text-xs">
                      Active
                    </Badge>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{customer.phone || '+1 (555) 000-0000'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>Male, Maldives</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">Bookings</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{customer.booking_count}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-gray-500 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-xs">Total Spent</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          ${customer.total_spent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}