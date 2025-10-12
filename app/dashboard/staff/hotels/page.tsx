'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchIcon, HomeIcon } from 'lucide-react'
import { useHotels } from '@/hooks/useHotels'
import { useRooms } from '@/hooks/useRooms'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export default function StaffHotelsPage() {
  const [searchTerm, setSearchTerm] = useState('')
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

  // Fetch hotels
  const { data: hotels, isLoading, error } = useHotels({ searchTerm })

  // Get room stats
  const { data: roomsData } = useRooms({ pageSize: 1000 })

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const getRoomStats = (hotelId: string) => {
    const hotelRooms = roomsData?.rooms.filter(r => r.hotel.id === hotelId) || []
    return {
      total: hotelRooms.length,
      available: hotelRooms.filter(r => r.status === 'Available').length,
      occupied: hotelRooms.filter(r => r.status === 'Occupied').length,
      cleaning: hotelRooms.filter(r => r.status === 'Cleaning').length,
    }
  }

  if (isLoading || !profile) {
    return null // Loading handled by loading.tsx
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Sidebar
        activeView="hotels"
        setActiveView={(view) => {
          if (view === 'dashboard') {
            router.push('/dashboard/staff')
          } else {
            router.push(`/dashboard/staff/${view}`)
          }
        }}
        user={{ name: profile.full_name || '', role: 'Staff' }}
        onLogout={handleSignOut}
      />

      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotels Management</h1>
            <p className="text-gray-600">View all hotel locations and their room status</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Failed to load hotels. Please try again.</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search hotels by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels?.map((hotel) => {
              const stats = getRoomStats(hotel.id)
              return (
                <Card key={hotel.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-1">{hotel.name}</CardTitle>
                        <CardDescription>{hotel.location}</CardDescription>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <HomeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hotel.description && (
                      <p className="text-sm text-gray-600 mb-4">{hotel.description}</p>
                    )}

                    {/* Room Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Rooms:</span>
                        <span className="font-semibold text-gray-900">{stats.total}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Available:</span>
                        <span className="font-semibold text-green-700">{stats.available}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600">Occupied:</span>
                        <span className="font-semibold text-blue-700">{stats.occupied}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-orange-600">Cleaning:</span>
                        <span className="font-semibold text-orange-700">{stats.cleaning}</span>
                      </div>
                    </div>

                    {/* Occupancy Rate */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Occupancy Rate:</span>
                        <span className="font-semibold text-gray-900">
                          {stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {hotels && hotels.length === 0 && (
            <div className="text-center py-12">
              <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hotels found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
