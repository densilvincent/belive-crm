import { useMemo, useState } from 'react'
import { tripCost, tripProfit, dailyOverheadTotal, sum, groupBy } from '../../lib/calc'
import { formatCurrency, formatDate, exportToCSV } from '../../lib/formatters'
import EmptyState from '../common/EmptyState'

export default function DailyProfitReport({ trips, overheads, commissions, investments }) {
  const [expanded, setExpanded] = useState(null)

  const rows = useMemo(() => {
    const tripsByDate = groupBy(trips, (t) => t.date)
    const overheadByDate = groupBy(overheads, (o) => o.date)
    const commByDate = groupBy(commissions, (c) => c.date)
    const invByDate = groupBy(investments, (i) => i.date)

    const dates = new Set([...tripsByDate.keys(), ...overheadByDate.keys(), ...commByDate.keys(), ...invByDate.keys()])

    return [...dates]
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => {
        const dayTrips = tripsByDate.get(date) || []
        const dayOverheads = overheadByDate.get(date) || []
        const dayComm = commByDate.get(date) || []
        const dayInv = invByDate.get(date) || []
        const tripRevenue = sum(dayTrips, (t) => t.amount_received)
        const tripCosts = sum(dayTrips, tripCost)
        const tripProfitTotal = sum(dayTrips, tripProfit)
        const overheadTotal = sum(dayOverheads, dailyOverheadTotal)
        const dailyNetProfit = tripProfitTotal - overheadTotal
        const commissionTotal = sum(dayComm, (c) => c.commission_amount)
        const investmentTotal = sum(dayInv, (i) => i.actual_amount_received)
        const totalIncome = dailyNetProfit + commissionTotal + investmentTotal
        return { date, tripRevenue, tripCosts, tripProfitTotal, overheadTotal, dailyNetProfit, commissionTotal, investmentTotal, totalIncome }
      })
  }, [trips, overheads, commissions, investments])

  const monthly = {
    tripRevenue: sum(rows, (r) => r.tripRevenue),
    tripCosts: sum(rows, (r) => r.tripCosts),
    tripProfitTotal: sum(rows, (r) => r.tripProfitTotal),
    overheadTotal: sum(rows, (r) => r.overheadTotal),
    dailyNetProfit: sum(rows, (r) => r.dailyNetProfit),
    commissionTotal: sum(rows, (r) => r.commissionTotal),
    investmentTotal: sum(rows, (r) => r.investmentTotal),
    totalIncome: sum(rows, (r) => r.totalIncome),
  }

  const handleExport = () =>
    exportToCSV(
      'belive-daily-net-profit.csv',
      rows.map((r) => ({
        date: r.date,
        trip_revenue: r.tripRevenue,
        trip_costs: r.tripCosts,
        trip_profit: r.tripProfitTotal,
        daily_overhead: r.overheadTotal,
        daily_net_profit: r.dailyNetProfit,
        commissions: r.commissionTotal,
        investment: r.investmentTotal,
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
          {rows.map((r) => (
            <div key={r.date} className="card cursor-pointer" onClick={() => setExpanded(expanded === r.date ? null : r.date)}>
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-sm">{formatDate(r.date)}</p>
                <p className={`font-bold text-sm ${r.dailyNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(r.dailyNetProfit)}
                </p>
              </div>
              {expanded === r.date && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                  <Line label="Trip Revenue" value={r.tripRevenue} />
                  <Line label="Trip Costs" value={r.tripCosts} />
                  <Line label="Trip Profit" value={r.tripProfitTotal} />
                  <Line label="Daily Overhead" value={r.overheadTotal} />
                  <Line label="Commissions" value={r.commissionTotal} />
                  <Line label="Investment" value={r.investmentTotal} />
                  <Line label="Total Income" value={r.totalIncome} bold />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card bg-teal/5 border-teal/20">
        <p className="text-xs text-gray-400 mb-2">Range Totals</p>
        <Line label="Trip Revenue" value={monthly.tripRevenue} />
        <Line label="Trip Costs" value={monthly.tripCosts} />
        <Line label="Trip Profit" value={monthly.tripProfitTotal} />
        <Line label="Overhead" value={monthly.overheadTotal} />
        <Line label="Commissions" value={monthly.commissionTotal} />
        <Line label="Investment" value={monthly.investmentTotal} />
        <Line label="Total Income" value={monthly.totalIncome} bold />
      </div>
    </div>
  )
}

function Line({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-gray-800 text-sm pt-1' : ''}`}>
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  )
}
