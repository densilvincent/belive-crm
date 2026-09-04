import { tripCost, dailyOverheadTotal, sum } from '../../lib/calc'
import { formatCurrency, exportToCSV } from '../../lib/formatters'

export default function ConsolidatedPLReport({ trips, overheads, commissions, investments }) {
  const tripRevenue = sum(trips, (t) => t.amount_received)
  const commissionIncome = sum(commissions, (c) => c.commission_amount)
  const investmentIncome = sum(investments, (i) => i.actual_amount_received)
  const totalIncome = tripRevenue + commissionIncome + investmentIncome

  const tripCosts = sum(trips, tripCost)
  const overheadCosts = sum(overheads, dailyOverheadTotal)
  const totalCosts = tripCosts + overheadCosts

  const netProfit = totalIncome - totalCosts

  const rows = [
    { label: 'Trip Revenue', value: tripRevenue, section: 'Income' },
    { label: 'Commission Income', value: commissionIncome, section: 'Income' },
    { label: 'Investment Income', value: investmentIncome, section: 'Income' },
    { label: 'Total Income', value: totalIncome, section: 'Income', bold: true },
    { label: 'Trip Costs', value: tripCosts, section: 'Costs' },
    { label: 'Daily Overhead', value: overheadCosts, section: 'Costs' },
    { label: 'Total Costs', value: totalCosts, section: 'Costs', bold: true },
    { label: 'Net Profit', value: netProfit, section: 'Result', bold: true },
  ]

  const handleExport = () => exportToCSV('belive-consolidated-pl.csv', rows.map((r) => ({ section: r.section, line: r.label, amount: r.value })))

  return (
    <div className="space-y-3">
      <button className="btn-outline w-full" onClick={handleExport}>
        Export CSV
      </button>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={`border-b border-gray-50 last:border-0 ${r.bold ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                <td className="py-2">{r.label}</td>
                <td className={`py-2 text-right ${r.label === 'Net Profit' ? (r.value >= 0 ? 'text-green-700' : 'text-red-700') : ''}`}>
                  {formatCurrency(r.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
