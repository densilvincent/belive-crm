import { useSupabaseTable } from './useSupabaseTable'

export function useMiscEntries() {
  return useSupabaseTable('daily_misc_entries', { orderBy: 'date', ascending: false })
}
