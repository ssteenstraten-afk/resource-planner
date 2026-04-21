import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/AuthProvider'
import { supabase } from '../lib/supabase'

export function NavBar() {
  const { consultant, rol } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-merk">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="white" strokeWidth="1.8"/>
          <path d="M3 9h18" stroke="white" strokeWidth="1.8"/>
          <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="9" cy="14" r="1.5" fill="white"/>
          <circle cx="15" cy="14" r="1.5" fill="white"/>
        </svg>
        <span className="navbar-naam">Resource Planner</span>
      </div>

      <div className="navbar-links">
        {rol === 'planner' && (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/dashboard/projecten" className="nav-link">Projects</Link>
            <Link to="/dashboard/consultants" className="nav-link">Consultants</Link>
            <Link to="/dashboard/documentatie" className="nav-link">Documentation</Link>
          </>
        )}
        {rol === 'consultant' && (
          <Link to="/mijn-week" className="nav-link">My week</Link>
        )}
      </div>

      <div className="navbar-gebruiker">
        {consultant && (
          <span className="gebruiker-naam">{consultant.naam}</span>
        )}
        <button className="btn-uitloggen" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
