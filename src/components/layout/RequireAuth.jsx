import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingSpinner label="Loading Belive Holidays…" />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireOwner() {
  const { isOwner, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!isOwner) return <Navigate to="/" replace />
  return <Outlet />
}
