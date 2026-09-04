// Central nav config shared by the sidebar (desktop) and bottom tab bar / more-sheet (mobile).
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/quotes', label: 'Quotes', icon: 'file-text' },
  { to: '/trips', label: 'Trips', icon: 'map' },
  { to: '/commissions', label: 'Commissions', icon: 'briefcase' },
  { to: '/itineraries', label: 'Itineraries', icon: 'book' },
  { to: '/accommodations', label: 'Stays', icon: 'bed' },
  { to: '/drivers', label: 'Drivers', icon: 'user' },
  { to: '/investments', label: 'Investments', icon: 'trending-up' },
  { to: '/expenses', label: 'Expenses', icon: 'wallet', ownerOnly: true },
  { to: '/reports', label: 'Reports', icon: 'bar-chart' },
  { to: '/settings', label: 'Settings', icon: 'settings', ownerOnly: true },
]

// The 4 highest-frequency items get a slot on the mobile bottom bar; everything
// else (plus these 4 again) lives in the "More" sheet.
export const BOTTOM_NAV_KEYS = ['/', '/quotes', '/trips', '/commissions']
