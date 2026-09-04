import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useCommissions } from '../hooks/useCommissions'
import { formatCurrency, formatDate, startOfMonthISO, endOfMonthISO, exportToCSV } from '../lib/formatters'
import { sum } from '../lib/calc'
import DateRangePicker from '../components/common/DateRangePicker'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Icon from '../components/common/Icon'
import CommissionForm from '../components/forms/CommissionForm'

export default function CommissionTracker() {
  const { data: commissions, loading, update } = useCommissions()
  const [start, setStart] = useState(startOfMonthISO())
  const [end, setEnd] = useState(endOfMonthISO())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(
    () => commissions.filter((c) => c.date >= start && c.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [commissions, start, end]
  )

  const totalHotel = sum(filtered.filter((c) => c.commission_type === 'hotel'), (c) => c.commission_amount)
  const totalHouseboat = sum(filtered.filter((c) => c.commission_type === 'houseboat'), (c) => c.commission_amount)
  const totalOverflow = sum(filtered.filter((c) => c.commission_type === 'overflow-referral'), (c) => c.commission_amount)
  const total = sum(filtered, (c) => c.commission_amount)

  const toggleReceived = async (c) => {
    try {
      await update(c.id, { payment_status: c.payment_status === 'Received' ? 'Pending' : 'Received' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleExport = () => {
    exportToCSV(
      `belive-commissions-${start}-to-${end}.csv`,
      filtered.map((c) => ({
        date: c.date,
        commission_id: c.commission_id,
        type: c.commission_type,
        source: c.operator_or_source,
        amount: c.commission_amount,
        status: c.payment_status,
      }))
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl">Commission Tracker</h1>
      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />

      <div className="grid grid-cols-2 gap-2">
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Hotel</p>
          <p className="font-bold text-sm">{formatCurrency(totalHotel)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Houseboat</p>
          <p className="font-bold text-sm">{formatCurrency(totalHouseboat)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Overflow</p>
          <p className="font-bold text-sm">{formatCurrency(totalOverflow)}</p>
        </div>
        <div className="card text-center bg-teal/5 border-teal/20">
          <p className="text-[11px] text-gray-400">Total</p>
          <p className="font-bold text-sm text-teal">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Add Commission
        </button>
        <button className="btn-outline" onClick={handleExport} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No commissions in this range" />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="card" onClick={() => setEditing(c)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{c.operator_or_source || c.commission_type}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(c.date)} · <span className="capitalize">{c.commission_type.replace(/-/g, ' ')}</span>
                  </p>
                </div>
                <p className="font-bold text-teal shrink-0">{formatCurrency(c.commission_amount)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleReceived(c)
                }}
                className={`badge mt-2 ${c.payment_status === 'Received' ? 'bg-green-700' : 'bg-orange-500'}`}
              >
                {c.payment_status}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Commission">
        <CommissionForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Commission">
        {editing && <CommissionForm commission={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
