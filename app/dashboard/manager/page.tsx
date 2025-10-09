'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3Icon, TrendingUpIcon, UsersIcon, DollarSignIcon, CalendarIcon, HotelIcon } from 'lucide-react'

interface RevenueData {
  total_revenue: number
  booking_count: number
  avg_booking_value: number
}

interface OccupancyData {
  total_rooms: number
  occupied_rooms: number
  available_rooms: number
  cleaning_rooms: number
  out_of_service_rooms: number
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

interface RoomType {
  id: string
  name: string
  capacity: number
  price_off_peak: number
  price_peak: number
  hotel: {
    name: string
    location: string
  }
}

interface RecentBooking {
  id: string
  check_in: string
  check_out: string
  status: string
  guest: {
    full_name: string
  }
  hotel: {
    name: string
  }
  booking_rooms: {
    room: {
      room_number: string
    }
  }[]
}

export default function ManagerDashboard() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  useEffect(() => {
    if (profile) {
      loadAnalyticsData()
    }
  }, [selectedPeriod, profile])

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

      if (profile?.role !== 'manager' && profile?.role !== 'admin') {
        router.push('/dashboard/guest')
        return
      }

      setProfile(profile)
      await loadInitialData()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Load room types for rate management
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select(`
          *,
          hotel:hotels(name, location)
        `)
        .order('name', { ascending: true })

      if (roomTypesError) {
        throw roomTypesError
      }

      setRoomTypes(roomTypesData || [])

