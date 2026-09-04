import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useOverhead } from '../../hooks/useOverhead'
import { todayISO } from '../../lib/formatters'

const emptyForm = {
  date: todayISO(),
  maintenance_cost: '',
  spare_parts_cost: '',
  washing_cost: '',
  insurance_daily_allocation: '',
  other_overhead: '',
  notes: '',
}

export default function OverheadForm({ expense, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useOverhead()
  const [form, setForm] = useState(
    expense
      ? {
          date: expense.date,
          maintenance_cost: expense.maintenance_cost ?? '',
          spare_parts_cost: expense.spare_parts_cost ?? '',
          washing_cost: expense.washing_cost ?? '',
          insurance_daily_allocation: expense.insurance_daily_allocation ?? '',
          other_overhead: expense.other_overhead ?? '',
          notes: expense.notes || '',
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        maintenance_cost: Number(form.maintenance_cost) || 0,
        spare_parts_cost: Number(form.spare_parts_cost) || 0,
        washing_cost: Number(form.washing_cost) || 0,
        insurance_daily_allocation: Number(form.insurance_daily_allocation) || 0,
        other_overhead: Number(form.other_overhead) || 0,
        notes: form.notes,
      }
      if (expense) {
        await update(expense.id, payload)
        toast.success('Expense updated')
      } else {
        await insert({ ...payload, user_id: user.id })
        toast.success('Expense added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Date</label>
        <input type="date" className="input-field" value={form.date} onChange={set('date')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Maintenance (₹)</label>
          <input type="number" className="input-field" value={form.maintenance_cost} onChange={set('maintenance_cost')} />
        </div>
        <div>
          <label className="label">Spare Parts (₹)</label>
          <input type="number" className="input-field" value={form.spare_parts_cost} onChange={set('spare_parts_cost')} />
        </div>
        <div>
          <label className="label">Washing (₹)</label>
          <input type="number" className="input-field" value={form.washing_cost} onChange={set('washing_cost')} />
        </div>
        <div>
          <label className="label">Insurance Allocation (₹)</label>
          <input
            type="number"
            className="input-field"
            value={form.insurance_daily_allocation}
            onChange={set('insurance_daily_allocation')}
          />
        </div>
      </div>
      <div>
        <label className="label">Other Overhead (₹)</label>
        <input type="number" className="input-field" value={form.other_overhead} onChange={set('other_overhead')} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-outline flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Saving…' : expense ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
