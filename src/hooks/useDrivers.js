import { useSupabaseTable } from './useSupabaseTable'

export function useDrivers() {
  return useSupabaseTable('drivers', { orderBy: 'name', ascending: true })
}
