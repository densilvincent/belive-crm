import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useHotels } from '../hooks/useHotels'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SwipeableRow from '../components/common/SwipeableRow'
import Icon from '../components/common/Icon'
import HotelForm from '../components/forms/HotelForm'

export default function Accommodations() {
  const { isOwner } = useAuth()
  const { data: hotels, loading, remove } = useHotels()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async () => {
    try {
      await remove(deleting.id)
      toast.success('Removed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Accommodations</h1>
      </div>

      <button className="btn-primary w-full" onClick={() => setCreating(true)}>
        <Icon name="plus" size={18} /> Add Hotel / Houseboat
      </button>

      {hotels.length === 0 ? (
        <EmptyState title="No accommodations yet" />
      ) : (
        <div className="space-y-2">
          {hotels.map((h) => (
            <SwipeableRow key={h.id} disabled={!isOwner} onDelete={() => setDeleting(h)}>
              <div className="card flex items-center justify-between gap-2" onClick={() => setEditing(h)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-display font-semibold text-sm truncate">{h.name}</p>
                    <span
                      className={`badge ${h.type === 'hotel' ? 'bg-teal' : 'bg-brandgreen'}`}
                    >
                      {h.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{h.location}</p>
                </div>
                {h.contact_phone && (
                  <a
                    href={`tel:${h.contact_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 min-h-touch min-w-touch flex items-center justify-center text-teal"
                    aria-label={`Call ${h.name}`}
                  >
                    <Icon name="phone" size={18} />
                  </a>
                )}
              </div>
            </SwipeableRow>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add Hotel / Houseboat">
        <HotelForm onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit">
        {editing && <HotelForm hotel={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Remove this listing?"
        message={`"${deleting?.name}" will be permanently removed.`}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
