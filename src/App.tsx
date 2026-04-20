import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/AuthProvider'
import { Login } from './pages/Login'
import { AuthCallback } from './pages/AuthCallback'
import { MijnWeek } from './pages/MijnWeek'
import { Dashboard } from './pages/Dashboard'
import { ConsultantDetail } from './pages/ConsultantDetail'
import { Projectbeheer } from './pages/Projectbeheer'
import { Consultantbeheer } from './pages/Consultantbeheer'
import { NavBar } from './components/NavBar'

function LoginRoute() {
  const { session, rol } = useAuth()
  if (session && rol) return <Navigate to={rol === 'planner' ? '/dashboard' : '/mijn-week'} replace />
  return <Login />
}

function PrivateRoute({
  children,
  vereistRol,
}: {
  children: React.ReactNode
  vereistRol?: 'consultant' | 'planner'
}) {
  const { session, rol, laden } = useAuth()

  // Toon niets (blanco) tijdens laden — voorkomt flikkering
  if (laden) return null

  if (!session) return <Navigate to="/login" replace />
  if (vereistRol && rol !== vereistRol) {
    return <Navigate to={rol === 'planner' ? '/dashboard' : '/mijn-week'} replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/mijn-week"
          element={
            <PrivateRoute vereistRol="consultant">
              <NavBar />
              <MijnWeek />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute vereistRol="planner">
              <NavBar />
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/consultant/:id"
          element={
            <PrivateRoute vereistRol="planner">
              <NavBar />
              <ConsultantDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/projecten"
          element={
            <PrivateRoute vereistRol="planner">
              <NavBar />
              <Projectbeheer />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/consultants"
          element={
            <PrivateRoute vereistRol="planner">
              <NavBar />
              <Consultantbeheer />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/mijn-week" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
