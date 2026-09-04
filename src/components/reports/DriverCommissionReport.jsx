import { useMemo } from 'react'
import { sum, groupBy } from '../../lib/calc'
import { formatCurrency, exportToCSV } from '../../lib/formatters'
import EmptyState from '../common/EmptyState'

export default function DriverCommissionReport({ trips, drivers }) {
  const rows = useMemo(() => {
    const byDriver = groupBy(
      trips.filter((t) => t.driver_assigned),
      (t) => t.driver_assigned
    )
    return [...byDriver.entries()]
      .map(([driverId, list]) => {
        const driver = drivers.find((d) => d.id === driverId)
        const total = sum(list, (t) => t.driver_commission)
        return { name: driver?.name || 'Unknown driver', trips: list.length, total, avg: list.length ? total / list.length : 0 }
      })
      .sort((a, b) => b.total - a.total)
  }, [trips, drivers])

  const handleExport = () =>
    exportToCSV('belive-driver-commissions.csv', rows.map((r) => ({ driver: r.name, trips: r.trips, total_commission: r.total, avg_per_trip: r.avg })))

  if (rows.length === 0) return <EmptyState title="No driver commissions in this range" />

  return (
    <div className="space-y-3">
      <button className="btn-outline w-full" onClick={handleExport}>
        Export CSV
      </button>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="card flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-sm">{r.name}</p>
              <p className="text-xs text-gray-400">{r.trips} trip(s) · avg {formatCurrency(r.avg)}</p>
            </div>
            <p className="font-bold text-teal">{formatCurrency(r.total)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
