import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useDrivers } from '../../hooks/useDrivers'

const emptyForm = { name: '', phone: '', vehicle_assigned: '', status: 'Active' }

export default function DriverForm({ driver, onDone, onCancel }) {
  const { user } = useAuth()
  const { insert, update } = useDrivers()
  const [form, setForm] = useState(
    driver
      ? { name: driver.name, phone: driver.phone || '', vehicle_assigned: driver.vehicle_assigned || '', status: driver.status }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Driver name is required')
      return
    }
    setSaving(true)
    try {
      if (driver) {
        await update(driver.id, form)
        toast.success('Driver updated')
      } else {
        await insert({ ...form, user_id: user.id })
        toast.success('Driver added')
      }
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not save driver')
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
      <div>
        <label className="label">Phone</label>
        <input type="tel" className="input-field" value={form.phone} onChange={set('phone')} />
      </div>
      <div>
        <label className="label">Vehicle Assigned</label>
        <input className="input-field" value={form.vehicle_assigned} onChange={set('vehicle_assigned')} />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input-field" value={form.status} onChange={set('status')}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-outline flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Saving…' : driver ? 'Save Changes' : 'Add Driver'}
        </button>
      </div>
    </form>
  )
}
