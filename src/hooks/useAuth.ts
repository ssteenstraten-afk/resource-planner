import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Consultant = Database['public']['Tables']['consultants']['Row']

interface AuthState {
  session: Session | null
  user: User | null
  consultant: Consultant | null
  rol: 'consultant' | 'planner' | null
  laden: boolean
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    // Haal huidige sessie op
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Luister naar auth wijzigingen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setConsultant(null)
      setLaden(false)
      return
    }

    setLaden(true)
    supabase
      .from('consultants')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Fout bij ophalen consultantprofiel:', error)
          setConsultant(null)
        } else {
          setConsultant(data)
        }
        setLaden(false)
      })
  }, [user])

  return {
    session,
    user,
    consultant,
    rol: consultant?.rol ?? null,
    laden,
  }
}
