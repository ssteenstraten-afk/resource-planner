import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/login')
        return
      }

      const { data: consultant } = await supabase
        .from('consultants')
        .select('rol')
        .eq('id', session.user.id)
        .single()

      if (consultant?.rol === 'planner') {
        navigate('/dashboard')
      } else {
        navigate('/mijn-week')
      }
    })
  }, [navigate])

  return (
    <div className="laden-scherm">
      <div className="laden-spinner" />
      <p>Inloggen...</p>
    </div>
  )
}
