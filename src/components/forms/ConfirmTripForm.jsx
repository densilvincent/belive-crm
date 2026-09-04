import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTrips } from '../../hooks/useTrips'
import { useDrivers } from '../../hooks/useDrivers'
import { useHotels } from '../../hooks/useHotels'
import { PAYMENT_STATUSES } from '../../lib/constants'

export default function ConfirmTripForm({ trip, onDone, onCancel }) {
  const { update } = useTrips()
  const { data: drivers } = useDrivers()
  const { data: hotels } = useHotels()
  const [form, setForm] = useState({
    driver_assigned: trip.driver_assigned || '',
    hotel_assigned: trip.hotel_assigned || '',
    houseboat_assigned: trip.houseboat_assigned || '',
    driver_commission: trip.driver_commission ?? '',
    cab_rental_charge: trip.cab_rental_charge ?? '',
    external_driver_charge: trip.external_driver_charge ?? '',
    amount_received: trip.amount_received ?? '',
    payment_status: trip.payment_status || 'Unpaid',
    trip_status: 'Quote-Confirmed',
  })
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const num = (v) => (v === '' ? null : Number(v))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await update(trip.id, {
        driver_assigned: form.driver_assigned || null,
        hotel_assigned: form.hotel_assigned || null,
        houseboat_assigned: form.houseboat_assigned || null,
        driver_commission: num(form.driver_commission),
        cab_rental_charge: num(form.cab_rental_charge),
        external_driver_charge: num(form.external_driver_charge),
        amount_received: num(form.amount_received) ?? 0,
        payment_status: form.payment_status,
        trip_status: form.trip_status,
      })
      toast.success('Quote confirmed')
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not confirm quote')
    } finally {
      setSaving(false)
    }
  }

  const hotelOptions = hotels.filter((h) => h.type === 'hotel')
  const houseboatOptions = hotels.filter((h) => h.type === 'houseboat')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Driver</label>
        <select className="input-field" value={form.driver_assigned} onChange={set('driver_assigned')}>
          <option value="">To be confirmed</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.vehicle_assigned ? `— ${d.vehicle_assigned}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Hotel</label>
          <select className="input-field" value={form.hotel_assigned} onChange={set('hotel_assigned')}>
            <option value="">None</option>
            {hotelOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Houseboat</label>
          <select className="input-field" value={form.houseboat_assigned} onChange={set('houseboat_assigned')}>
            <option value="">None</option>
            {houseboatOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Driver Commission (₹)</label>
          <input type="number" className="input-field" value={form.driver_commission} onChange={set('driver_commission')} />
        </div>
        <div>
          <label className="label">Cab Rental (₹)</label>
          <input type="number" className="input-field" value={form.cab_rental_charge} onChange={set('cab_rental_charge')} />
        </div>
        <div>
          <label className="label">External Driver Charge (₹)</label>
          <input type="number" className="input-field" value={form.external_driver_charge} onChange={set('external_driver_charge')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount Received (₹)</label>
          <input type="number" className="input-field" value={form.amount_received} onChange={set('amount_received')} />
        </div>
        <div>
          <label className="label">Payment Status</label>
          <select className="input-field" value={form.payment_status} onChange={set('payment_status')}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-outline flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Saving…' : 'Confirm'}
        </button>
      </div>
    </form>
  )
}
