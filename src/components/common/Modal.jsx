import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col animate-[fadeIn_0.15s_ease-out]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-display font-semibold text-lg text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-touch min-w-touch flex items-center justify-center text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 flex-1">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}
