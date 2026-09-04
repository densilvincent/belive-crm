import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useItineraries } from '../../hooks/useItineraries'
import Icon from '../common/Icon'

const emptyForm = { name: '', destination: '', duration_days: '', description: '', base_price: '', is_prebuilt: false }

export default function ItineraryForm({ itinerary, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useItineraries()
  const [form, setForm] = useState(
    itinerary
      ? {
          name: itinerary.name,
          destination: itinerary.destination || '',
          duration_days: itinerary.duration_days || '',
          description: itinerary.description || '',
          base_price: itinerary.base_price,
          is_prebuilt: itinerary.is_prebuilt,
        }
      : emptyForm
  )
  const [days, setDays] = useState(
    itinerary?.day_by_day_itinerary?.length
      ? itinerary.day_by_day_itinerary
      : [{ day_number: 1, activities: '', accommodation_type: '', meal_plan: '' }]
  )
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const addDay = () => setDays((d) => [...d, { day_number: d.length + 1, activities: '', accommodation_type: '', meal_plan: '' }])
  const removeDay = (idx) => setDays((d) => d.filter((_, i) => i !== idx).map((day, i) => ({ ...day, day_number: i + 1 })))
  const updateDay = (idx, key, value) => setDays((d) => d.map((day, i) => (i === idx ? { ...day, [key]: value } : day)))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Itinerary name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        duration_days: Number(form.duration_days) || days.length,
        base_price: Number(form.base_price) || 0,
        day_by_day_itinerary: days,
      }
      if (itinerary) {
        await update(itinerary.id, payload)
        toast.success('Itinerary updated')
      } else {
        await insert({ ...payload, user_id: user.id })
        toast.success('Itinerary created')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save itinerary')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input className="input-field" value={form.name} onChange={set('name')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Destination</label>
          <input className="input-field" value={form.destination} onChange={set('destination')} />
        </div>
        <div>
          <label className="label">Duration (days)</label>
          <input type="number" min="1" className="input-field" value={form.duration_days} onChange={set('duration_days')} />
        </div>
      </div>
      <div>
        <label className="label">Base Price (₹)</label>
        <input type="number" min="0" className="input-field" value={form.base_price} onChange={set('base_price')} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field" rows={2} value={form.description} onChange={set('description')} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Day-by-Day</label>
          <button type="button" onClick={addDay} className="text-xs text-teal font-semibold flex items-center gap-1">
            <Icon name="plus" size={14} /> Add Day
          </button>
        </div>
        <div className="space-y-3">
          {days.map((day, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal">Day {day.day_number}</span>
                {days.length > 1 && (
                  <button type="button" onClick={() => removeDay(idx)} className="text-red-500" aria-label="Remove day">
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
              <textarea
                placeholder="Activities"
                className="input-field mb-2 text-sm"
                rows={2}
                value={day.activities}
                onChange={(e) => updateDay(idx, 'activities', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Accommodation"
                  className="input-field text-sm"
                  value={day.accommodation_type}
                  onChange={(e) => updateDay(idx, 'accommodation_type', e.target.value)}
                />
                <input
                  placeholder="Meal plan"
                  className="input-field text-sm"
                  value={day.meal_plan}
                  onChange={(e) => updateDay(idx, 'meal_plan', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-outline flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Saving…' : itinerary ? 'Save Changes' : 'Save Itinerary'}
        </button>
      </div>
    </form>
  )
}
