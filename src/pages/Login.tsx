import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'password' | 'magiclink'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('password')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="login-pagina">
      <div className="login-kaart">
        <div className="login-logo">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="19" rx="2" fill="var(--oranje)"/>
            <path d="M2 8h20" stroke="white" strokeWidth="1.8"/>
            <path d="M7 1v4M17 1v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="8" cy="13" r="1.8" fill="white"/>
            <circle cx="16" cy="13" r="1.8" fill="white"/>
            <circle cx="8" cy="18" r="1.8" fill="white"/>
          </svg>
        </div>
        <h1 className="login-titel">Resource Planner</h1>
        <p className="login-subtitel">Sign in with your work email</p>

        {sent ? (
          <div className="login-bevestiging">
            <div className="bevestiging-icoon">✉️</div>
            <h2>Check your email</h2>
            <p>We've sent a login link to <strong>{email}</strong>.</p>
            <p className="hint">Didn't receive an email? Check your spam or try again.</p>
            <button className="btn-secundair" onClick={() => setSent(false)}>
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-veld">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoFocus
                className="form-invoer"
              />
            </div>

            {mode === 'password' && (
              <div className="form-veld">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-invoer"
                />
              </div>
            )}

            {error && <div className="form-fout">{error}</div>}

            <button type="submit" className="btn-primair btn-volledig" disabled={loading}>
              {loading ? 'Signing in...' : mode === 'password' ? 'Sign in' : 'Send login link'}
            </button>

            <button
              type="button"
              className="btn-tekst"
              style={{ textAlign: 'center', width: '100%' }}
              onClick={() => { setMode(m => m === 'password' ? 'magiclink' : 'password'); setError(null) }}
            >
              {mode === 'password' ? 'Prefer a magic link?' : 'Sign in with password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
