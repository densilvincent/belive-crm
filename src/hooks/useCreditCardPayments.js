import { useSupabaseTable } from './useSupabaseTable'

export function useCreditCardPayments() {
  return useSupabaseTable('credit_card_payments', { orderBy: 'date', ascending: false })
}
