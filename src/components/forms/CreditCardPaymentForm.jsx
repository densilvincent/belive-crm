import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useCreditCardPayments } from '../../hooks/useCreditCardPayments'
import { todayISO } from '../../lib/formatters'

const emptyForm = { date: todayISO(), amount: '', tag: 'fuel', notes: '' }

export default function CreditCardPaymentForm({ onDone, onCancel }) {
  const { user } = useAuth()
  const { insert } = useCreditCardPayments()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount) {
      toast.error('Amount is required')
      return
    }
    setSaving(true)
    try {
      await insert({
        date: form.date,
        amount: Number(form.amount) || 0,
        tag: form.tag,
        notes: form.notes,
        user_id: user.id,
      })
      toast.success('Card payment recorded')
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not record payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500">Record a payment made toward the credit card balance.</p>
      <div>
        <label className="label">Date</label>
        <input type="date" className="input-field" value={form.date} onChange={set('date')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount Paid (₹)</label>
          <input type="number" className="input-field" value={form.amount} onChange={set('amount')} required />
        </div>
        <div>
          <label className="label">Tag</label>
          <select className="input-field" value={form.tag} onChange={set('tag')}>
            <option value="fuel">Fuel</option>
            <option value="other">Other</option>
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
          {saving ? 'Saving…' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}
