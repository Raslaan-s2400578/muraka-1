'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User as AuthUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SettingsIcon, UsersIcon, HotelIcon, ShieldIcon, DatabaseIcon, MapPinIcon } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  profiles: {
    full_name: string
    role: string
    phone: string | null
  }
}

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

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newUserDialog, setNewUserDialog] = useState(false)
  const [newHotelDialog, setNewHotelDialog] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'guest',
    phone: ''
  })
  const [newHotelForm, setNewHotelForm] = useState({
    name: '',
    location: 'Male',
    address: ''
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

      if (profile?.role !== 'admin') {
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

      // Load all users with profiles (admin has full access)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          phone,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Users error:', usersError)
      } else {
        // Get user emails from auth.users (requires service role key in production)
        const userIds = usersData?.map(u => u.id) || []
        const usersWithAuth = await Promise.all(
          (usersData || []).map(async (profile) => {
            // In a real app, you'd need to use the service role key to access auth.users
            // For now, we'll mock the email field
            return {
              id: profile.id,
              email: `user-${profile.id.slice(0, 8)}@example.com`, // Mock email
              created_at: profile.created_at,
              profiles: {
                full_name: profile.full_name,
                role: profile.role,
                phone: profile.phone
              }
            }
          })
        )
        setUsers(usersWithAuth)
      }

      // Load hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .order('location')

      if (hotelsError) {
        throw hotelsError
      }

      setHotels(hotelsData || [])

      // Load system statistics
      await loadSystemStats()
    } catch (err) {
      console.error('Loading error:', err)
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) {
        throw error
      }

      // Refresh users data
      await loadAdminData()
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update user role')
    }
  }

  const createNewUser = async () => {
    try {
      setError('')

      // In a real application, you would use the service role key to create users
      // For this demo, we'll simulate the process
      console.log('Would create user:', newUserForm)

      setError('User creation requires server-side implementation with service role key')

      // Reset form
      setNewUserForm({
        email: '',
        password: '',
        fullName: '',
        role: 'guest',
        phone: ''
      })
      setNewUserDialog(false)
    } catch (err) {
      console.error('Create user error:', err)
      setError('Failed to create user')
    }
  }

  const createNewHotel = async () => {
    try {
      setError('')

      const { error } = await supabase
        .from('hotels')
        .insert({
          name: newHotelForm.name,
          location: newHotelForm.location,
          address: newHotelForm.address
        })

      if (error) {
        throw error
      }

      // Reset form and reload data
      setNewHotelForm({
        name: '',
        location: 'Male',
        address: ''
      })
      setNewHotelDialog(false)
      await loadAdminData()
    } catch (err) {
      console.error('Create hotel error:', err)
      setError('Failed to create hotel')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Muraka Hotels</h1>
              <Badge className="ml-4" variant="destructive">Admin Portal</Badge>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Administrator Dashboard</h2>
          <p className="text-gray-600">Complete system management and configuration</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {systemStats?.total_users || 0}
                  </p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {systemStats?.total_bookings || 0}
                  </p>
                </div>
                <DatabaseIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${systemStats?.total_revenue.toLocaleString() || '0'}
                  </p>
                </div>
                <DatabaseIcon className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rooms</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {systemStats?.total_rooms || 0}
                  </p>
                </div>
                <HotelIcon className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="hotels">Hotel Management</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user accounts and permissions across the system
                    </CardDescription>
                  </div>
                  <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
                    <DialogTrigger asChild>
                      <Button>Create New User</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user account to the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Secure password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={newUserForm.fullName}
                            onChange={(e) => setNewUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Guest</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            value={newUserForm.phone}
                            onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewUserDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createNewUser}>
                          Create User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.profiles.full_name}</p>
                            <p className="text-sm text-gray-500">{user.id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.profiles.role === 'admin' ? 'destructive' :
                              user.profiles.role === 'manager' ? 'default' :
                              user.profiles.role === 'staff' ? 'secondary' : 'outline'
                            }
                          >
                            {user.profiles.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.profiles.phone || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select
                            value={user.profiles.role}
                            onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Guest</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Hotel Management</CardTitle>
                    <CardDescription>
                      Manage hotel locations and properties
                    </CardDescription>
                  </div>
                  <Dialog open={newHotelDialog} onOpenChange={setNewHotelDialog}>
                    <DialogTrigger asChild>
                      <Button>Add New Hotel</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Hotel</DialogTitle>
                        <DialogDescription>
                          Create a new hotel location
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="hotelName">Hotel Name</Label>
                          <Input
                            id="hotelName"
                            value={newHotelForm.name}
                            onChange={(e) => setNewHotelForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Muraka Resort"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Select value={newHotelForm.location} onValueChange={(value) => setNewHotelForm(prev => ({ ...prev, location: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Laamu">Laamu</SelectItem>
                              <SelectItem value="Faafu">Faafu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={newHotelForm.address}
                            onChange={(e) => setNewHotelForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Full address"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewHotelDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createNewHotel}>
                          Create Hotel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow key={hotel.id}>
                        <TableCell className="font-medium">{hotel.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {hotel.location} Atoll
                          </div>
                        </TableCell>
                        <TableCell>{hotel.address}</TableCell>
                        <TableCell>{new Date(hotel.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">System configuration interface</p>
                  <p className="text-sm text-gray-400">
                    Features to be implemented: System maintenance, backup settings, email configuration, etc.
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