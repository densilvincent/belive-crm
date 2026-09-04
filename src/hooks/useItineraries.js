import { useSupabaseTable } from './useSupabaseTable'

export function useItineraries() {
  return useSupabaseTable('itineraries', { orderBy: 'created_at', ascending: false })
}
