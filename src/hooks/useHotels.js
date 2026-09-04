import { useSupabaseTable } from './useSupabaseTable'

export function useHotels() {
  return useSupabaseTable('hotels_houseboats', { orderBy: 'name', ascending: true })
}
