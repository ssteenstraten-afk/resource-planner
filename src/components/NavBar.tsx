import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function NavBar() {
  const { consultant, rol } = useAuth()
  const navigate = useNavigate()

  async function uitloggen() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-merk">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#2563eb" />
          <path d="M10 28V12h6l4 10 4-10h6v16h-4V18l-3.5 8h-5L14 18v10h-4z" fill="white" />
        </svg>
        <span className="navbar-naam">Resource Planner</span>
      </div>

      <div className="navbar-links">
        {rol === 'planner' && (
          <>
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/dashboard/projecten" className="nav-link">Projecten</a>
          </>
        )}
        {rol === 'consultant' && (
          <a href="/mijn-week" className="nav-link">Mijn week</a>
        )}
      </div>

      <div className="navbar-gebruiker">
        {consultant && (
          <span className="gebruiker-naam">{consultant.naam}</span>
        )}
        <button className="btn-uitloggen" onClick={uitloggen}>
          Uitloggen
        </button>
      </div>
    </nav>
  )
}
