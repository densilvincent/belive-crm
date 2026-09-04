import { useSupabaseTable } from './useSupabaseTable'

export function useOverhead() {
  return useSupabaseTable('daily_overhead_expenses', { orderBy: 'date', ascending: false })
}
