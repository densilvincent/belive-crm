export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
      <div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
