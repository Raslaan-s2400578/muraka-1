'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserCheck, Clock, Star, Download } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: string
}

export default function ReportsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView] = useState('reports')
  const [timeFilter, setTimeFilter] = useState('30days')

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
      setLoading(false)
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  // Mock chart data
  const chartData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 61 },
    { month: 'Apr', value: 58 },
    { month: 'May', value: 70 },
    { month: 'Jun', value: 65 },
    { month: 'Jul', value: 80 },
    { month: 'Aug', value: 75 },
  ]

  const maxValue = Math.max(...chartData.map(d => d.value))

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Track performance metrics and trends</p>
            </div>
            <div className="flex gap-3">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
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
                </div>
                <p className="text-sm text-gray-600 mb-1">New Guests</p>
                <p className="text-2xl font-bold text-gray-900">284</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Returning Guests</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg. Stay Duration</p>
                <p className="text-2xl font-bold text-gray-900">4.2 days</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Guest Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">4.8/5.0</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Revenue & Bookings Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Simple bar chart visualization */}
              <div className="space-y-2">
                {/* Y-axis labels */}
                <div className="flex items-end justify-between h-64 gap-4">
                  {/* Y-axis */}
                  <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                    <span>{maxValue}K</span>
                    <span>{Math.round(maxValue * 0.75)}K</span>
                    <span>{Math.round(maxValue * 0.5)}K</span>
                    <span>{Math.round(maxValue * 0.25)}K</span>
                    <span>0</span>
                  </div>

                  {/* Bars */}
                  <div className="flex-1 flex items-end justify-between gap-2 h-full border-l border-b border-gray-200 pl-4 pb-0">
                    {chartData.map((data) => {
                      const height = (data.value / maxValue) * 100
                      return (
                        <div key={data.month} className="flex flex-col items-center flex-1 h-full justify-end">
                          <div
                            className="w-full bg-blue-400 rounded-t-md hover:bg-blue-500 transition-colors"
                            style={{ height: `${height}%` }}
                            title={`${data.month}: ${data.value}K`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex items-center gap-4">
                  <div className="w-8" /> {/* Spacer for Y-axis */}
                  <div className="flex-1 flex justify-between gap-2 pl-4">
                    {chartData.map((data) => (
                      <div key={data.month} className="flex-1 text-center text-xs text-gray-600">
                        {data.month}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded" />
                  <span className="text-gray-600">Revenue ($K)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}