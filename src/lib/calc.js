// Central profit-calculation logic — keep the whole app consistent with the
// business rule that hotel/houseboat commissions never enter trip_cost.
// Fuel is NOT a per-trip cost: a full tank covers many short trips or 1-2
// long ones, and refueling happens on its own schedule, not per booking — it
// lives in daily_overhead_expenses instead (see fuelCost() below).
export function tripCost(trip) {
  return Number(trip.driver_commission || 0) + Number(trip.cab_rental_charge || 0) + Number(trip.external_driver_charge || 0)
}

export function tripProfit(trip) {
  return Number(trip.amount_received || 0) - tripCost(trip)
}

// A refuel is billed as liters × price/liter, matching the actual pump receipt.
export function fuelCost(expense) {
  return Number(expense.fuel_liters || 0) * Number(expense.fuel_cost_per_liter || 0)
}

export function dailyOverheadTotal(expense) {
  return (
    Number(expense.maintenance_cost || 0) +
    Number(expense.spare_parts_cost || 0) +
    Number(expense.washing_cost || 0) +
    Number(expense.insurance_daily_allocation || 0) +
    Number(expense.other_overhead || 0) +
    fuelCost(expense)
  )
}

export function sum(list, fn) {
  return list.reduce((acc, item) => acc + (Number(fn(item)) || 0), 0)
}

export function groupBy(list, keyFn) {
  const map = new Map()
  for (const item of list) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

// Monday-start week key + human label, e.g. "2026-W36".
export function weekKey(dateStr) {
  const d = new Date(dateStr)
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  const year = monday.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const weekNum = Math.ceil(((monday - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return { key: monday.toISOString().slice(0, 10), label: `Week ${weekNum}, ${year}` }
}
