import { useSupabaseTable } from './useSupabaseTable'

export function useTrips() {
  return useSupabaseTable('trips', { orderBy: 'date', ascending: false })
}
