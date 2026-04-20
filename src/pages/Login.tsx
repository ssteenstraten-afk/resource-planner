import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Modus = 'wachtwoord' | 'magiclink'

export function Login() {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [modus, setModus] = useState<Modus>('wachtwoord')
  const [verzonden, setVerzonden] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout(null)

    if (modus === 'wachtwoord') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })
      if (error) setFout(error.message)
      // App.tsx LoginRoute handelt de redirect af zodra de sessie beschikbaar is
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setFout(error.message)
      else setVerzonden(true)
    }
    setLaden(false)
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
        <p className="login-subtitel">Log in met je zakelijke e-mailadres</p>

        {verzonden ? (
          <div className="login-bevestiging">
            <div className="bevestiging-icoon">✉️</div>
            <h2>Check je e-mail</h2>
            <p>We hebben een inloglink gestuurd naar <strong>{email}</strong>.</p>
            <p className="hint">Geen e-mail ontvangen? Controleer je spam of probeer opnieuw.</p>
            <button className="btn-secundair" onClick={() => setVerzonden(false)}>
              Opnieuw proberen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-veld">
              <label htmlFor="email">E-mailadres</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="naam@bedrijf.nl"
                required
                autoFocus
                className="form-invoer"
              />
            </div>

            {modus === 'wachtwoord' && (
              <div className="form-veld">
                <label htmlFor="wachtwoord">Wachtwoord</label>
                <input
                  id="wachtwoord"
                  type="password"
                  value={wachtwoord}
                  onChange={e => setWachtwoord(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-invoer"
                />
              </div>
            )}

            {fout && <div className="form-fout">{fout}</div>}

            <button type="submit" className="btn-primair btn-volledig" disabled={laden}>
              {laden ? 'Inloggen...' : modus === 'wachtwoord' ? 'Inloggen' : 'Stuur inloglink'}
            </button>

            <button
              type="button"
              className="btn-tekst"
              style={{ textAlign: 'center', width: '100%' }}
              onClick={() => { setModus(m => m === 'wachtwoord' ? 'magiclink' : 'wachtwoord'); setFout(null) }}
            >
              {modus === 'wachtwoord' ? 'Liever een magic link?' : 'Inloggen met wachtwoord'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
