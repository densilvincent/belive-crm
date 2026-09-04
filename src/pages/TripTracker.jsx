import { useMemo, useState } from 'react'
import { useTrips } from '../hooks/useTrips'
import { useDrivers } from '../hooks/useDrivers'
import { useHotels } from '../hooks/useHotels'
import { useItineraries } from '../hooks/useItineraries'
import { tripCost, tripProfit, sum } from '../lib/calc'
import { formatCurrency, formatDate, startOfMonthISO, endOfMonthISO, exportToCSV } from '../lib/formatters'
import StatusBadge from '../components/common/StatusBadge'
import ProfitBadge from '../components/common/ProfitBadge'
import DateRangePicker from '../components/common/DateRangePicker'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import TripForm from '../components/forms/TripForm'
import ConfirmTripForm from '../components/forms/ConfirmTripForm'

export default function TripTracker() {
  const { data: trips, loading } = useTrips()
  const { data: drivers } = useDrivers()
  const { data: hotels } = useHotels()
  const { data: itineraries } = useItineraries()
  const [start, setStart] = useState(startOfMonthISO())
  const [end, setEnd] = useState(endOfMonthISO())
  const [detail, setDetail] = useState(null)
  const [editingTrip, setEditingTrip] = useState(null)
  const [confirmingTrip, setConfirmingTrip] = useState(null)

  const filtered = useMemo(
    () => trips.filter((t) => t.date >= start && t.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [trips, start, end]
  )

  const driverById = (id) => drivers.find((d) => d.id === id)
  const hotelById = (id) => hotels.find((h) => h.id === id)
  const itineraryById = (id) => itineraries.find((i) => i.id === id)

  const totalRevenue = sum(filtered, (t) => t.amount_received)
  const totalCosts = sum(filtered, tripCost)
  const totalProfit = sum(filtered, tripProfit)

  const handleExport = () => {
    exportToCSV(
      `belive-trips-${start}-to-${end}.csv`,
      filtered.map((t) => ({
        date: t.date,
        booking_id: t.booking_id,
        customer: t.customer_name,
        trip_type: t.trip_type,
        status: t.trip_status,
        payment_status: t.payment_status,
        amount_quoted: t.amount_quoted,
        amount_received: t.amount_received,
        trip_cost: tripCost(t),
        trip_profit: tripProfit(t),
      }))
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl">Trip Tracker</h1>
      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />

      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Revenue</p>
          <p className="font-bold text-sm">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Costs</p>
          <p className="font-bold text-sm">{formatCurrency(totalCosts)}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] text-gray-400">Profit</p>
          <p className={`font-bold text-sm ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(totalProfit)}</p>
        </div>
      </div>

      <button className="btn-outline w-full" onClick={handleExport} disabled={filtered.length === 0}>
        Export CSV
      </button>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No trips in this range" />
      ) : (
        <div className="space-y-2">
          {filtered.map((trip) => (
            <div key={trip.id} className="card cursor-pointer" onClick={() => setDetail(trip)}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{trip.customer_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(trip.date)} · {trip.booking_id}</p>
                </div>
                <StatusBadge status={trip.trip_status} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 capitalize">{trip.trip_type.replace(/-/g, ' ')}</p>
                <ProfitBadge amount={tripProfit(trip)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.customer_name}
        footer={
          detail && (
            <div className="flex gap-2">
              <button
                className="btn-outline flex-1"
                onClick={() => {
                  setEditingTrip(detail)
                  setDetail(null)
                }}
              >
                Edit Trip
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  setConfirmingTrip(detail)
                  setDetail(null)
                }}
              >
                Stage 2 Details
              </button>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Booking ID" value={detail.booking_id} />
            <Row label="Quote ID" value={detail.quote_id} />
            <Row label="Date" value={formatDate(detail.date)} />
            <Row label="Phone" value={detail.customer_phone} />
            <Row label="Email" value={detail.customer_email} />
            <Row label="Trip Type" value={detail.trip_type} />
            <Row label="Itinerary" value={itineraryById(detail.itinerary_id)?.name || '—'} />
            <Row label="Driver" value={driverById(detail.driver_assigned)?.name || '—'} />
            <Row label="Hotel" value={hotelById(detail.hotel_assigned)?.name || '—'} />
            <Row label="Houseboat" value={hotelById(detail.houseboat_assigned)?.name || '—'} />
            <Row label="Amount Quoted" value={formatCurrency(detail.amount_quoted)} />
            <Row label="Amount Received" value={formatCurrency(detail.amount_received)} />
            <Row label="Trip Cost" value={formatCurrency(tripCost(detail))} />
            <Row label="Trip Profit" value={formatCurrency(tripProfit(detail))} />
            <Row label="Payment Status" value={detail.payment_status} />
            <Row label="Notes" value={detail.notes || '—'} />
          </div>
        )}
      </Modal>

      <Modal open={!!editingTrip} onClose={() => setEditingTrip(null)} title="Edit Trip">
        {editingTrip && <TripForm trip={editingTrip} onDone={() => setEditingTrip(null)} onCancel={() => setEditingTrip(null)} />}
      </Modal>
      <Modal open={!!confirmingTrip} onClose={() => setConfirmingTrip(null)} title="Stage 2 Details">
        {confirmingTrip && (
          <ConfirmTripForm trip={confirmingTrip} onDone={() => setConfirmingTrip(null)} onCancel={() => setConfirmingTrip(null)} />
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  )
}