      // Load recent bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          status,
          guest:profiles!bookings_guest_id_fkey(full_name),
          hotel:hotels(name),
          booking_rooms(
            room:rooms(room_number)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (bookingsError) {
        console.error('Bookings error:', bookingsError)
      } else {
        // Transform booking data to match interface
        const transformedBookings = (bookingsData || []).map(booking => ({
          id: booking.id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          status: booking.status,
          guest: Array.isArray(booking.guest) && booking.guest.length > 0
            ? { full_name: booking.guest[0].full_name }
            : { full_name: 'Unknown Guest' },
          hotel: Array.isArray(booking.hotel) && booking.hotel.length > 0
            ? { name: booking.hotel[0].name }
            : { name: 'Unknown Hotel' },
          booking_rooms: booking.booking_rooms.map(br => ({
            room: Array.isArray(br.room) && br.room.length > 0
              ? { room_number: br.room[0].room_number }
              : { room_number: 'N/A' }
          }))
        }))
        setRecentBookings(transformedBookings)
      }

      // Load occupancy data
      await loadOccupancyData()
    } catch (err) {
      console.error('Loading error:', err);
if (err instanceof Error) {
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
} else {
  console.error('Error details:', JSON.stringify(err, null, 2));
}
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadOccupancyData = async () => {
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('status')

      if (roomsError) {
        throw roomsError
      }

      const occupancy = {
        total_rooms: roomsData?.length || 0,
        occupied_rooms: roomsData?.filter(r => r.status === 'Occupied').length || 0,
        available_rooms: roomsData?.filter(r => r.status === 'Available').length || 0,
        cleaning_rooms: roomsData?.filter(r => r.status === 'Cleaning').length || 0,
        out_of_service_rooms: roomsData?.filter(r => r.status === 'Out of Service').length || 0
      }

      setOccupancyData(occupancy)
    } catch (err) {
      console.error('Occupancy error:', err)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      let startDate: string
      const endDate = new Date().toISOString().split('T')[0]

      switch (selectedPeriod) {
        case 'this_week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          startDate = weekAgo.toISOString().split('T')[0]
          break
        case 'this_month':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          startDate = monthAgo.toISOString().split('T')[0]
          break
        case 'this_year':
          const yearAgo = new Date()
          yearAgo.setFullYear(yearAgo.getFullYear() - 1)
          startDate = yearAgo.toISOString().split('T')[0]
          break
        default:
          startDate = new Date().toISOString().split('T')[0]
      }

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_price, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', ['confirmed', 'checked_in', 'checked_out'])

      if (bookingsError) {
        throw bookingsError
      }

      const totalRevenue = bookingsData?.reduce((sum, booking) => sum + booking.total_price, 0) || 0
      const bookingCount = bookingsData?.length || 0
      const avgBookingValue = bookingCount > 0 ? totalRevenue / bookingCount : 0

      setRevenueData({
        total_revenue: totalRevenue,
        booking_count: bookingCount,
        avg_booking_value: avgBookingValue
      })
    } catch (err) {
      console.error('Analytics error:', err)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const updateRoomRate = async (roomTypeId: string, field: 'price_off_peak' | 'price_peak', value: number) => {
    try {
      const { error } = await supabase
        .from('room_types')
        .update({ [field]: value })
        .eq('id', roomTypeId)

      if (error) {
        throw error
      }

      // Refresh room types data
      await loadInitialData()
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update room rate')
    }
  }

  const getOccupancyPercentage = () => {
    if (!occupancyData || occupancyData.total_rooms === 0) return 0
    return Math.round((occupancyData.occupied_rooms / occupancyData.total_rooms) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading manager dashboard...</p>
        </div>
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          

          // Dashboard = stay on manager page, just update active state
          if (view === 'dashboard') {
            
            setActiveView(view)
          }
          // Other views = navigate to admin pages
          else if (view === 'bookings') {
            
            router.push('/dashboard/manager/bookings')
          }
          else if (view === 'hotels') {
            
            router.push('/dashboard/manager/hotels')
          }
          else if (view === 'customers') {
            
            router.push('/dashboard/manager/customers')
          }
          else if (view === 'payments') {
            
            router.push('/dashboard/manager/payments')
          }
          else if (view === 'reports') {
            
            router.push('/dashboard/manager/reports')
          }
          else {
            
            setActiveView(view)
          }
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
              <p className="text-gray-600">Here's what's happening with your hotels today</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{currentDate}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {revenueData?.booking_count || 0}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <DollarSignIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ${revenueData?.total_revenue.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <HotelIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {getOccupancyPercentage()}%
                </p>
                <p className="text-xs text-green-600 font-medium">
                  +3.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <TrendingUpIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg Booking Value</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ${Math.round(revenueData?.avg_booking_value || 0).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  +5.4% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Bookings */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Bookings</CardTitle>
                <CardDescription>Latest reservation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No recent bookings</p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{booking.guest.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {booking.hotel.name} - Room {booking.booking_rooms[0]?.room.room_number}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                          className={booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Report */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Occupancy Report</CardTitle>
                <CardDescription>Current room status across properties</CardDescription>
              </CardHeader>
              <CardContent>
                {occupancyData && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">Total Rooms</span>
                      <span className="font-semibold text-gray-900">{occupancyData.total_rooms}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">Occupied</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{occupancyData.occupied_rooms}</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-700">{getOccupancyPercentage()}%</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">Available</span>
                      <span className="font-semibold text-green-600">{occupancyData.available_rooms}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-sm text-gray-600">Cleaning</span>
                      <span className="font-semibold text-orange-600">{occupancyData.cleaning_rooms}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Out of Service</span>
                      <span className="font-semibold text-red-600">{occupancyData.out_of_service_rooms}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="rates">Room Rate Management</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Occupancy Report */}
              <Card>
                <CardHeader>
                  <CardTitle>Occupancy Report</CardTitle>
                  <CardDescription>
                    Current room status across all properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {occupancyData && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Rooms</span>
                        <span className="font-semibold">{occupancyData.total_rooms}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Occupied</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{occupancyData.occupied_rooms}</span>
                          <Badge variant="default">{getOccupancyPercentage()}%</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Available</span>
                        <span className="font-semibold text-green-600">{occupancyData.available_rooms}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cleaning</span>
                        <span className="font-semibold text-orange-600">{occupancyData.cleaning_rooms}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Out of Service</span>
                        <span className="font-semibold text-red-600">{occupancyData.out_of_service_rooms}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>
                    Financial performance for selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueData && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <BarChart3Icon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-2">Revenue Trend</p>
                        <p className="text-lg text-gray-500">
                          Visual analytics to be implemented with charting library
                        </p>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600">Total Bookings</p>
                            <p className="text-xl font-bold">{revenueData.booking_count}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Avg. Value</p>
                            <p className="text-xl font-bold">${Math.round(revenueData.avg_booking_value)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <CardTitle>Room Rate Management</CardTitle>
                <CardDescription>
                  Update pricing for different room types and seasons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Off-Peak Price</TableHead>
                      <TableHead>Peak Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((roomType) => (
                      <TableRow key={roomType.id}>
                        <TableCell className="font-medium">
                          {roomType.name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{roomType.hotel.name}</p>
                            <p className="text-sm text-gray-500">{roomType.hotel.location}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {roomType.capacity} guests
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>$</span>
                            <Input
                              type="number"
                              value={roomType.price_off_peak}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value)
                                if (!isNaN(value)) {
                                  updateRoomRate(roomType.id, 'price_off_peak', value)
                                }
                              }}
                              className="w-20"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>$</span>
                            <Input
                              type="number"
                              value={roomType.price_peak}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value)
                                if (!isNaN(value)) {
                                  updateRoomRate(roomType.id, 'price_peak', value)
                                }
                              }}
                              className="w-20"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Manage staff accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Staff management interface</p>
                  <p className="text-sm text-gray-400">
                    Feature to be implemented: Create staff accounts, assign roles, manage permissions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
