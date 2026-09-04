import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTrips } from '../hooks/useTrips'
import { useCommissions } from '../hooks/useCommissions'
import { useInvestments } from '../hooks/useInvestments'
import { useOverhead } from '../hooks/useOverhead'
import { useDrivers } from '../hooks/useDrivers'
import { useHotels } from '../hooks/useHotels'
import { useItineraries } from '../hooks/useItineraries'
import { tripCost, tripProfit, dailyOverheadTotal, sum } from '../lib/calc'
import { formatCurrency, todayISO } from '../lib/formatters'
import StatusBadge from '../components/common/StatusBadge'
import ProfitBadge from '../components/common/ProfitBadge'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Icon from '../components/common/Icon'
import TripForm from '../components/forms/TripForm'
import ConfirmTripForm from '../components/forms/ConfirmTripForm'
import CommissionForm from '../components/forms/CommissionForm'
import InvestmentForm from '../components/forms/InvestmentForm'
import OverheadForm from '../components/forms/OverheadForm'

export default function Dashboard() {
  const { isOwner } = useAuth()
  const [date, setDate] = useState(todayISO())

  const { data: trips, loading: tripsLoading, update: updateTrip } = useTrips()
  const { data: commissions, loading: commLoading } = useCommissions()
  const { data: investments, loading: invLoading } = useInvestments()
  const { data: overheads, loading: ovLoading } = useOverhead()
  const { data: drivers } = useDrivers()
  const { data: hotels } = useHotels()
  const { data: itineraries } = useItineraries()

  const [showAddTrip, setShowAddTrip] = useState(false)
  const [showAddCommission, setShowAddCommission] = useState(false)
  const [showAddInvestment, setShowAddInvestment] = useState(false)
  const [showAddOverhead, setShowAddOverhead] = useState(false)
  const [confirmingTrip, setConfirmingTrip] = useState(null)
  const [cancelTrip, setCancelTrip] = useState(null)
  const [generatingPdfId, setGeneratingPdfId] = useState(null)
  const [sharingId, setSharingId] = useState(null)

  const todaysTrips = useMemo(() => trips.filter((t) => t.date === date), [trips, date])
  const todaysCommissions = useMemo(() => commissions.filter((c) => c.date === date), [commissions, date])
  const todaysInvestments = useMemo(() => investments.filter((i) => i.date === date), [investments, date])
  const todaysOverhead = useMemo(() => overheads.filter((o) => o.date === date), [overheads, date])

  const quotedTrips = todaysTrips.filter((t) => ['Quote-Generated', 'Quote-Sent'].includes(t.trip_status))
  const activeTrips = todaysTrips.filter((t) => ['Quote-Confirmed', 'Booked', 'Paid'].includes(t.trip_status))

  const tripRevenue = sum(todaysTrips, (t) => t.amount_received)
  const tripCosts = sum(todaysTrips, tripCost)
  const tripProfitTotal = sum(todaysTrips, tripProfit)
  const commissionTotal = sum(todaysCommissions, (c) => c.commission_amount)
  const investmentTotal = sum(todaysInvestments, (i) => i.actual_amount_received)
  const overheadTotal = sum(todaysOverhead, dailyOverheadTotal)
  const dailyNetProfit = tripProfitTotal - overheadTotal + commissionTotal + investmentTotal

  const driverById = (id) => drivers.find((d) => d.id === id)
  const hotelById = (id) => hotels.find((h) => h.id === id)
  const itineraryById = (id) => itineraries.find((i) => i.id === id)

  const markSent = async (trip) => {
    try {
      await updateTrip(trip.id, { trip_status: 'Quote-Sent', pdf_quote_sent_date: new Date().toISOString() })
      toast.success('Marked as sent')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const cancelThisTrip = async () => {
    try {
      await updateTrip(cancelTrip.id, { trip_status: 'Cancelled', payment_status: 'Cancelled' })
      toast.success('Trip cancelled')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelTrip(null)
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

  const handleShareWhatsApp = async (trip) => {
    setSharingId(trip.id)
    try {
      const { shareQuoteOnWhatsApp } = await import('../lib/shareQuote')
      const { mode } = await shareQuoteOnWhatsApp({
        trip,
        itinerary: itineraryById(trip.itinerary_id),
        hotel: hotelById(trip.hotel_assigned) || hotelById(trip.houseboat_assigned),
        driver: driverById(trip.driver_assigned),
      })
      if (mode === 'shared') {
        await updateTrip(trip.id, { pdf_quote_generated: true })
        toast.success('Quote shared')
      } else if (mode === 'fallback') {
        await updateTrip(trip.id, { pdf_quote_generated: true })
        toast.success('PDF downloaded — attach it in the WhatsApp chat that just opened')
      }
    } catch (err) {
      toast.error(err.message || 'Could not share quote')
    } finally {
      setSharingId(null)
    }
  }

  const loading = tripsLoading || commLoading || invLoading || ovLoading

  return (
    <div className="space-y-6">
      {/* Section A: Quick Summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display font-bold text-xl">Today's Dashboard</h1>
          <input type="date" className="input-field w-auto text-sm py-1.5" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:mx-0 sm:px-0">
            <StatCard label="Trip Revenue" value={formatCurrency(tripRevenue)} />
            <StatCard label="Trip Costs" value={formatCurrency(tripCosts)} />
            <StatCard label="Trip Profit" value={formatCurrency(tripProfitTotal)} accent />
            <StatCard label="Commissions" value={formatCurrency(commissionTotal)} />
            <StatCard label="Investment Returns" value={formatCurrency(investmentTotal)} />
            <StatCard
              label="Daily Net Profit"
              value={formatCurrency(dailyNetProfit)}
              accent
              negative={dailyNetProfit < 0}
            />
          </div>
        )}
      </section>

      {/* Section B: Quick Add Trip */}
      <section className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => setShowAddTrip(true)}>
          <Icon name="plus" size={18} /> Add Trip
        </button>
        <button className="btn-outline" onClick={() => setShowAddCommission(true)}>
          <Icon name="plus" size={18} /> Add Commission
        </button>
      </section>

      {/* Section C: Today's Tour Package Quotes */}
      <section>
        <h2 className="font-display font-semibold text-base mb-2">Today's Quotes</h2>
        {quotedTrips.length === 0 ? (
          <EmptyState title="No quotes yet today" />
        ) : (
          <div className="space-y-2">
            {quotedTrips.map((trip) => (
              <div key={trip.id} className="card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm truncate">{trip.customer_name}</p>
                    <p className="text-xs text-gray-400">{trip.quote_id}</p>
                  </div>
                  <StatusBadge status={trip.trip_status} />
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {itineraryById(trip.itinerary_id)?.name || trip.trip_type} · {formatCurrency(trip.amount_quoted)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="btn-outline text-xs py-2 min-h-[40px]"
                    disabled={generatingPdfId === trip.id}
                    onClick={() => handleGeneratePdf(trip)}
                  >
                    {generatingPdfId === trip.id ? '…' : 'View PDF'}
                  </button>
                  <button
                    className="btn-outline text-xs py-2 min-h-[40px]"
                    disabled={sharingId === trip.id}
                    onClick={() => handleShareWhatsApp(trip)}
                  >
                    {sharingId === trip.id ? '…' : 'WhatsApp'}
                  </button>
                  <button className="btn-outline text-xs py-2 min-h-[40px]" onClick={() => markSent(trip)}>
                    Mark Sent
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button className="btn-danger text-xs py-2 min-h-[40px]" onClick={() => setCancelTrip(trip)}>
                    Cancel
                  </button>
                  <button className="btn-primary text-xs py-2 min-h-[40px]" onClick={() => setConfirmingTrip(trip)}>
                    Confirm Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section D: Active Trips */}
      <section>
        <h2 className="font-display font-semibold text-base mb-2">Active Trips</h2>
        {activeTrips.length === 0 ? (
          <EmptyState title="No active trips today" />
        ) : (
          <div className="space-y-2">
            {activeTrips.map((trip) => (
              <div key={trip.id} className="card flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{trip.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {trip.booking_id} · {driverById(trip.driver_assigned)?.name || 'No driver'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={trip.trip_status} />
                  <ProfitBadge amount={tripProfit(trip)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section F: Quick Add Investment */}
      <section>
        <button className="btn-outline w-full" onClick={() => setShowAddInvestment(true)}>
          <Icon name="plus" size={18} /> Add Investment Return
        </button>
      </section>

      {/* Section G: Daily Overhead (Owner only) */}
      {isOwner && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-base">Daily Overhead</h2>
            <button className="text-teal text-sm font-semibold flex items-center gap-1" onClick={() => setShowAddOverhead(true)}>
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
          {todaysOverhead.length === 0 ? (
            <EmptyState title="No overhead logged today" />
          ) : (
            <div className="space-y-2">
              {todaysOverhead.map((o) => (
                <div key={o.id} className="card flex items-center justify-between">
                  <p className="text-sm text-gray-600">{o.notes || 'Overhead entry'}</p>
                  <p className="font-bold text-gray-800">{formatCurrency(dailyOverheadTotal(o))}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Daily Summary */}
      <section className="card bg-teal/5 border-teal/20">
        <p className="text-xs text-gray-500 mb-1">Daily Net Profit</p>
        <p className={`font-display font-bold text-2xl ${dailyNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatCurrency(dailyNetProfit)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Trip Profit {formatCurrency(tripProfitTotal)} − Overhead {formatCurrency(overheadTotal)} + Commissions{' '}
          {formatCurrency(commissionTotal)} + Investments {formatCurrency(investmentTotal)}
        </p>
      </section>

      {/* Modals */}
      <Modal open={showAddTrip} onClose={() => setShowAddTrip(false)} title="Add Trip">
        <TripForm onDone={() => setShowAddTrip(false)} onCancel={() => setShowAddTrip(false)} />
      </Modal>
      <Modal open={showAddCommission} onClose={() => setShowAddCommission(false)} title="Add Commission">
        <CommissionForm onDone={() => setShowAddCommission(false)} onCancel={() => setShowAddCommission(false)} />
      </Modal>
      <Modal open={showAddInvestment} onClose={() => setShowAddInvestment(false)} title="Add Investment Return">
        <InvestmentForm onDone={() => setShowAddInvestment(false)} onCancel={() => setShowAddInvestment(false)} />
      </Modal>
      {isOwner && (
        <Modal open={showAddOverhead} onClose={() => setShowAddOverhead(false)} title="Add Daily Overhead">
          <OverheadForm onDone={() => setShowAddOverhead(false)} onCancel={() => setShowAddOverhead(false)} />
        </Modal>
      )}
      <Modal open={!!confirmingTrip} onClose={() => setConfirmingTrip(null)} title="Confirm Quote">
        {confirmingTrip && (
          <ConfirmTripForm trip={confirmingTrip} onDone={() => setConfirmingTrip(null)} onCancel={() => setConfirmingTrip(null)} />
        )}
      </Modal>
      <ConfirmDialog
        open={!!cancelTrip}
        title="Cancel this trip?"
        message="This marks the trip and payment status as cancelled."
        onCancel={() => setCancelTrip(null)}
        onConfirm={cancelThisTrip}
      />
    </div>
  )
}

function StatCard({ label, value, accent, negative }) {
  return (
    <div className="card min-w-[150px] snap-start sm:min-w-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-display font-bold text-lg ${accent ? (negative ? 'text-red-600' : 'text-teal') : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}
