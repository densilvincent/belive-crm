// Belive Holidays operates in Kerala — every "today" / "this month" / "this
// week" the app computes is anchored to Indian Standard Time explicitly,
// not to whatever timezone the viewing device happens to be set to. Without
// this, someone checking the dashboard while traveling would see a
// different "today" than the business actually has.
const BUSINESS_TIMEZONE = 'Asia/Kolkata'

export function formatCurrency(amount) {
  const n = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  // Plain "YYYY-MM-DD" values (every `date` column in this app) represent a
  // calendar date, not an instant — `new Date("2026-09-04")` parses it as
  // UTC midnight, which then rolls back a day once displayed in any
  // timezone behind UTC. Build the Date from local year/month/day instead.
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/
  const d = isoDateOnly.test(dateStr) ? new Date(...dateStr.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n)))) : new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  // A real timestamp (createdAt, last_sign_in_at) has a genuine instant, so
  // this DOES need an explicit timezone — pin it to IST rather than the
  // viewer's device, same reasoning as BUSINESS_TIMEZONE above.
  return d.toLocaleString('en-IN', {
    timeZone: BUSINESS_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Today's Y/M/D as seen in IST, regardless of the viewing device's own
// timezone setting.
function nowInBusinessTZ() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) }
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function ymdToISO(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

// Pure calendar arithmetic on Y/M/D integers, anchored to UTC noon purely as
// a calculator (never as "now") so it can never pick up a stray local-
// timezone offset from the runtime.
function addDaysToYMD(year, month, day, deltaDays) {
  const d = new Date(Date.UTC(year, month - 1, day + deltaDays, 12))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

function dayOfWeekUTC(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() // 0 = Sunday
}

function mondayOfYMD(year, month, day) {
  const diffFromMonday = (dayOfWeekUTC(year, month, day) + 6) % 7
  return addDaysToYMD(year, month, day, -diffFromMonday)
}

export function todayISO() {
  const { year, month, day } = nowInBusinessTZ()
  return ymdToISO(year, month, day)
}

export function startOfMonthISO() {
  const { year, month } = nowInBusinessTZ()
  return ymdToISO(year, month, 1)
}

export function endOfMonthISO() {
  const { year, month } = nowInBusinessTZ()
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const lastDay = addDaysToYMD(nextYear, nextMonth, 1, -1)
  return ymdToISO(lastDay.year, lastDay.month, lastDay.day)
}

export function lastMonthRange() {
  const { year, month } = nowInBusinessTZ()
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = prevMonth === 12 ? 1 : prevMonth + 1
  const nextYear = prevMonth === 12 ? prevYear + 1 : prevYear
  const lastDay = addDaysToYMD(nextYear, nextMonth, 1, -1)
  return { start: ymdToISO(prevYear, prevMonth, 1), end: ymdToISO(lastDay.year, lastDay.month, lastDay.day) }
}

export function thisWeekRange() {
  const { year, month, day } = nowInBusinessTZ()
  const monday = mondayOfYMD(year, month, day)
  const sunday = addDaysToYMD(monday.year, monday.month, monday.day, 6)
  return {
    start: ymdToISO(monday.year, monday.month, monday.day),
    end: ymdToISO(sunday.year, sunday.month, sunday.day),
  }
}

export function lastWeekRange() {
  const { year, month, day } = nowInBusinessTZ()
  const monday = mondayOfYMD(year, month, day)
  const lastMonday = addDaysToYMD(monday.year, monday.month, monday.day, -7)
  const lastSunday = addDaysToYMD(monday.year, monday.month, monday.day, -1)
  return {
    start: ymdToISO(lastMonday.year, lastMonday.month, lastMonday.day),
    end: ymdToISO(lastSunday.year, lastSunday.month, lastSunday.day),
  }
}

export function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? ''
          const escaped = String(val).replace(/"/g, '""')
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
        })
        .join(',')
    ),
  ]
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
