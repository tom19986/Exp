import { useAuth } from '../contexts/AuthContext'

export default function MobileHeader() {
  const { channel, profile } = useAuth()

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="mobile-header">
      <div className="mobile-header-brand">
        Expense<span>Ly</span>
      </div>
      <div className="mobile-header-right">
        <span className="mobile-header-channel">{channel?.name}</span>
        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{initials}</div>
      </div>
    </header>
  )
}
