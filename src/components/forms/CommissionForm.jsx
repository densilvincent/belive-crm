import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useCommissions } from '../../hooks/useCommissions'
import { COMMISSION_TYPES } from '../../lib/constants'
import { todayISO } from '../../lib/formatters'

const emptyForm = {
  date: todayISO(),
  commission_type: 'hotel',
  operator_or_source: '',
  commission_amount: '',
  payment_status: 'Pending',
  notes: '',
}

export default function CommissionForm({ commission, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useCommissions()
  const [form, setForm] = useState(
    commission
      ? {
          date: commission.date,
          commission_type: commission.commission_type,
          operator_or_source: commission.operator_or_source || '',
          commission_amount: commission.commission_amount,
          payment_status: commission.payment_status,
          notes: commission.notes || '',
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, commission_amount: Number(form.commission_amount) || 0 }
      if (commission) {
        await update(commission.id, payload)
        toast.success('Commission updated')
      } else {
        await insert({ ...payload, user_id: user.id, created_by: user.id })
        toast.success('Commission added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save commission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input-field" value={form.date} onChange={set('date')} required />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input-field" value={form.commission_type} onChange={set('commission_type')}>
            {COMMISSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Source / Operator</label>
        <input
          className="input-field"
          placeholder="e.g. Taj Hotel, Kumarakom Houseboat"
          value={form.operator_or_source}
          onChange={set('operator_or_source')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (₹)</label>
          <input type="number" min="0" className="input-field" value={form.commission_amount} onChange={set('commission_amount')} required />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.payment_status} onChange={set('payment_status')}>
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
          </select>
        </div>
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
          {saving ? 'Saving…' : commission ? 'Save Changes' : 'Add Commission'}
        </button>
      </div>
    </form>
  )
}
