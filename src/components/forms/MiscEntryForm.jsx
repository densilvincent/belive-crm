import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useMiscEntries } from '../../hooks/useMiscEntries'
import { todayISO } from '../../lib/formatters'

const emptyForm = { date: todayISO(), misc_expense: '', misc_income: '', notes: '' }

export default function MiscEntryForm({ entry, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useMiscEntries()
  const [form, setForm] = useState(
    entry
      ? {
          date: entry.date,
          misc_expense: entry.misc_expense ?? '',
          misc_income: entry.misc_income ?? '',
          notes: entry.notes || '',
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
        misc_expense: Number(form.misc_expense) || 0,
        misc_income: Number(form.misc_income) || 0,
        notes: form.notes,
      }
      if (entry) {
        await update(entry.id, payload)
        toast.success('Day-end summary updated')
      } else {
        await insert({ ...payload, user_id: user.id })
        toast.success('Day-end summary added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save summary')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500">
        For a day you'd rather not itemize — one overall expense total and one overall income total, uncategorized.
      </p>
      <div>
        <label className="label">Date</label>
        <input type="date" className="input-field" value={form.date} onChange={set('date')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Overall Expense (₹)</label>
          <input type="number" className="input-field" value={form.misc_expense} onChange={set('misc_expense')} />
        </div>
        <div>
          <label className="label">Overall Income (₹)</label>
          <input type="number" className="input-field" value={form.misc_income} onChange={set('misc_income')} />
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
          {saving ? 'Saving…' : entry ? 'Save Changes' : 'Add Summary'}
        </button>
      </div>
    </form>
  )
}
