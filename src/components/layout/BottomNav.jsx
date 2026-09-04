import { NavLink } from 'react-router-dom'
import Icon from '../common/Icon'
import { NAV_ITEMS, BOTTOM_NAV_KEYS } from './NavItems'

export default function BottomNav({ onMoreClick }) {
  const items = BOTTOM_NAV_KEYS.map((to) => NAV_ITEMS.find((i) => i.to === to))

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 flex items-stretch pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-touch text-[11px] font-body ${
              isActive ? 'text-teal' : 'text-gray-400'
            }`
          }
        >
          <Icon name={item.icon} size={22} />
          {item.label}
        </NavLink>
      ))}
      <button
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-touch text-[11px] font-body text-gray-400"
      >
        <Icon name="menu" size={22} />
        More
      </button>
    </nav>
  )
}
