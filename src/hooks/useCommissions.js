import { useSupabaseTable } from './useSupabaseTable'

export function useCommissions() {
  return useSupabaseTable('commissions_received', { orderBy: 'date', ascending: false })
}
