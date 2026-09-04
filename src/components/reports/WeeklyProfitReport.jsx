import { useMemo } from 'react'
import { tripProfit, dailyOverheadTotal, weekKey } from '../../lib/calc'
import { formatCurrency, exportToCSV } from '../../lib/formatters'
import EmptyState from '../common/EmptyState'

export default function WeeklyProfitReport({ trips, overheads, commissions, investments }) {
  const rows = useMemo(() => {
    const byWeek = new Map()

    const bucket = (dateStr) => {
      const { key, label } = weekKey(dateStr)
      if (!byWeek.has(key)) byWeek.set(key, { key, label, tripProfitTotal: 0, overheadTotal: 0, commissionTotal: 0, investmentTotal: 0 })
      return byWeek.get(key)
    }

    trips.forEach((t) => (bucket(t.date).tripProfitTotal += tripProfit(t)))
    overheads.forEach((o) => (bucket(o.date).overheadTotal += dailyOverheadTotal(o)))
    commissions.forEach((c) => (bucket(c.date).commissionTotal += Number(c.commission_amount) || 0))
    investments.forEach((i) => (bucket(i.date).investmentTotal += Number(i.actual_amount_received) || 0))

    return [...byWeek.values()]
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .map((w) => ({
        ...w,
        weeklyNetProfit: w.tripProfitTotal - w.overheadTotal,
        totalIncome: w.tripProfitTotal - w.overheadTotal + w.commissionTotal + w.investmentTotal,
      }))
  }, [trips, overheads, commissions, investments])

  const handleExport = () =>
    exportToCSV(
      'belive-weekly-net-profit.csv',
      rows.map((r) => ({
        week: r.label,
        trip_profit: r.tripProfitTotal,
        daily_overhead: r.overheadTotal,
        weekly_net_profit: r.weeklyNetProfit,
        total_income: r.totalIncome,
      }))
    )

  return (
    <div className="space-y-3">
      <button className="btn-outline w-full" onClick={handleExport} disabled={rows.length === 0}>
        Export CSV
      </button>
      {rows.length === 0 ? (
        <EmptyState title="No activity in this range" />
      ) : (
        <div className="space-y-2">
          {rows.map((w) => (
            <div key={w.key} className="card">
              <p className="font-display font-semibold text-sm mb-2">{w.label}</p>
              <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-500">
                <span>Trip Profit</span>
                <span className="text-right">{formatCurrency(w.tripProfitTotal)}</span>
                <span>Daily Overhead</span>
                <span className="text-right">{formatCurrency(w.overheadTotal)}</span>
                <span className="font-bold text-gray-800">Weekly Net Profit</span>
                <span className={`text-right font-bold ${w.weeklyNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(w.weeklyNetProfit)}
                </span>
                <span>Total Income</span>
                <span className="text-right">{formatCurrency(w.totalIncome)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
