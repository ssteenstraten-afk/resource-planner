import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Consultant = Database['public']['Tables']['consultants']['Row']

const NIVEAUS = ['Business Analist', 'Consultant', 'Senior Consultant', 'Manager', 'Principal Consultant', 'Director', 'Partner']

export function Consultantbeheer() {
  const navigate = useNavigate()
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [laden, setLaden] = useState(true)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  const [formulier, setFormulier] = useState({
    naam: '', email: '', functieniveau: 'Medior', contract_uren: 40, rol: 'consultant' as 'consultant' | 'planner'
  })

  async function laadConsultants() {
    const { data } = await supabase.from('consultants').select('*').order('naam')
    setConsultants(data ?? [])
    setLaden(false)
  }

  useEffect(() => { laadConsultants() }, [])

  async function handleOpslaan(e: React.FormEvent) {
    e.preventDefault()
    setOpslaan(true)
    setFout(null)
    setSucces(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-consultant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(formulier),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.fout ?? 'Onbekende fout')

      setSucces(`${formulier.naam} is aangemaakt. Ze kunnen nu inloggen via hun e-mailadres.`)
      setFormulier({ naam: '', email: '', functieniveau: 'Medior', contract_uren: 40, rol: 'consultant' })
      setToonFormulier(false)
      await laadConsultants()
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Aanmaken mislukt')
    } finally {
      setOpslaan(false)
    }
  }

  async function handleDeactiveer(consultant: Consultant) {
    await supabase.from('consultants').update({ actief: !consultant.actief }).eq('id', consultant.id)
    await laadConsultants()
  }

  if (laden) {
    return <div className="laden-scherm"><div className="laden-spinner" /><p>Laden...</p></div>
  }

  return (
    <div className="pagina-wrapper">
      <div className="pagina-header">
        <div>
          <button className="btn-terug" onClick={() => navigate('/dashboard')}>← Terug naar dashboard</button>
          <h1 className="pagina-titel">Consultantbeheer</h1>
        </div>
        <button className="btn-primair" onClick={() => { setToonFormulier(t => !t); setFout(null); setSucces(null) }}>
          {toonFormulier ? 'Annuleer' : '+ Nieuwe gebruiker'}
        </button>
      </div>

      {succes && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 6, color: '#15803d', marginBottom: 16, fontSize: 14 }}>
          {succes}
        </div>
      )}

      {toonFormulier && (
        <div className="formulier-kaart">
          <h2 className="formulier-titel">Nieuwe gebruiker aanmaken</h2>
          <form onSubmit={handleOpslaan}>
            <div className="form-rij">
              <div className="form-veld">
                <label>Volledige naam *</label>
                <input type="text" required value={formulier.naam}
                  onChange={e => setFormulier(f => ({ ...f, naam: e.target.value }))}
                  className="form-invoer" placeholder="Voor- en achternaam" />
              </div>
              <div className="form-veld">
                <label>E-mailadres *</label>
                <input type="email" required value={formulier.email}
                  onChange={e => setFormulier(f => ({ ...f, email: e.target.value }))}
                  className="form-invoer" placeholder="naam@vintura.nl" />
              </div>
            </div>
            <div className="form-rij">
              <div className="form-veld">
                <label>Functieniveau *</label>
                <select value={formulier.functieniveau}
                  onChange={e => setFormulier(f => ({ ...f, functieniveau: e.target.value }))}
                  className="form-invoer">
                  {NIVEAUS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-veld">
                <label>Contracturen / week</label>
                <input type="number" min="1" max="40" value={formulier.contract_uren}
                  onChange={e => setFormulier(f => ({ ...f, contract_uren: parseInt(e.target.value) }))}
                  className="form-invoer" />
              </div>
              <div className="form-veld">
                <label>Rol</label>
                <select value={formulier.rol}
                  onChange={e => setFormulier(f => ({ ...f, rol: e.target.value as 'consultant' | 'planner' }))}
                  className="form-invoer">
                  <option value="consultant">Consultant</option>
                  <option value="planner">Planner</option>
                </select>
              </div>
            </div>
            {fout && <div className="form-fout" style={{ marginTop: 12 }}>{fout}</div>}
            <div className="form-acties" style={{ marginTop: 16 }}>
              <button type="submit" className="btn-primair" disabled={opslaan}>
                {opslaan ? 'Aanmaken...' : 'Gebruiker aanmaken'}
              </button>
              <button type="button" className="btn-secundair" onClick={() => setToonFormulier(false)}>Annuleer</button>
            </div>
          </form>
        </div>
      )}

      <div className="project-lijst">
        <table className="data-tabel">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mail</th>
              <th>Niveau</th>
              <th>Uren/week</th>
              <th>Rol</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {consultants.map(c => (
              <tr key={c.id} className={!c.actief ? 'rij-afgesloten' : ''}>
                <td style={{ fontWeight: 600 }}>{c.naam}</td>
                <td style={{ color: 'var(--grijs-500)' }}>{c.email}</td>
                <td>{c.functieniveau}</td>
                <td>{c.contract_uren}u</td>
                <td><span className={`badge ${c.rol === 'planner' ? 'badge-systeem' : 'badge-actief'}`}>{c.rol}</span></td>
                <td><span className={`badge ${c.actief ? 'badge-actief' : 'badge-afgesloten'}`}>{c.actief ? 'actief' : 'inactief'}</span></td>
                <td>
                  <button className="btn-tekst" onClick={() => handleDeactiveer(c)}>
                    {c.actief ? 'Deactiveren' : 'Activeren'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
