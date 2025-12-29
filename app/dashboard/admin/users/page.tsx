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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Trash2, Shield, UserCog, Users as UsersIcon, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
}

interface CurrentProfile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [profile, setProfile] = useState<CurrentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('users')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff'
  })

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: 'staff'
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
      await loadUsers()
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['guest', 'staff', 'manager', 'admin'])
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      setUsers(usersData || [])
    } catch (err) {
      console.error('Users loading error:', err)
    }
  }

  const handleCreateUser = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    setCreating(true)
    setError('')

    try {
      // Create auth user using admin API
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      // Reload users
      await loadUsers()

      // Show success toast
      toast.success('User created successfully', {
        description: `${formData.full_name} has been added to the system`
      })

      // Reset form and close dialog
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'staff'
      })
      setCreateDialogOpen(false)
    } catch (err: any) {
      console.error('Create user error:', err)
      setError(err.message || 'Failed to create user')
      toast.error('Failed to create user', {
        description: err.message || 'An error occurred while creating the user'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    if (!editFormData.full_name || !editFormData.role) {
      setError('Please fill in all required fields')
      return
    }

    setUpdating(true)
    setError('')

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          full_name: editFormData.full_name,
          role: editFormData.role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      await loadUsers()
      setEditDialogOpen(false)
      setSelectedUser(null)
      setEditFormData({ full_name: '', role: 'staff' })
    } catch (err: any) {
      console.error('Update user error:', err)
      setError(err.message || 'Failed to update user')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      // Call admin API to delete user (handles both auth.users and profiles)
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully', {
        description: `${selectedUser.full_name} has been removed from the system`
      })

      await loadUsers()
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error('Failed to delete user', {
        description: err.message || 'An error occurred while deleting the user'
      })
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  const staffCount = users.filter(u => u.role === 'staff').length
  const managerCount = users.filter(u => u.role === 'manager').length
  const adminCount = users.filter(u => u.role === 'admin').length
  const guestCount = users.filter(u => u.role === 'guest').length

  const filteredUsers = selectedRole === 'all'
    ? users
    : users.filter(u => u.role === selectedRole)

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'dashboard') router.push('/dashboard/admin')
          else if (view === 'bookings') router.push('/dashboard/admin/bookings')
          else if (view === 'hotels') router.push('/dashboard/admin/hotels')
          else if (view === 'customers') router.push('/dashboard/admin/customers')
          else if (view === 'payments') router.push('/dashboard/admin/payments')
          else if (view === 'reports') router.push('/dashboard/admin/reports')
          else if (view === 'users') router.push('/dashboard/admin/users')
        }}
        user={{ name: profile?.full_name || '', role: 'Admin' }}
        onLogout={handleSignOut}
      />

      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage staff and manager accounts</p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Staff Members</p>
                <p className="text-2xl font-bold text-gray-900">{staffCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <UserCog className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{managerCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Guests</p>
                <p className="text-2xl font-bold text-gray-900">{guestCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center gap-4">
            <Label htmlFor="role-filter" className="font-medium text-gray-700">Filter by Role:</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-filter" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="guest">Guests</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Role</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {users.length === 0 ? 'No users found' : 'No users matching selected role'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-gray-100">
                        <TableCell className="font-medium text-gray-900">{user.full_name}</TableCell>
                        <TableCell className="text-gray-700">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 border-0'
                                : user.role === 'manager'
                                ? 'bg-green-100 text-green-700 border-0'
                                : user.role === 'guest'
                                ? 'bg-amber-100 text-amber-700 border-0'
                                : 'bg-blue-100 text-blue-700 border-0'
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setEditFormData({
                                  full_name: user.full_name,
                                  role: user.role
                                })
                                setEditDialogOpen(true)
                              }}
                              className="p-1 text-gray-600 hover:text-blue-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                              className="p-1 text-gray-600 hover:text-red-600"
                              disabled={user.id === profile?.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new staff member or manager account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} className="bg-purple-600 hover:bg-purple-700" disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="edit_full_name">Full Name *</Label>
              <Input
                id="edit_full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Role *</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                <SelectTrigger id="edit_role">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} className="bg-blue-600 hover:bg-blue-700" disabled={updating}>
              {updating ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>Are you sure you want to delete this user?</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Name: {selectedUser.full_name}</p>
              <p className="text-sm text-gray-600">Email: {selectedUser.email}</p>
              <p className="text-sm text-gray-600">Role: {selectedUser.role}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
