import { formatCurrency } from '../../lib/formatters'

export default function ProfitBadge({ amount }) {
  const positive = Number(amount) >= 0
  return (
    <span
      className={`inline-block rounded-md px-2 py-1 text-sm font-bold ${
        positive ? 'text-green-700 bg-green-600/10' : 'text-red-700 bg-red-600/10'
      }`}
    >
      {positive ? '' : '-'}
      {formatCurrency(Math.abs(amount))}
    </span>
  )
}
