import { NavLink } from 'react-router-dom'
import Icon from '../common/Icon'
import { NAV_ITEMS } from './NavItems'
import { useAuth } from '../../context/AuthContext'

export default function MoreSheet({ open, onClose }) {
  const { isOwner } = useAuth()
  if (!open) return null
  const items = NAV_ITEMS.filter((i) => !i.ownerOnly || isOwner)

  return (
    <div className="sm:hidden fixed inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-display font-semibold text-lg">Menu</h2>
          <button onClick={onClose} aria-label="Close" className="min-h-touch min-w-touch flex items-center justify-center text-gray-400">
            <Icon name="x" />
          </button>
        </div>
        <div className="p-3 grid grid-cols-3 gap-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 rounded-xl py-4 text-xs font-body font-medium ${
                  isActive ? 'bg-teal/10 text-teal' : 'bg-gray-50 text-gray-600'
                }`
              }
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
