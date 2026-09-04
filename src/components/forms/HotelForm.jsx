import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useHotels } from '../../hooks/useHotels'

const emptyForm = {
  name: '',
  type: 'hotel',
  location: '',
  check_in_time: '',
  check_out_time: '',
  contact_phone: '',
  contact_email: '',
  notes: '',
}

export default function HotelForm({ hotel, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useHotels()
  const [form, setForm] = useState(
    hotel
      ? {
          name: hotel.name,
          type: hotel.type,
          location: hotel.location || '',
          check_in_time: hotel.check_in_time || '',
          check_out_time: hotel.check_out_time || '',
          contact_phone: hotel.contact_phone || '',
          contact_email: hotel.contact_email || '',
          notes: hotel.notes || '',
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      if (hotel) {
        await update(hotel.id, form)
        toast.success('Updated')
      } else {
        await insert({ ...form, user_id: user.id })
        toast.success('Added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input-field" value={form.type} onChange={set('type')}>
            <option value="hotel">Hotel</option>
            <option value="houseboat">Houseboat</option>
          </select>
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input-field" value={form.location} onChange={set('location')} />
        </div>
      </div>
      <div>
        <label className="label">Name</label>
        <input className="input-field" value={form.name} onChange={set('name')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Check-in</label>
          <input placeholder="e.g. 12:00 PM" className="input-field" value={form.check_in_time} onChange={set('check_in_time')} />
        </div>
        <div>
          <label className="label">Check-out</label>
          <input placeholder="e.g. 11:00 AM" className="input-field" value={form.check_out_time} onChange={set('check_out_time')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Contact Phone</label>
          <input type="tel" className="input-field" value={form.contact_phone} onChange={set('contact_phone')} />
        </div>
        <div>
          <label className="label">Contact Email</label>
          <input type="email" className="input-field" value={form.contact_email} onChange={set('contact_email')} />
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
          {saving ? 'Saving…' : hotel ? 'Save Changes' : 'Add'}
        </button>
      </div>
    </form>
  )
}
