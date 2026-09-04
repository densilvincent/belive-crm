import { useRef, useState } from 'react'
import Icon from './Icon'

// Swipe/drag-left-to-reveal-delete. Touch handlers cover mobile; mouse
// handlers mirror them so desktop (no touch events) can reveal + trigger
// delete too, since owners often manage this list from a laptop.
export default function SwipeableRow({ children, onDelete, disabled }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(null)
  const dragging = useRef(false)
  const REVEAL = 72

  if (disabled) return <div className="relative">{children}</div>

  const start = (clientX) => {
    startX.current = clientX
    dragging.current = true
  }
  const move = (clientX) => {
    if (!dragging.current || startX.current === null) return
    const delta = clientX - startX.current
    setOffset(Math.min(0, Math.max(-REVEAL, delta)))
  }
  const end = () => {
    if (!dragging.current) return
    dragging.current = false
    setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0))
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
        className="relative bg-transparent transition-transform cursor-grab active:cursor-grabbing"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(e) => start(e.touches[0].clientX)}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={end}
        onMouseDown={(e) => start(e.clientX)}
        onMouseMove={(e) => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={end}
      >
        {children}
      </div>
    </div>
  )
}
