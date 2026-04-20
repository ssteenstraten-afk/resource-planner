import { createContext, useContext, useEffect, useState } from 'react'
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

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  consultant: null,
  rol: null,
  laden: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session) setLaden(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session) {
        setConsultant(null)
        setLaden(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    setLaden(true)
    supabase
      .from('consultants')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setConsultant(data ?? null)
        setLaden(false)
      })
  }, [user?.id])

  return (
    <AuthContext.Provider value={{ session, user, consultant, rol: consultant?.rol ?? null, laden }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
