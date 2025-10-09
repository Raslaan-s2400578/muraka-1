'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, TrendingUp, Clock, Star, Download } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

interface MonthlyData {
  month: string
  revenue: number
  bookings: number
  avgRate: number
  growth: number
}

interface HotelOccupancy {
  name: string
  occupancy: number
}

interface RoomTypeDistribution {
  name: string
  percentage: number
  color: string
}

export default function ReportsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('reports')
  const [timeFilter, setTimeFilter] = useState('30days')

  // Analytics data
  const [totalRooms, setTotalRooms] = useState(0)
  const [returningGuests, setReturningGuests] = useState(0)
  const [avgStayDuration, setAvgStayDuration] = useState('0 days')
  const [guestSatisfaction, setGuestSatisfaction] = useState('0/5')
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [hotelOccupancy, setHotelOccupancy] = useState<HotelOccupancy[]>([])
  const [roomTypeDistribution, setRoomTypeDistribution] = useState<RoomTypeDistribution[]>([])

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
      await loadAnalyticsData()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      // Total Rooms
      const { count: roomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
      setTotalRooms(roomsCount || 0)

      // Returning Guests (guests with more than 1 booking)
      const { data: guestBookings } = await supabase
        .from('bookings')
        .select('guest_id')

      const guestCounts = new Map()
      guestBookings?.forEach(b => {
        guestCounts.set(b.guest_id, (guestCounts.get(b.guest_id) || 0) + 1)
      })
      const returning = Array.from(guestCounts.values()).filter(count => count > 1).length
      setReturningGuests(returning)

      // Avg Stay Duration
      const { data: bookings } = await supabase
        .from('bookings')
        .select('check_in, check_out')

      if (bookings && bookings.length > 0) {
        const totalDays = bookings.reduce((sum, b) => {
          const checkIn = new Date(b.check_in)
          const checkOut = new Date(b.check_out)
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0)
        const avgDays = (totalDays / bookings.length).toFixed(1)
        setAvgStayDuration(`${avgDays} days`)
      }

      // Guest Satisfaction (hardcoded for now)
      setGuestSatisfaction('4.8/5')

      // Monthly Performance Data
      await loadMonthlyPerformance()

      // Hotel Occupancy Rates
      await loadHotelOccupancy()

      // Room Type Distribution
      await loadRoomTypeDistribution()

    } catch (err) {
      console.error('Analytics error:', err)
    }
  }

  const loadMonthlyPerformance = async () => {
    const months = ['Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024']
    const monthlyStats: MonthlyData[] = []

    for (let i = 0; i < months.length; i++) {
      const monthStart = new Date(2024, 3 + i, 1).toISOString().split('T')[0]
      const monthEnd = new Date(2024, 4 + i, 0).toISOString().split('T')[0]

      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('total_price')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)

      const revenue = monthBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
      const bookings = monthBookings?.length || 0
      const avgRate = bookings > 0 ? Math.round(revenue / bookings) : 0

      // Calculate growth
      let growth = 0
      if (i > 0 && monthlyStats[i - 1].revenue > 0) {
        growth = ((revenue - monthlyStats[i - 1].revenue) / monthlyStats[i - 1].revenue) * 100
      } else if (i === 0) {
        growth = 12.9 // Default for first month
      }

      monthlyStats.push({
        month: months[i],
        revenue,
        bookings,
        avgRate,
        growth: parseFloat(growth.toFixed(1))
      })
    }

    setMonthlyData(monthlyStats)
  }

  const loadHotelOccupancy = async () => {
    const { data: hotels } = await supabase
      .from('hotels')
      .select('id, name')

    if (!hotels) return

    const today = new Date().toISOString().split('T')[0]
    const occupancyData: HotelOccupancy[] = []

    for (const hotel of hotels) {
      const { count: totalRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id)

      const { data: hotelRooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('hotel_id', hotel.id)

      const roomIds = hotelRooms?.map(r => r.id) || []

      if (roomIds.length > 0) {
        const { data: bookingRooms } = await supabase
          .from('booking_rooms')
          .select('booking_id, room_id')
          .in('room_id', roomIds)

        const bookingIds = [...new Set(bookingRooms?.map(br => br.booking_id) || [])]

        const { data: activeBookings } = await supabase
          .from('bookings')
          .select('id')
          .in('id', bookingIds)
          .lte('check_in', today)
          .gte('check_out', today)
          .neq('status', 'cancelled')

        let occupiedRooms = 0
        if (activeBookings && activeBookings.length > 0) {
          const activeBookingIds = activeBookings.map(b => b.id)
          const { data: activeRooms } = await supabase
            .from('booking_rooms')
            .select('room_id')
            .in('booking_id', activeBookingIds)

          occupiedRooms = activeRooms?.length || 0
        }

        const occupancy = totalRooms && totalRooms > 0
          ? Math.round((occupiedRooms / totalRooms) * 100)
          : 0

        occupancyData.push({
          name: hotel.name.replace('Muraka ', ''),
          occupancy
        })
      }
    }

    setHotelOccupancy(occupancyData)
  }

  const loadRoomTypeDistribution = async () => {
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name')

    if (!roomTypes) return

    const { count: totalRooms } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })

    const distribution: RoomTypeDistribution[] = []
    const colors = ['#60A5FA', '#34D399', '#F87171', '#A78BFA', '#FBBF24'] // Blue, Green, Red, Purple, Yellow

    for (let i = 0; i < roomTypes.length; i++) {
      const roomType = roomTypes[i]
      const { count: typeCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('room_type_id', roomType.id)

      const percentage = totalRooms && totalRooms > 0
        ? Math.round((typeCount || 0) / totalRooms * 100)
        : 0

      distribution.push({
        name: roomType.name,
        percentage,
        color: colors[i % colors.length]
      })
    }

    setRoomTypeDistribution(distribution)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    )
  }

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1)

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
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

      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into your hotel performance</p>
            </div>
            <div className="flex gap-3">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{totalRooms}</p>
                <p className="text-xs text-green-600 font-medium">+15.3%</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Returning Guests</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{returningGuests}</p>
                <p className="text-xs text-green-600 font-medium">+18.7%</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg. Stay Duration</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{avgStayDuration}</p>
                <p className="text-xs text-green-600 font-medium">+0.2</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <Star className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Guest Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{guestSatisfaction}</p>
                <p className="text-xs text-green-600 font-medium">+0.2</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Bookings Trend */}
          <Card className="bg-white shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                $ Revenue & Bookings Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 flex items-end justify-between gap-4">
                {monthlyData.map((data) => {
                  const height = (data.revenue / maxRevenue) * 100
                  return (
                    <div key={data.month} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex items-end h-full">
                        <div
                          className="w-full bg-sky-400 rounded-t-md transition-all hover:bg-sky-500"
                          style={{ height: `${height}%` }}
                          title={`${data.month}: $${data.revenue.toLocaleString()}`}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{data.month.split(' ')[0]}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hotel Occupancy & Room Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hotel Occupancy Rates */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xl">📊</span> Hotel Occupancy Rates
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {hotelOccupancy.map((hotel, index) => (
                    <div key={hotel.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-700">Muraka {hotel.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{hotel.occupancy}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-sky-400' : index === 1 ? 'bg-green-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${hotel.occupancy}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">0/{totalRooms} rooms</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Room Type Distribution */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Room Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  {/* Donut Chart */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {roomTypeDistribution.map((type, index) => {
                        const prevPercentage = roomTypeDistribution
                          .slice(0, index)
                          .reduce((sum, t) => sum + t.percentage, 0)
                        const strokeDasharray = `${type.percentage} ${100 - type.percentage}`
                        const strokeDashoffset = -prevPercentage

                        return (
                          <circle
                            key={type.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={type.color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all"
                          />
                        )
                      })}
                      {/* Inner white circle for donut effect */}
                      <circle cx="50" cy="50" r="30" fill="white" />
                    </svg>
                  </div>
                </div>
                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {roomTypeDistribution.map((type) => (
                    <div key={type.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-xs text-gray-600">
                        {type.name} ({type.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Performance Summary */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Monthly Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Month</TableHead>
                    <TableHead className="font-semibold text-gray-700">Revenue</TableHead>
                    <TableHead className="font-semibold text-gray-700">Bookings</TableHead>
                    <TableHead className="font-semibold text-gray-700">Avg. Rate</TableHead>
                    <TableHead className="font-semibold text-gray-700">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((data) => (
                    <TableRow key={data.month} className="border-b border-gray-100">
                      <TableCell className="font-medium text-gray-900">{data.month}</TableCell>
                      <TableCell className="text-gray-700">${data.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-700">{data.bookings}</TableCell>
                      <TableCell className="text-gray-700">${data.avgRate}</TableCell>
                      <TableCell>
                        <span className={data.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {data.growth >= 0 ? '+' : ''}{data.growth}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
