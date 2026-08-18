import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ExpenseList from './pages/ExpenseList'
import Categories from './pages/Categories'
import Reports from './pages/Reports'
import AdminChannel from './pages/AdminChannel'
import Notifications from './pages/Notifications'
import More from './components/More'

function OnboardingRoute() {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="center-page">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  if (profile?.channel_id) return <Navigate to="/" replace />
  return <Onboarding />
}

function LoginRoute() {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="center-page">Loading...</div>
  if (session && profile?.channel_id) return <Navigate to="/" replace />
  if (session && !profile?.channel_id) return <Navigate to="/onboarding" replace />
  return <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="add" element={<AddExpense />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="categories" element={<Categories />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin" element={<AdminChannel />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="more" element={<More />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
