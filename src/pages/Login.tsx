import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [verzonden, setVerzonden] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setFout(error.message)
    } else {
      setVerzonden(true)
    }
    setLaden(false)
  }

  return (
    <div className="login-pagina">
      <div className="login-kaart">
        <div className="login-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#2563eb" />
            <path d="M10 28V12h6l4 10 4-10h6v16h-4V18l-3.5 8h-5L14 18v10h-4z" fill="white" />
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
            {fout && <div className="form-fout">{fout}</div>}
            <button type="submit" className="btn-primair btn-volledig" disabled={laden}>
              {laden ? 'Versturen...' : 'Stuur inloglink'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
