import { NavLink } from 'react-router-dom'
import Icon from '../common/Icon'
import { NAV_ITEMS } from './NavItems'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { isOwner } = useAuth()
  const items = NAV_ITEMS.filter((i) => !i.ownerOnly || isOwner)

  return (
    <aside className="hidden sm:flex sm:flex-col w-56 shrink-0 border-r border-gray-100 bg-white h-[calc(100vh-56px)] sticky top-14 py-4 px-3 overflow-y-auto">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm font-body font-medium transition ${
              isActive ? 'bg-teal/10 text-teal' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`
          }
        >
          <Icon name={item.icon} size={18} />
          {item.label}
        </NavLink>
      ))}
    </aside>
  )
}
