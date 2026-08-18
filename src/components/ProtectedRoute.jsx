import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <div className="center-page">Loading...</div>
  }

  if (!session) return <Navigate to="/login" replace />
  if (!profile?.channel_id) return <Navigate to="/onboarding" replace />

  return children
}
