import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { tripProfit, sum, groupBy } from '../../lib/calc'
import { formatCurrency, exportToCSV } from '../../lib/formatters'
import { CHART_COLORS, TRIP_TYPES } from '../../lib/constants'
import EmptyState from '../common/EmptyState'

export default function TripProfitabilityReport({ trips }) {
  const rows = useMemo(() => {
    const byType = groupBy(trips, (t) => t.trip_type)
    return TRIP_TYPES.map((t) => {
      const list = byType.get(t.value) || []
      return { label: t.label, count: list.length, profit: sum(list, tripProfit) }
    }).filter((r) => r.count > 0)
  }, [trips])

  const pieData = rows.map((r) => ({ name: r.label, value: Math.max(0, r.profit) }))

  const handleExport = () => exportToCSV('belive-trip-profitability.csv', rows.map((r) => ({ trip_type: r.label, trips: r.count, profit: r.profit })))

  if (rows.length === 0) return <EmptyState title="No trips in this range" />

  return (
    <div className="space-y-3">
      <button className="btn-outline w-full" onClick={handleExport}>
        Export CSV
      </button>
      <div className="card">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs">
              <th className="pb-2">Type</th>
              <th className="pb-2 text-right">Trips</th>
              <th className="pb-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-gray-50">
                <td className="py-2">{r.label}</td>
                <td className="py-2 text-right">{r.count}</td>
                <td className={`py-2 text-right font-bold ${r.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(r.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
