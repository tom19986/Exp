import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/add', label: 'Add Expense', icon: '➕' },
  { to: '/expenses', label: 'Expenses', icon: '📋' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/reports', label: 'Reports', icon: '📈' }
]

export default function Sidebar() {
  const { profile, channel, signOut } = useAuth()

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        Expense<span>Ly</span>
        {channel && <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>{channel.name}</div>}
      </div>

      {links.map(l => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span>{l.icon}</span> {l.label}
        </NavLink>
      ))}

      {profile?.role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span>⚙️</span> Channel Admin
        </NavLink>
      )}

      <NavLink to="/notifications" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        <span>🔔</span> Notifications
      </NavLink>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-meta">
            <div className="user-name">{profile?.full_name || profile?.email}</div>
            <div className="user-role">{profile?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={signOut}>Log out</button>
      </div>
    </aside>
  )
}
