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
import { Star, MapPin, Bed, TrendingUp, DollarSign, Wifi, Waves, Utensils } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Hotel {
  id: string
  name: string
  location: string
  address: string
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('hotels')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    location: 'Male',
    address: '',
    description: ''
  })

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
      await loadHotels()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const loadHotels = async () => {
    try {
      setLoading(true)

      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .order('location')

      if (hotelsError) {
        console.error('Hotels error:', hotelsError)
      } else {
        setHotels(hotelsData || [])
      }
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

  const handleCreateHotel = async () => {
    try {
      setError('')
      setSuccess('')

      // Validation
      if (!formData.name.trim()) {
        setError('Hotel name is required')
        return
      }
      if (!formData.address.trim()) {
        setError('Address is required')
        return
      }

      // Insert hotel into database
      const { error: insertError } = await supabase
        .from('hotels')
        .insert([
          {
            name: formData.name.trim(),
            location: formData.location,
            address: formData.address.trim()
          }
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      // Success - reset form and close dialog
      setSuccess('Hotel created successfully!')
      setFormData({
        name: '',
        location: 'Male',
        address: '',
        description: ''
      })

      // Reload hotels
      await loadHotels()

      // Close dialog after a short delay
      setTimeout(() => {
        setDialogOpen(false)
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Create hotel error:', err)
      setError(err.message || 'Failed to create hotel')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading hotels...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotel Properties</h1>
              <p className="text-gray-600">Manage your hotel locations and amenities</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Add New Hotel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Hotel Property</DialogTitle>
                  <DialogDescription>
                    Create a new hotel location in your system
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Hotel Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Muraka Paradise Resort"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="location">Location (Atoll) *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData({ ...formData, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Laamu">Laamu</SelectItem>
                        <SelectItem value="Faafu">Faafu</SelectItem>
                        <SelectItem value="Ari">Ari</SelectItem>
                        <SelectItem value="Baa">Baa</SelectItem>
                        <SelectItem value="Raa">Raa</SelectItem>
                        <SelectItem value="Noonu">Noonu</SelectItem>
                        <SelectItem value="Dhaalu">Dhaalu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Full Address *</Label>
                    <Input
                      id="address"
                      placeholder="e.g., Muraka Island, Male Atoll"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the hotel..."
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateHotel}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Hotel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No hotels found</p>
              </div>
            ) : (
              hotels.map((hotel) => (
                <Card key={hotel.id} className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Hotel Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold opacity-30">
                      {hotel.name.charAt(0)}
                    </div>
                    <Badge className="absolute top-4 right-4 bg-green-500 text-white border-0">
                      Active
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">(128 reviews)</span>
                    </div>

                    {/* Hotel Name & Location */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                    <div className="flex items-center gap-1 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{hotel.location} Atoll, Maldives</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      Luxury resort offering stunning ocean views, world-class amenities, and exceptional service in a tropical paradise setting.
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <Bed className="w-3 h-3" />
                          <span className="text-xs">Rooms</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">24</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs">Occupancy</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">78%</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-xs">Revenue</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">$45K</p>
                      </div>
                    </div>

                    {/* Key Amenities */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Key Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 text-xs">
                          <Wifi className="w-3 h-3 mr-1" />
                          Free WiFi
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0 text-xs">
                          <Waves className="w-3 h-3 mr-1" />
                          Pool
                        </Badge>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-0 text-xs">
                          <Utensils className="w-3 h-3 mr-1" />
                          Restaurant
                        </Badge>
                      </div>
                    </div>

                    {/* View Rooms Button */}
                    <Button
                      onClick={() => router.push(`/dashboard/manager/rooms?hotel=${hotel.id}`)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Bed className="w-4 h-4 mr-2" />
                      View Rooms
                    </Button>
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