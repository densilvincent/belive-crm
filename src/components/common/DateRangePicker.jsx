import { startOfMonthISO, endOfMonthISO, lastMonthRange, thisWeekRange, lastWeekRange, todayISO } from '../../lib/formatters'

export default function DateRangePicker({ start, end, onChange }) {
  const setToday = () => onChange(todayISO(), todayISO())
  const setThisWeek = () => {
    const { start, end } = thisWeekRange()
    onChange(start, end)
  }
  const setLastWeek = () => {
    const { start, end } = lastWeekRange()
    onChange(start, end)
  }
  const setThisMonth = () => onChange(startOfMonthISO(), endOfMonthISO())
  const setLastMonth = () => {
    const { start, end } = lastMonthRange()
    onChange(start, end)
  }

  return (
    <div className="sticky top-[56px] z-20 bg-bggray-light/95 backdrop-blur -mx-4 px-4 py-2 border-b border-gray-100">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
        <button onClick={setToday} className="btn-outline min-h-[36px] px-3 py-1 text-xs whitespace-nowrap w-auto">
          Today
        </button>
        <button onClick={setThisWeek} className="btn-outline min-h-[36px] px-3 py-1 text-xs whitespace-nowrap w-auto">
          This Week
        </button>
        <button onClick={setLastWeek} className="btn-outline min-h-[36px] px-3 py-1 text-xs whitespace-nowrap w-auto">
          Last Week
        </button>
        <button onClick={setThisMonth} className="btn-outline min-h-[36px] px-3 py-1 text-xs whitespace-nowrap w-auto">
          This Month
        </button>
        <button onClick={setLastMonth} className="btn-outline min-h-[36px] px-3 py-1 text-xs whitespace-nowrap w-auto">
          Last Month
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => onChange(e.target.value, end)}
          className="input-field text-sm py-1.5"
          aria-label="Start date"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => onChange(start, e.target.value)}
          className="input-field text-sm py-1.5"
          aria-label="End date"
        />
      </div>
    </div>
  )
}
