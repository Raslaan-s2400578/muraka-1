'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

export default function ManagerDashboard() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
        .order('hotel.location')

      if (roomTypesError) {
        throw roomTypesError
      }

      setRoomTypes(roomTypesData || [])

      // Load occupancy data
      await loadOccupancyData()
    } catch (err) {
      console.error('Loading error:', err)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Muraka Hotels</h1>
              <Badge className="ml-4">Manager Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.full_name}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h2>
          <p className="text-gray-600">Monitor performance and manage hotel operations</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Period Selector */}
        <div className="mb-6">
          <Label htmlFor="period" className="text-sm font-medium mb-2 block">
            Analytics Period
          </Label>
          <select
            id="period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${revenueData?.total_revenue.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSignIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bookings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {revenueData?.booking_count || 0}
                  </p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Booking Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${Math.round(revenueData?.avg_booking_value || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUpIcon className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {getOccupancyPercentage()}%
                  </p>
                </div>
                <HotelIcon className="w-8 h-8 text-orange-600" />
              </div>
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
  )
}