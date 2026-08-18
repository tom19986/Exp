import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: '📊', end: true },
  { to: '/expenses', label: 'Expenses', icon: '📋' },
  { to: '/add', label: 'Add', icon: '➕', primary: true },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/more', label: 'More', icon: '⋯' }
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            'bottom-nav-link' + (isActive ? ' active' : '') + (l.primary ? ' primary' : '')
          }
        >
          <span className="bottom-nav-icon">{l.icon}</span>
          <span className="bottom-nav-label">{l.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
