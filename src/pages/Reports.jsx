import { useMemo, useState } from 'react'
import { useTrips } from '../hooks/useTrips'
import { useCommissions } from '../hooks/useCommissions'
import { useInvestments } from '../hooks/useInvestments'
import { useOverhead } from '../hooks/useOverhead'
import { useDrivers } from '../hooks/useDrivers'
import { startOfMonthISO, endOfMonthISO } from '../lib/formatters'
import DateRangePicker from '../components/common/DateRangePicker'
import LoadingSpinner from '../components/common/LoadingSpinner'
import DailyProfitReport from '../components/reports/DailyProfitReport'
import WeeklyProfitReport from '../components/reports/WeeklyProfitReport'
import TripProfitabilityReport from '../components/reports/TripProfitabilityReport'
import DriverCommissionReport from '../components/reports/DriverCommissionReport'
import ExpenseBreakdownReport from '../components/reports/ExpenseBreakdownReport'
import CommissionSourceReport from '../components/reports/CommissionSourceReport'
import ConsolidatedPLReport from '../components/reports/ConsolidatedPLReport'

const SUB_TABS = [
  { key: 'daily', label: 'Daily Net Profit' },
  { key: 'weekly', label: 'Weekly Net Profit' },
  { key: 'trip-type', label: 'Trip Profitability' },
  { key: 'driver', label: 'Driver Commission' },
  { key: 'expense', label: 'Expense Breakdown' },
  { key: 'commission', label: 'Commission Source' },
  { key: 'pl', label: 'Consolidated P&L' },
]

export default function Reports() {
  const [tab, setTab] = useState('daily')
  const [start, setStart] = useState(startOfMonthISO())
  const [end, setEnd] = useState(endOfMonthISO())

  const { data: trips, loading: l1 } = useTrips()
  const { data: commissions, loading: l2 } = useCommissions()
  const { data: investments, loading: l3 } = useInvestments()
  const { data: overheads, loading: l4 } = useOverhead()
  const { data: drivers, loading: l5 } = useDrivers()

  const loading = l1 || l2 || l3 || l4 || l5

  const filteredTrips = useMemo(() => trips.filter((d) => d.date >= start && d.date <= end), [trips, start, end])
  const filteredCommissions = useMemo(() => commissions.filter((d) => d.date >= start && d.date <= end), [commissions, start, end])
  const filteredInvestments = useMemo(() => investments.filter((d) => d.date >= start && d.date <= end), [investments, start, end])
  const filteredOverheads = useMemo(() => overheads.filter((d) => d.date >= start && d.date <= end), [overheads, start, end])

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-xl">Accounting Reports</h1>
      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-semibold whitespace-nowrap min-h-[36px] ${
              tab === t.key ? 'bg-teal text-white' : 'bg-white border border-gray-200 text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {tab === 'daily' && (
            <DailyProfitReport trips={filteredTrips} overheads={filteredOverheads} commissions={filteredCommissions} investments={filteredInvestments} start={start} end={end} />
          )}
          {tab === 'weekly' && (
            <WeeklyProfitReport trips={filteredTrips} overheads={filteredOverheads} commissions={filteredCommissions} investments={filteredInvestments} start={start} end={end} />
          )}
          {tab === 'trip-type' && <TripProfitabilityReport trips={filteredTrips} start={start} end={end} />}
          {tab === 'driver' && <DriverCommissionReport trips={filteredTrips} drivers={drivers} start={start} end={end} />}
          {tab === 'expense' && <ExpenseBreakdownReport overheads={filteredOverheads} start={start} end={end} />}
          {tab === 'commission' && <CommissionSourceReport commissions={filteredCommissions} start={start} end={end} />}
          {tab === 'pl' && (
            <ConsolidatedPLReport trips={filteredTrips} overheads={filteredOverheads} commissions={filteredCommissions} investments={filteredInvestments} start={start} end={end} />
          )}
        </>
      )}
    </div>
  )
}
