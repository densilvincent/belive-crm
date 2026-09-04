import { useMemo, useState } from 'react'
import { useInvestments } from '../hooks/useInvestments'
import { formatCurrency, formatDate, startOfMonthISO, endOfMonthISO, exportToCSV } from '../lib/formatters'
import { sum } from '../lib/calc'
import DateRangePicker from '../components/common/DateRangePicker'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Icon from '../components/common/Icon'
import InvestmentForm from '../components/forms/InvestmentForm'

export default function InvestmentReturns() {
  const { data: investments, loading } = useInvestments()
  const [start, setStart] = useState(startOfMonthISO())
  const [end, setEnd] = useState(endOfMonthISO())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(
    () => investments.filter((i) => i.date >= start && i.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [investments, start, end]
  )

  const totalExpected = sum(filtered, (i) => i.expected_monthly_return)
  const totalReceived = sum(filtered, (i) => i.actual_amount_received)
  const outstanding = totalExpected - totalReceived

  const handleExport = () => {
    exportToCSV(
      `belive-investments-${start}-to-${end}.csv`,
      filtered.map((i) => ({
        date: i.date,
        vehicle: i.vehicle_name,
        expected: i.expected_monthly_return,
        received: i.actual_amount_received,
        status: i.payment_status,
      }))
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl">Investment Returns</h1>
      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />

      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Expected</p>
          <p className="font-bold text-sm">{formatCurrency(totalExpected)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Received</p>
          <p className="font-bold text-sm text-green-700">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Outstanding</p>
          <p className={`font-bold text-sm ${outstanding > 0 ? 'text-red-600' : 'text-gray-800'}`}>{formatCurrency(outstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Add Return
        </button>
        <button className="btn-outline" onClick={handleExport} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No investment returns in this range" />
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => (
            <div key={i.id} className="card" onClick={() => setEditing(i)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{i.vehicle_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(i.date)}</p>
                </div>
                <span className={`badge ${i.payment_status === 'Received' ? 'bg-green-700' : 'bg-orange-500'}`}>{i.payment_status}</span>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Expected: {formatCurrency(i.expected_monthly_return)}</span>
                <span className="font-bold text-teal">{formatCurrency(i.actual_amount_received)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Investment Return">
        <InvestmentForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Investment">
        {editing && <InvestmentForm investment={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
