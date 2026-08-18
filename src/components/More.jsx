import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function More() {
  const { profile, channel, signOut } = useAuth()

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">More</h1>
          <div className="page-subtitle">{channel?.name}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{profile?.full_name || profile?.email}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profile?.role} · {channel?.name}</div>
        </div>
      </div>

      <div className="more-list">
        <Link to="/categories" className="more-item">
          <span className="more-item-icon">🗂️</span>
          <div>
            <div className="more-item-title">Categories</div>
            <div className="more-item-sub">Manage categories &amp; sub-categories</div>
          </div>
          <span className="more-item-chevron">›</span>
        </Link>

        <Link to="/notifications" className="more-item">
          <span className="more-item-icon">🔔</span>
          <div>
            <div className="more-item-title">Notifications</div>
            <div className="more-item-sub">Daily reminder to log expenses</div>
          </div>
          <span className="more-item-chevron">›</span>
        </Link>

        {profile?.role === 'admin' && (
          <Link to="/admin" className="more-item">
            <span className="more-item-icon">⚙️</span>
            <div>
              <div className="more-item-title">Channel Admin</div>
              <div className="more-item-sub">Join code &amp; members</div>
            </div>
            <span className="more-item-chevron">›</span>
          </Link>
        )}

        <button className="more-item more-item-button" onClick={signOut}>
          <span className="more-item-icon">🚪</span>
          <div>
            <div className="more-item-title" style={{ color: 'var(--expense)' }}>Log out</div>
          </div>
          <span className="more-item-chevron">›</span>
        </button>
      </div>
    </div>
  )
}
