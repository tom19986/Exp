import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <MobileHeader />
        <main className="main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
