import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useDrivers } from '../hooks/useDrivers'
import { formatDateTime } from '../lib/formatters'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Icon from '../components/common/Icon'
import DriverForm from '../components/forms/DriverForm'

export default function Settings() {
  const { user, role, signOut } = useAuth()
  const { data: drivers, loading, remove } = useDrivers()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleDelete = async () => {
    try {
      await remove(deleting.id)
      toast.success('Driver removed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-xl">Settings</h1>

      <section className="card space-y-2">
        <h2 className="font-display font-semibold text-sm text-gray-500">Login Info</h2>
        <Row label="Email" value={user?.email} />
        <Row label="Role" value={role} capitalize />
        <Row label="Last Sign In" value={formatDateTime(user?.last_sign_in_at)} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display font-semibold text-base">Drivers Management</h2>
          <button className="text-teal text-sm font-semibold flex items-center gap-1" onClick={() => setAdding(true)}>
            <Icon name="plus" size={14} /> Add Driver
          </button>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : drivers.length === 0 ? (
          <EmptyState title="No drivers yet" />
        ) : (
          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.id} className="card flex items-center justify-between gap-2">
                <div className="min-w-0" onClick={() => setEditing(d)}>
                  <p className="font-display font-semibold text-sm truncate">{d.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {d.phone} {d.vehicle_assigned && `· ${d.vehicle_assigned}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${d.status === 'Active' ? 'bg-green-600' : 'bg-gray-400'}`}>{d.status}</span>
                  <button onClick={() => setDeleting(d)} className="text-red-500 min-h-touch min-w-touch flex items-center justify-center">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="btn-danger w-full" onClick={() => setConfirmLogout(true)}>
        Logout
      </button>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Driver">
        <DriverForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Driver">
        {editing && <DriverForm driver={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Remove this driver?"
        message={`"${deleting?.name}" will be permanently removed.`}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need to sign in again to access the CRM."
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          signOut()
        }}
      />
    </div>
  )
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`text-gray-800 font-medium ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</span>
    </div>
  )
}
