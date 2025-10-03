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
      let query = supabase
        .from('hotels')
        .select('id, name, location, description, created_at')
        .order('name')

      // Search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      }

      const { data: hotels, error } = await query

      if (error) throw error

      // Get room counts for each hotel
      if (hotels && hotels.length > 0) {
        const hotelIds = hotels.map(h => h.id)

        const { data: roomCounts } = await supabase
          .from('rooms')
          .select('hotel_id')
          .in('hotel_id', hotelIds)

        const countsMap = new Map<string, number>()
        roomCounts?.forEach(room => {
          countsMap.set(room.hotel_id, (countsMap.get(room.hotel_id) || 0) + 1)
        })

        return (hotels || []).map(hotel => ({
          ...hotel,
          _count: {
            rooms: countsMap.get(hotel.id) || 0
          }
        })) as Hotel[]
      }

      return [] as Hotel[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (hotels don't change often)
  })
}
