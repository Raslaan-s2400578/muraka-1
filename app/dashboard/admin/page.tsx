'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, DollarSign, Building, Users as UsersIcon } from 'lucide-react'

interface Hotel {
  id: string
  name: string
  location: string
  address: string
  created_at: string
}

interface SystemStats {
  total_users: number
  total_bookings: number
  total_revenue: number
  total_rooms: number
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
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
      room_type: string
    }
  }[]
}

interface HotelStats {
  hotel_id: string
  hotel_name: string
  location: string
  occupancy: number
  revenue: number
  total_rooms: number
  occupied_rooms: number
}

export default function AdminDashboard() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [hotelStats, setHotelStats] = useState<HotelStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView] = useState('dashboard')

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
      await loadAdminData()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadAdminData = async () => {
    try {
      setLoading(true)

      // Load hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .order('location')

      if (hotelsError) {
        throw hotelsError
      }

      setHotels(hotelsData || [])

      // Load recent bookings with room types
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          status,
          guest_id,
          hotel_id,
          total_price,
          booking_rooms(
            rooms(
              room_number,
              room_types(name)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (bookingsError) {
        console.error('Bookings error:', bookingsError)
      } else if (bookingsData && bookingsData.length > 0) {
        // Fetch guest and hotel data separately
        const guestIds = [...new Set(bookingsData.map(b => b.guest_id))]
        const hotelIds = [...new Set(bookingsData.map(b => b.hotel_id))]

        const { data: guests } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', guestIds)

        const { data: hotels } = await supabase
          .from('hotels')
          .select('id, name')
          .in('id', hotelIds)

        const guestMap = new Map(guests?.map(g => [g.id, g]) || [])
        const hotelMap = new Map(hotels?.map(h => [h.id, h]) || [])

        const transformedBookings = bookingsData.map((booking: any) => ({
          ...booking,
          guest: guestMap.get(booking.guest_id) || { full_name: 'Unknown' },
          hotel: hotelMap.get(booking.hotel_id) || { name: 'Unknown' },
          booking_rooms: booking.booking_rooms?.map((br: any) => ({
            room: {
              room_number: br.rooms?.room_number || 'Unknown',
              room_type: br.rooms?.room_types?.name || 'Unknown'
            }
          })) || []
        }))

        setRecentBookings(transformedBookings)
      }

      // Load system statistics
      await loadSystemStats()

      // Load hotel performance stats
      await loadHotelStats()
    } catch (err) {
      console.error('Loading error:', err);
if (err instanceof Error) {
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
} else {
  console.error('Error details:', JSON.stringify(err, null, 2));
}
      setError('Failed to load admin dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get booking count and revenue
      const { data: bookingsData, count: bookingCount } = await supabase
        .from('bookings')
        .select('total_price', { count: 'exact' })

      // Get room count
      const { count: roomCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })

      const totalRevenue = bookingsData?.reduce((sum, booking) => sum + booking.total_price, 0) || 0

      setSystemStats({
        total_users: userCount || 0,
        total_bookings: bookingCount || 0,
        total_revenue: totalRevenue,
        total_rooms: roomCount || 0
      })
    } catch (err) {
      console.error('Stats error:', err)
    }
  }

  const loadHotelStats = async () => {
    try {
      const { data: hotelsData } = await supabase
        .from('hotels')
        .select('id, name, location')

      if (!hotelsData) return

      const stats: HotelStats[] = []
      const today = new Date().toISOString().split('T')[0]

      for (const hotel of hotelsData) {
        // Get total rooms for this hotel
        const { count: totalRooms } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', hotel.id)

        // Get active bookings for this hotel (currently ongoing - check_in <= today <= check_out)
        const { data: activeBookings } = await supabase
          .from('bookings')
          .select('id, total_price, booking_rooms(room_id)')
          .eq('hotel_id', hotel.id)
          .lte('check_in', today)
          .gte('check_out', today)
          .neq('status', 'cancelled')

        // Get all confirmed/completed bookings revenue for this hotel
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('hotel_id', hotel.id)
          .in('status', ['confirmed', 'checked_in', 'checked_out'])

        const occupiedRooms = activeBookings?.reduce((count, booking: any) => {
          return count + (booking.booking_rooms?.length || 0)
        }, 0) || 0

        const revenue = allBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

        const occupancy = totalRooms && totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

        stats.push({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          location: hotel.location,
          occupancy,
          revenue,
          total_rooms: totalRooms || 0,
          occupied_rooms: occupiedRooms
        })
      }

      setHotelStats(stats)
    } catch (err) {
      console.error('Hotel stats error:', err)
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
          <p>Loading admin dashboard...</p>
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
          if (view === 'dashboard') router.push('/dashboard/admin')
          else if (view === 'bookings') router.push('/dashboard/admin/bookings')
          else if (view === 'hotels') router.push('/dashboard/admin/hotels')
          else if (view === 'customers') router.push('/dashboard/admin/customers')
          else if (view === 'payments') router.push('/dashboard/admin/payments')
          else if (view === 'reports') router.push('/dashboard/admin/reports')
        }}
        user={{ name: profile?.full_name || '', role: 'Admin' }}
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
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats?.total_bookings || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${systemStats?.total_revenue.toLocaleString() || '0'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {hotelStats.length > 0
                    ? Math.round(hotelStats.reduce((sum, h) => sum + h.occupancy, 0) / hotelStats.length)
                    : 0}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Active Guests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStats?.total_users || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <p className="text-xs text-gray-400">
                            {booking.booking_rooms[0]?.room.room_type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                          className={booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-0' : 'bg-yellow-100 text-yellow-700 border-0'}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hotel Performance */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Hotel Performance</CardTitle>
                <CardDescription>Occupancy and revenue by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotelStats.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No hotel data available</p>
                  ) : (
                    hotelStats.map((hotel) => (
                      <div key={hotel.hotel_id} className="py-3 border-b last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{hotel.hotel_name}</p>
                            <p className="text-xs text-gray-500">{hotel.location} Atoll</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Occupancy</p>
                            <p className="font-semibold text-gray-900">{hotel.occupancy}%</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {hotel.occupied_rooms}/{hotel.total_rooms} rooms
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Revenue</p>
                            <p className="font-semibold text-gray-900">
                              ${hotel.revenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}