'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export default function StaffBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return null
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'staff' && profile?.role !== 'manager' && profile?.role !== 'admin') {
        router.push('/dashboard/guest')
        return null
      }

      return profile
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch bookings with React Query
  const { data: bookingsData, isLoading, error } = useBookings({
    page,
    pageSize: 20,
    status: statusFilter,
    searchTerm,
  })

  const updateBookingMutation = useUpdateBookingStatus()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const handleStatusUpdate = (bookingId: string, newStatus: string) => {
    updateBookingMutation.mutate({ bookingId, status: newStatus })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'default',
      checked_in: 'outline',
      checked_out: 'outline',
      pending: 'secondary',
      cancelled: 'destructive',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (isLoading || !profile) {
    return null // Loading handled by loading.tsx
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Sidebar
        activeView="bookings"
        setActiveView={(view) => {
          if (view === 'dashboard') {
            router.push('/dashboard/staff')
          } else if (view === 'bookings') {
            router.push('/dashboard/staff/bookings')
          } else if (view === 'hotels') {
            router.push('/dashboard/staff/hotels')
          } else if (view === 'customers') {
            router.push('/dashboard/staff/customers')
          } else if (view === 'payments') {
            router.push('/dashboard/staff/payments')
          } else if (view === 'reports') {
            router.push('/dashboard/staff/reports')
          }
        }}
        user={{ name: profile.full_name || '', role: 'Staff' }}
        onLogout={handleSignOut}
      />

      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings Management</h1>
            <p className="text-gray-600">View and manage all hotel bookings</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Failed to load bookings. Please try again.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                Manage bookings across all hotels ({bookingsData?.total || 0} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by guest name, booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bookings Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Booking ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Guest</TableHead>
                    <TableHead className="font-semibold text-gray-700">Hotel & Room</TableHead>
                    <TableHead className="font-semibold text-gray-700">Dates</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingsData?.bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookingsData?.bookings.map((booking) => (
                      <TableRow key={booking.id} className="border-b border-gray-100">
                        <TableCell className="font-mono text-sm text-gray-900">
                          #{booking.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{booking.guest.full_name}</p>
                            <p className="text-sm text-gray-500">{booking.guest.phone || 'No phone'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{booking.hotel.name}</p>
                            <p className="text-sm text-gray-500">
                              {booking.booking_rooms[0] ? `Room ${booking.booking_rooms[0].room.room_number}` : 'No room assigned'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                disabled={updateBookingMutation.isPending}
                              >
                                Confirm
                              </Button>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleStatusUpdate(booking.id, 'checked_in')}
                                disabled={updateBookingMutation.isPending}
                              >
                                Check In
                              </Button>
                            )}
                            {booking.status === 'checked_in' && (
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleStatusUpdate(booking.id, 'checked_out')}
                                disabled={updateBookingMutation.isPending}
                              >
                                Check Out
                              </Button>
                            )}
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                disabled={updateBookingMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {bookingsData && bookingsData.total > bookingsData.pageSize && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {page * bookingsData.pageSize + 1} to {Math.min((page + 1) * bookingsData.pageSize, bookingsData.total)} of {bookingsData.total} bookings
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * bookingsData.pageSize >= bookingsData.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
