import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Hotel {
  id: string
  name: string
  location: string
  description: string | null
  created_at: string
  _count?: {
    rooms: number
  }
}

interface UseHotelsOptions {
  searchTerm?: string
}

export function useHotels(options: UseHotelsOptions = {}) {
  const { searchTerm } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['hotels', searchTerm],
    queryFn: async () => {
      // Single query with room count - much faster than 2 separate queries
      let query = supabase
        .from('hotels')
        .select(`
          id, 
          name, 
          location, 
          description, 
          created_at,
          rooms:rooms(count)
        `)
        .order('name')

      // Search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      }

      const { data: hotels, error } = await query

      if (error) throw error

      // Transform to include room count
      return (hotels || []).map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        description: hotel.description,
        created_at: hotel.created_at,
        _count: {
          rooms: (hotel.rooms as any)?.[0]?.count || 0
        }
      })) as Hotel[]
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - hotels rarely change
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  })
}
