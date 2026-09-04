import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { sum, groupBy } from '../../lib/calc'
import { formatCurrency, exportToCSV } from '../../lib/formatters'
import { CHART_COLORS, COMMISSION_TYPES } from '../../lib/constants'
import EmptyState from '../common/EmptyState'

export default function CommissionSourceReport({ commissions }) {
  const rows = useMemo(() => {
    const byType = groupBy(commissions, (c) => c.commission_type)
    return COMMISSION_TYPES.map((t) => ({ label: t.label, value: sum(byType.get(t.value) || [], (c) => c.commission_amount) })).filter(
      (r) => r.value > 0
    )
  }, [commissions])

  const handleExport = () => exportToCSV('belive-commission-source.csv', rows.map((r) => ({ source: r.label, amount: r.value })))

  if (rows.length === 0) return <EmptyState title="No commissions in this range" />

  return (
    <div className="space-y-3">
      <button className="btn-outline w-full" onClick={handleExport}>
        Export CSV
      </button>
      <div className="card">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={rows.map((r) => ({ name: r.label, value: r.value }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {rows.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card divide-y divide-gray-50">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between py-2 text-sm">
            <span className="text-gray-500">{r.label}</span>
            <span className="font-bold">{formatCurrency(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
