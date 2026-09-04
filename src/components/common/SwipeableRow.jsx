import { useRef, useState } from 'react'
import Icon from './Icon'

// Lightweight swipe-left-to-reveal-delete, used for mobile list rows.
// Falls back to a plain visible delete button on non-touch (desktop) layouts.
export default function SwipeableRow({ children, onDelete, disabled }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(null)
  const REVEAL = 72

  if (disabled) return <div className="relative">{children}</div>

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
  }
  const onTouchMove = (e) => {
    if (startX.current === null) return
    const delta = e.touches[0].clientX - startX.current
    setOffset(Math.min(0, Math.max(-REVEAL, delta)))
  }
  const onTouchEnd = () => {
    setOffset(offset < -REVEAL / 2 ? -REVEAL : 0)
    startX.current = null
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <button
        onClick={() => {
          onDelete?.()
          setOffset(0)
        }}
        className="absolute inset-y-0 right-0 w-[72px] bg-red-600 text-white flex items-center justify-center"
        aria-label="Delete"
      >
        <Icon name="trash" size={20} />
      </button>
      <div
        className="relative bg-transparent transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
