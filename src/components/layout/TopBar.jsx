import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Icon from '../common/Icon'
import ConfirmDialog from '../common/ConfirmDialog'
import logo from '../../assets/belive-logo.png'

export default function TopBar({ onMenuClick }) {
  const { user, role, signOut } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-3 sm:px-6 gap-3">
      <button
        onClick={onMenuClick}
        className="sm:hidden min-h-touch min-w-touch flex items-center justify-center text-gray-600"
        aria-label="Open menu"
      >
        <Icon name="menu" />
      </button>
      <img src={logo} alt="Belive Holidays" className="h-9 w-9 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-gray-800 leading-tight truncate">Belive Holidays</p>
        <p className="text-[11px] text-gray-400 leading-tight truncate">
          {user?.email} · <span className="capitalize">{role}</span>
        </p>
      </div>
      <button
        onClick={() => setConfirmLogout(true)}
        className="min-h-touch min-w-touch flex items-center justify-center text-gray-400 hover:text-red-600"
        aria-label="Logout"
      >
        <Icon name="logout" />
      </button>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need to sign in again to access the CRM."
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          signOut()
        }}
      />
    </header>
  )
}
