import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTrips } from '../hooks/useTrips'
import { useDrivers } from '../hooks/useDrivers'
import { useHotels } from '../hooks/useHotels'
import { useItineraries } from '../hooks/useItineraries'
import { formatCurrency, formatDate } from '../lib/formatters'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import ConfirmTripForm from '../components/forms/ConfirmTripForm'
import { buildWhatsAppLink } from '../lib/whatsapp'

export default function QuoteManagement() {
  const { data: trips, loading, update: updateTrip } = useTrips()
  const { data: drivers } = useDrivers()
  const { data: hotels } = useHotels()
  const { data: itineraries } = useItineraries()
  const [confirmingTrip, setConfirmingTrip] = useState(null)
  const [generatingPdfId, setGeneratingPdfId] = useState(null)

  const driverById = (id) => drivers.find((d) => d.id === id)
  const hotelById = (id) => hotels.find((h) => h.id === id)
  const itineraryById = (id) => itineraries.find((i) => i.id === id)

  const stage1 = useMemo(() => trips.filter((t) => ['Quote-Generated', 'Quote-Sent'].includes(t.trip_status)), [trips])
  const stage2 = useMemo(() => trips.filter((t) => t.trip_status === 'Quote-Confirmed'), [trips])

  const markSent = async (trip) => {
    try {
      await updateTrip(trip.id, { trip_status: 'Quote-Sent', pdf_quote_sent_date: new Date().toISOString() })
      toast.success('Marked as sent')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleGeneratePdf = async (trip) => {
    setGeneratingPdfId(trip.id)
    try {
      const { downloadQuotePDF } = await import('../lib/pdfGenerator')
      await downloadQuotePDF({
        trip,
        itinerary: itineraryById(trip.itinerary_id),
        hotel: hotelById(trip.hotel_assigned) || hotelById(trip.houseboat_assigned),
        driver: driverById(trip.driver_assigned),
      })
      await updateTrip(trip.id, { pdf_quote_generated: true })
      toast.success('Quote PDF downloaded')
    } catch (err) {
      toast.error(err.message || 'Could not generate PDF')
    } finally {
      setGeneratingPdfId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-xl">Quote Management</h1>

      <section>
        <h2 className="font-display font-semibold text-base mb-2">Stage 1 · Quote Generated</h2>
        {stage1.length === 0 ? (
          <EmptyState title="No open quotes" />
        ) : (
          <div className="space-y-2">
            {stage1.map((trip) => (
              <div key={trip.id} className="card">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm truncate">{trip.customer_name}</p>
                    <p className="text-xs text-gray-400">{trip.quote_id} · {formatDate(trip.date)}</p>
                  </div>
                  <StatusBadge status={trip.trip_status} />
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {itineraryById(trip.itinerary_id)?.name || trip.trip_type} · Base {formatCurrency(trip.amount_quoted)}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    className="btn-outline text-xs py-2 min-h-[40px]"
                    disabled={generatingPdfId === trip.id}
                    onClick={() => handleGeneratePdf(trip)}
                  >
                    {generatingPdfId === trip.id ? '…' : 'View PDF'}
                  </button>
                  <a className="btn-outline text-xs py-2 min-h-[40px]" href={buildWhatsAppLink(trip)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                  <button className="btn-outline text-xs py-2 min-h-[40px]" onClick={() => markSent(trip)} disabled={trip.trip_status === 'Quote-Sent'}>
                    Mark Sent
                  </button>
                </div>
                <button className="btn-primary w-full text-xs py-2 min-h-[40px]" onClick={() => setConfirmingTrip(trip)}>
                  Confirm Quote
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-semibold text-base mb-2">Stage 2 · Quote Confirmed</h2>
        {stage2.length === 0 ? (
          <EmptyState title="No confirmed quotes awaiting booking" />
        ) : (
          <div className="space-y-2">
            {stage2.map((trip) => (
              <div key={trip.id} className="card flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{trip.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {driverById(trip.driver_assigned)?.name || 'No driver'} · {hotelById(trip.hotel_assigned)?.name || 'No hotel'}
                  </p>
                </div>
                <button className="btn-outline text-xs py-2 px-3 min-h-[40px] shrink-0" onClick={() => setConfirmingTrip(trip)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!confirmingTrip} onClose={() => setConfirmingTrip(null)} title="Confirm Quote">
        {confirmingTrip && (
          <ConfirmTripForm trip={confirmingTrip} onDone={() => setConfirmingTrip(null)} onCancel={() => setConfirmingTrip(null)} />
        )}
      </Modal>
    </div>
  )
}
