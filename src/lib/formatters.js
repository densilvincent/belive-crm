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
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Reads a Date object's LOCAL year/month/day (never through toISOString,
// which converts to UTC first and silently shifts the date by a day for any
// timezone ahead of UTC, e.g. IST — exactly the bug this used to have).
function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toLocalISODate(new Date())
}

export function startOfMonthISO(date = new Date()) {
  return toLocalISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonthISO(date = new Date()) {
  return toLocalISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function lastMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  return { start: toLocalISODate(start), end: toLocalISODate(end) }
}

function mondayOf(date) {
  const day = (date.getDay() + 6) % 7 // 0 = Monday
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day)
}

export function thisWeekRange() {
  const monday = mondayOf(new Date())
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  return { start: toLocalISODate(monday), end: toLocalISODate(sunday) }
}

export function lastWeekRange() {
  const thisMonday = mondayOf(new Date())
  const lastMonday = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - 7)
  const lastSunday = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - 1)
  return { start: toLocalISODate(lastMonday), end: toLocalISODate(lastSunday) }
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
