import { useMemo, useState } from 'react'
import { useDrivers } from '../hooks/useDrivers'
import { useTrips } from '../hooks/useTrips'
import { formatCurrency, formatDate, startOfMonthISO, endOfMonthISO } from '../lib/formatters'
import { sum } from '../lib/calc'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'

export default function DriverPerformance() {
  const { data: drivers, loading: driversLoading } = useDrivers()
  const { data: trips, loading: tripsLoading } = useTrips()
  const [sortBy, setSortBy] = useState('commission')
  const [detail, setDetail] = useState(null)

  const monthTrips = useMemo(() => {
    const start = startOfMonthISO()
    const end = endOfMonthISO()
    return trips.filter((t) => t.date >= start && t.date <= end)
  }, [trips])

  const rows = useMemo(() => {
    return drivers
      .map((d) => {
        const driverTrips = monthTrips.filter((t) => t.driver_assigned === d.id)
        const allDriverTrips = trips.filter((t) => t.driver_assigned === d.id)
        return {
          driver: d,
          tripsThisMonth: driverTrips.length,
          totalCommission: sum(driverTrips, (t) => t.driver_commission),
          allTrips: allDriverTrips,
        }
      })
      .sort((a, b) => (sortBy === 'commission' ? b.totalCommission - a.totalCommission : b.tripsThisMonth - a.tripsThisMonth))
  }, [drivers, monthTrips, trips, sortBy])

  if (driversLoading || tripsLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Driver Performance</h1>
        <select className="input-field w-auto text-xs py-1.5" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="commission">Sort: Commission</option>
          <option value="trips">Sort: Trips</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No drivers yet" subtitle="Add drivers from Settings." />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.driver.id} className="card cursor-pointer" onClick={() => setDetail(row)}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{row.driver.name}</p>
                  <p className="text-xs text-gray-400 truncate">{row.driver.vehicle_assigned || 'No vehicle assigned'}</p>
                </div>
                <span className={`badge ${row.driver.status === 'Active' ? 'bg-green-600' : 'bg-gray-400'}`}>{row.driver.status}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-500">{row.tripsThisMonth} trip(s) this month</span>
                <span className="font-bold text-teal">{formatCurrency(row.totalCommission)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.driver.name}>
        {detail && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-3">{detail.allTrips.length} total trip(s) assigned</p>
            {detail.allTrips.length === 0 ? (
              <EmptyState title="No trips assigned yet" />
            ) : (
              detail.allTrips
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-gray-50 py-2 text-sm">
                    <div>
                      <p className="font-medium">{t.customer_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                    </div>
                    <p className="font-bold text-teal">{formatCurrency(t.driver_commission || 0)}</p>
                  </div>
                ))
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
