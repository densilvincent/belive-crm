import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useOverhead } from '../hooks/useOverhead'
import { formatCurrency, formatDate, startOfMonthISO, endOfMonthISO, exportToCSV } from '../lib/formatters'
import { dailyOverheadTotal, fuelCost, sum } from '../lib/calc'
import { CHART_COLORS } from '../lib/constants'
import DateRangePicker from '../components/common/DateRangePicker'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Icon from '../components/common/Icon'
import OverheadForm from '../components/forms/OverheadForm'

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
  const [start, setStart] = useState(startOfMonthISO())
  const [end, setEnd] = useState(endOfMonthISO())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, start, end]
  )

  const monthlyTotal = sum(filtered, dailyOverheadTotal)
  const pieData = CATEGORIES.map((c) => ({ name: c.label, value: sum(filtered, c.value) })).filter((d) => d.value > 0)

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

      <div className="card bg-teal/5 border-teal/20 text-center">
        <p className="text-xs text-gray-400">Monthly Total</p>
        <p className="font-display font-bold text-2xl text-teal">{formatCurrency(monthlyTotal)}</p>
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
        <button className="btn-outline" onClick={handleExport} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

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
    </div>
  )
}
