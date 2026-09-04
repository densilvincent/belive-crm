import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useTrips } from '../../hooks/useTrips'
import { useItineraries } from '../../hooks/useItineraries'
import { TRIP_TYPES, TRIP_STATUSES } from '../../lib/constants'
import { todayISO } from '../../lib/formatters'

const emptyForm = {
  date: todayISO(),
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  trip_type: '1-on-1-cab',
  itinerary_id: '',
  amount_quoted: '',
  trip_status: 'Quote-Generated',
  notes: '',
}

export default function TripForm({ trip, initial, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useTrips()
  const { data: itineraries } = useItineraries()
  const [form, setForm] = useState(
    trip
      ? {
          date: trip.date,
          customer_name: trip.customer_name || '',
          customer_phone: trip.customer_phone || '',
          customer_email: trip.customer_email || '',
          trip_type: trip.trip_type,
          itinerary_id: trip.itinerary_id || '',
          amount_quoted: trip.amount_quoted ?? '',
          trip_status: trip.trip_status,
          notes: trip.notes || '',
        }
      : { ...emptyForm, ...initial }
  )
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_name.trim()) {
      toast.error('Customer name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        itinerary_id: form.trip_type === 'tour-package' && form.itinerary_id ? form.itinerary_id : null,
        amount_quoted: form.amount_quoted === '' ? 0 : Number(form.amount_quoted),
      }
      if (trip) {
        await update(trip.id, payload)
        toast.success('Trip updated')
      } else {
        await insert({ ...payload, user_id: user.id, created_by: user.id })
        toast.success('Trip added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save trip')
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
          <label className="label">Trip Type</label>
          <select className="input-field" value={form.trip_type} onChange={set('trip_type')}>
            {TRIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {form.trip_type === 'tour-package' && (
        <div>
          <label className="label">Itinerary</label>
          <select className="input-field" value={form.itinerary_id} onChange={set('itinerary_id')}>
            <option value="">Select itinerary…</option>
            {itineraries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.destination}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Customer Name</label>
        <input className="input-field" value={form.customer_name} onChange={set('customer_name')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Phone</label>
          <input type="tel" className="input-field" value={form.customer_phone} onChange={set('customer_phone')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input-field" value={form.customer_email} onChange={set('customer_email')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount Quoted (₹)</label>
          <input type="number" min="0" step="1" className="input-field" value={form.amount_quoted} onChange={set('amount_quoted')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.trip_status} onChange={set('trip_status')}>
            {TRIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
          {saving ? 'Saving…' : trip ? 'Save Changes' : 'Add Trip'}
        </button>
      </div>
    </form>
  )
}
