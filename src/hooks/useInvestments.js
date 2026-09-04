import { useSupabaseTable } from './useSupabaseTable'

export function useInvestments() {
  return useSupabaseTable('investment_returns', { orderBy: 'date', ascending: false })
}
