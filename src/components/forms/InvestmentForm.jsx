import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useInvestments } from '../../hooks/useInvestments'
import { todayISO } from '../../lib/formatters'

const emptyForm = {
  date: todayISO(),
  vehicle_name: '',
  expected_monthly_return: '',
  actual_amount_received: '',
  payment_status: 'Pending',
  notes: '',
}

export default function InvestmentForm({ investment, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useInvestments()
  const [form, setForm] = useState(
    investment
      ? {
          date: investment.date,
          vehicle_name: investment.vehicle_name,
          expected_monthly_return: investment.expected_monthly_return,
          actual_amount_received: investment.actual_amount_received,
          payment_status: investment.payment_status,
          notes: investment.notes || '',
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehicle_name.trim()) {
      toast.error('Vehicle name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        expected_monthly_return: Number(form.expected_monthly_return) || 0,
        actual_amount_received: Number(form.actual_amount_received) || 0,
      }
      if (investment) {
        await update(investment.id, payload)
        toast.success('Investment updated')
      } else {
        await insert({ ...payload, user_id: user.id })
        toast.success('Investment added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save investment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Vehicle</label>
        <input className="input-field" value={form.vehicle_name} onChange={set('vehicle_name')} required />
      </div>
      <div>
        <label className="label">Date</label>
        <input type="date" className="input-field" value={form.date} onChange={set('date')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Expected (₹)</label>
          <input type="number" className="input-field" value={form.expected_monthly_return} onChange={set('expected_monthly_return')} />
        </div>
        <div>
          <label className="label">Actual Received (₹)</label>
          <input type="number" className="input-field" value={form.actual_amount_received} onChange={set('actual_amount_received')} />
        </div>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input-field" value={form.payment_status} onChange={set('payment_status')}>
          <option value="Pending">Pending</option>
          <option value="Received">Received</option>
        </select>
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
          {saving ? 'Saving…' : investment ? 'Save Changes' : 'Add Investment'}
        </button>
      </div>
    </form>
  )
}
