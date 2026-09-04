import { STATUS_COLORS } from '../../lib/constants'

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6B7280'
  return (
    <span className="badge" style={{ backgroundColor: color }}>
      {status}
    </span>
  )
}
