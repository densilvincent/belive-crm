import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useItineraries } from '../hooks/useItineraries'
import { formatCurrency } from '../lib/formatters'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Icon from '../components/common/Icon'
import ItineraryForm from '../components/forms/ItineraryForm'
import TripForm from '../components/forms/TripForm'

export default function ItineraryLibrary() {
  const { isOwner } = useAuth()
  const { data: itineraries, loading, remove } = useItineraries()
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [useForQuote, setUseForQuote] = useState(null)

  const prebuilt = itineraries.filter((i) => i.is_prebuilt)
  const custom = itineraries.filter((i) => !i.is_prebuilt)

  const handleDelete = async () => {
    try {
      await remove(deleting.id)
      toast.success('Itinerary deleted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
      setDetail(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Itinerary Library</h1>
        <button className="btn-primary w-auto text-sm px-3 py-2 min-h-[40px]" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> Create New
        </button>
      </div>

      <section>
        <h2 className="font-display font-semibold text-base mb-2">Pre-Built</h2>
        {prebuilt.length === 0 ? (
          <EmptyState title="No pre-built itineraries yet" subtitle="Create one and mark it as pre-built from the Owner tools." />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory">
            {prebuilt.map((it) => (
              <ItineraryCard key={it.id} itinerary={it} onClick={() => setDetail(it)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-semibold text-base mb-2">Custom Itineraries</h2>
        {custom.length === 0 ? (
          <EmptyState title="No custom itineraries yet" />
        ) : (
          <div className="space-y-2">
            {custom.map((it) => (
              <div key={it.id} className="card flex items-center justify-between gap-2 cursor-pointer" onClick={() => setDetail(it)}>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{it.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {it.destination} · {it.duration_days} day(s)
                  </p>
                </div>
                <p className="font-bold text-teal shrink-0">{formatCurrency(it.base_price)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name}>
        {detail && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                {detail.destination} · {detail.duration_days} day(s)
              </p>
              {detail.description && <p className="text-sm text-gray-600 mt-2">{detail.description}</p>}
              <p className="font-display font-bold text-xl text-teal mt-2">{formatCurrency(detail.base_price)}</p>
            </div>

            {(detail.day_by_day_itinerary || []).length > 0 && (
              <div className="space-y-2">
                {detail.day_by_day_itinerary.map((day, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-teal mb-1">Day {day.day_number}</p>
                    <p className="text-sm text-gray-700">{day.activities}</p>
                    {(day.accommodation_type || day.meal_plan) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {day.accommodation_type} {day.meal_plan && `· ${day.meal_plan}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary w-full" onClick={() => setUseForQuote(detail)}>
              Use for Quote
            </button>

            {isOwner && (
              <div className="flex gap-2">
                <button
                  className="btn-outline flex-1"
                  onClick={() => {
                    setEditing(detail)
                    setDetail(null)
                  }}
                >
                  Edit
                </button>
                <button className="btn-danger flex-1" onClick={() => setDeleting(detail)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="Create Itinerary">
        <ItineraryForm onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Itinerary">
        {editing && <ItineraryForm itinerary={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!useForQuote} onClose={() => setUseForQuote(null)} title="New Quote">
        {useForQuote && (
          <TripForm
            initial={{ trip_type: 'tour-package', itinerary_id: useForQuote.id, amount_quoted: useForQuote.base_price }}
            onDone={() => setUseForQuote(null)}
            onCancel={() => setUseForQuote(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete itinerary?"
        message={`"${deleting?.name}" will be permanently removed.`}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function ItineraryCard({ itinerary, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card min-w-[220px] snap-start text-left shrink-0 hover:shadow-md transition"
    >
      <div className="h-24 rounded-lg bg-gradient-to-br from-teal to-brandgreen mb-3 flex items-center justify-center text-white font-display font-bold text-sm px-2 text-center">
        {itinerary.destination || itinerary.name}
      </div>
      <p className="font-display font-semibold text-sm truncate">{itinerary.name}</p>
      <p className="text-xs text-gray-400 mb-1">{itinerary.duration_days} day(s)</p>
      <p className="font-bold text-teal">{formatCurrency(itinerary.base_price)}</p>
    </button>
  )
}
