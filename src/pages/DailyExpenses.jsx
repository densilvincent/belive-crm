import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useOverhead } from '../hooks/useOverhead'
import { useCreditCardPayments } from '../hooks/useCreditCardPayments'
import { formatCurrency, formatDate, startOfMonthISO, endOfMonthISO, exportToCSV } from '../lib/formatters'
import { dailyOverheadTotal, fuelCost, sum } from '../lib/calc'
import { CHART_COLORS } from '../lib/constants'
import DateRangePicker from '../components/common/DateRangePicker'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Icon from '../components/common/Icon'
import OverheadForm from '../components/forms/OverheadForm'
import CreditCardPaymentForm from '../components/forms/CreditCardPaymentForm'

const CATEGORIES = [
  { label: 'Fuel', value: fuelCost },
  { label: 'Maintenance', value: (e) => e.maintenance_cost },
  { label: 'Spare Parts', value: (e) => e.spare_parts_cost },
  { label: 'Washing', value: (e) => e.washing_cost },
  { label: 'Insurance', value: (e) => e.insurance_daily_allocation },
  { label: 'Other', value: (e) => e.other_overhead },
]

export default function DailyExpenses() {
  const { data: expenses, loading } = useOverhead()
  const { data: payments, loading: paymentsLoading } = useCreditCardPayments()
  const [start, setStart] = useState(startOfMonthISO())
  const [end, setEnd] = useState(endOfMonthISO())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [payingCard, setPayingCard] = useState(false)

  const filtered = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, start, end]
  )

  const monthlyTotal = sum(filtered, dailyOverheadTotal)
  const pieData = CATEGORIES.map((c) => ({ name: c.label, value: sum(filtered, c.value) })).filter((d) => d.value > 0)

  // Running card balance, not date-range-scoped: total fuel ever charged
  // minus total ever paid toward it. Partial payments don't map 1:1 to any
  // single fill-up, so this is a ledger rather than a per-entry flag.
  const totalFuelCharged = sum(expenses, fuelCost)
  const totalFuelPaid = sum(
    payments.filter((p) => p.tag === 'fuel'),
    (p) => p.amount
  )
  const pendingFuelTotal = Math.max(0, totalFuelCharged - totalFuelPaid)

  const recentPayments = useMemo(() => [...payments].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5), [payments])

  const handleExport = () => {
    exportToCSV(
      `belive-expenses-${start}-to-${end}.csv`,
      filtered.map((e) => ({
        date: e.date,
        fuel_liters: e.fuel_liters,
        fuel_cost_per_liter: e.fuel_cost_per_liter,
        fuel_total: fuelCost(e),
        maintenance: e.maintenance_cost,
        spare_parts: e.spare_parts_cost,
        washing: e.washing_cost,
        insurance: e.insurance_daily_allocation,
        other: e.other_overhead,
        total: dailyOverheadTotal(e),
      }))
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl">Daily Expenses</h1>
      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />

      <div className="grid grid-cols-2 gap-2">
        <div className="card bg-teal/5 border-teal/20 text-center">
          <p className="text-xs text-gray-400">Monthly Total</p>
          <p className="font-display font-bold text-2xl text-teal">{formatCurrency(monthlyTotal)}</p>
        </div>
        <div className="card bg-orange-500/5 border-orange-500/20 text-center">
          <p className="text-xs text-gray-400">Fuel Card Pending</p>
          <p className="font-display font-bold text-2xl text-orange-600">{formatCurrency(pendingFuelTotal)}</p>
        </div>
      </div>

      {pieData.length > 0 && (
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
      )}

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Add Expense
        </button>
        <button className="btn-secondary" onClick={() => setPayingCard(true)}>
          <Icon name="plus" size={16} /> Pay Credit Card
        </button>
      </div>
      <button className="btn-outline w-full" onClick={handleExport} disabled={filtered.length === 0}>
        Export CSV
      </button>

      {!paymentsLoading && recentPayments.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base mb-2">Recent Card Payments</h2>
          <div className="card divide-y divide-gray-50">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-gray-700">{formatDate(p.date)}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.tag}</p>
                </div>
                <p className="font-bold text-teal">{formatCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No expenses in this range" />
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} className="card" onClick={() => setEditing(e)}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-semibold text-sm">{formatDate(e.date)}</p>
                <p className="font-bold text-teal">{formatCurrency(dailyOverheadTotal(e))}</p>
              </div>
              <p className="text-xs text-gray-400">
                {fuelCost(e) > 0 && <>Fuel {formatCurrency(fuelCost(e))} ({e.fuel_liters}L) · </>}
                Maint {formatCurrency(e.maintenance_cost)} · Parts {formatCurrency(e.spare_parts_cost)} · Wash{' '}
                {formatCurrency(e.washing_cost)} · Ins {formatCurrency(e.insurance_daily_allocation)} · Other{' '}
                {formatCurrency(e.other_overhead)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Daily Expense">
        <OverheadForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Expense">
        {editing && <OverheadForm expense={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={payingCard} onClose={() => setPayingCard(false)} title="Pay Credit Card">
        <CreditCardPaymentForm onDone={() => setPayingCard(false)} onCancel={() => setPayingCard(false)} />
      </Modal>
    </div>
  )
}
