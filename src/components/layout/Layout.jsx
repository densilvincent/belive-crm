import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MoreSheet from './MoreSheet'

export default function Layout() {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bggray-light">
      <TopBar onMenuClick={() => setMoreOpen(true)} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-4 pb-24 sm:pb-8 max-w-3xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <BottomNav onMoreClick={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  )
}
