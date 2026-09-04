export default function EmptyState({ title = 'Nothing here yet', subtitle }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <p className="font-display font-semibold text-gray-500">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  )
}
