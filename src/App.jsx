import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth, RequireOwner } from './components/layout/RequireAuth'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ConfigError from './pages/ConfigError'
import { isSupabaseConfigured } from './lib/supabaseClient'

// Route-level code splitting keeps the initial mobile payload small — only the
// login + dashboard bundle loads on first paint; recharts/jspdf-heavy tabs
// (Reports, Daily Expenses) load on demand.
const QuoteManagement = lazy(() => import('./pages/QuoteManagement'))
const ItineraryLibrary = lazy(() => import('./pages/ItineraryLibrary'))
const Accommodations = lazy(() => import('./pages/Accommodations'))
const TripTracker = lazy(() => import('./pages/TripTracker'))
const DriverPerformance = lazy(() => import('./pages/DriverPerformance'))
const CommissionTracker = lazy(() => import('./pages/CommissionTracker'))
const InvestmentReturns = lazy(() => import('./pages/InvestmentReturns'))
const DailyExpenses = lazy(() => import('./pages/DailyExpenses'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))

export default function App() {
  if (!isSupabaseConfigured) return <ConfigError />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Outfit, sans-serif', fontSize: '14px' } }} />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="quotes" element={<QuoteManagement />} />
                <Route path="trips" element={<TripTracker />} />
                <Route path="commissions" element={<CommissionTracker />} />
                <Route path="itineraries" element={<ItineraryLibrary />} />
                <Route path="accommodations" element={<Accommodations />} />
                <Route path="drivers" element={<DriverPerformance />} />
                <Route path="investments" element={<InvestmentReturns />} />
                <Route path="reports" element={<Reports />} />
                <Route element={<RequireOwner />}>
                  <Route path="expenses" element={<DailyExpenses />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
