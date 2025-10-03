import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface StaffMember {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
}

interface UseStaffOptions {
  page?: number
  pageSize?: number
  role?: string
  searchTerm?: string
}

export function useStaff(options: UseStaffOptions = {}) {
  const { page = 0, pageSize = 20, role, searchTerm } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['staff', page, pageSize, role, searchTerm],
    queryFn: async () => {
      const start = page * pageSize
      const end = start + pageSize - 1

      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at', { count: 'exact' })
        .in('role', ['staff', 'manager', 'admin'])

      // Role filter
      if (role && role !== 'all') {
        query = query.eq('role', role)
      }

      // Search filter
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      query = query
        .range(start, end)
        .order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        staff: (data || []) as StaffMember[],
        total: count || 0,
        page,
        pageSize
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
