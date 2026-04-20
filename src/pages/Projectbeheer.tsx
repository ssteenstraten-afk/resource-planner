import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Project = Database['public']['Tables']['projecten']['Row']
type ProjectInsert = Database['public']['Tables']['projecten']['Insert']

const LEEG_FORMULIER: ProjectInsert = {
  naam: '',
  klant: '',
  startdatum: null,
  einddatum: null,
  status: 'actief',
  is_systeem: false,
}

export function Projectbeheer() {
  const navigate = useNavigate()
  const [projecten, setProjecten] = useState<Project[]>([])
  const [laden, setLaden] = useState(true)
  const [formulier, setFormulier] = useState<ProjectInsert>(LEEG_FORMULIER)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function laadProjecten() {
    const { data } = await supabase
      .from('projecten')
      .select('*')
      .order('is_systeem', { ascending: false })
      .order('naam')
    setProjecten(data ?? [])
    setLaden(false)
  }

  useEffect(() => { laadProjecten() }, [])

  async function handleOpslaan(e: React.FormEvent) {
    e.preventDefault()
    setOpslaan(true)
    setFout(null)

    const { error } = await supabase.from('projecten').insert({
      ...formulier,
      klant: formulier.klant || null,
      startdatum: formulier.startdatum || null,
      einddatum: formulier.einddatum || null,
    })

    if (error) {
      setFout(error.message)
    } else {
      setFormulier(LEEG_FORMULIER)
      setToonFormulier(false)
      await laadProjecten()
    }
    setOpslaan(false)
  }

  async function handleAfsluiten(project: Project) {
    if (project.is_systeem) return
    const nieuweStatus = project.status === 'actief' ? 'afgesloten' : 'actief'
    await supabase
      .from('projecten')
      .update({ status: nieuweStatus })
      .eq('id', project.id)
    await laadProjecten()
  }

  if (laden) {
    return (
      <div className="laden-scherm">
        <div className="laden-spinner" />
        <p>Projecten laden...</p>
      </div>
    )
  }

  return (
    <div className="pagina-wrapper">
      <div className="pagina-header">
        <div>
          <button className="btn-terug" onClick={() => navigate('/dashboard')}>
            ← Terug naar dashboard
          </button>
          <h1 className="pagina-titel">Projectbeheer</h1>
        </div>
        <button className="btn-primair" onClick={() => setToonFormulier(t => !t)}>
          {toonFormulier ? 'Annuleer' : '+ Nieuw project'}
        </button>
      </div>

      {toonFormulier && (
        <div className="formulier-kaart">
          <h2 className="formulier-titel">Nieuw project aanmaken</h2>
          <form onSubmit={handleOpslaan} className="project-formulier">
            <div className="form-rij">
              <div className="form-veld">
                <label>Projectnaam *</label>
                <input
                  type="text"
                  required
                  value={formulier.naam}
                  onChange={e => setFormulier(f => ({ ...f, naam: e.target.value }))}
                  className="form-invoer"
                  placeholder="Naam van het project"
                />
              </div>
              <div className="form-veld">
                <label>Klant</label>
                <input
                  type="text"
                  value={formulier.klant ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, klant: e.target.value }))}
                  className="form-invoer"
                  placeholder="Klantnaam"
                />
              </div>
            </div>
            <div className="form-rij">
              <div className="form-veld">
                <label>Startdatum</label>
                <input
                  type="date"
                  value={formulier.startdatum ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, startdatum: e.target.value }))}
                  className="form-invoer"
                />
              </div>
              <div className="form-veld">
                <label>Einddatum</label>
                <input
                  type="date"
                  value={formulier.einddatum ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, einddatum: e.target.value }))}
                  className="form-invoer"
                />
              </div>
              <div className="form-veld">
                <label>Status</label>
                <select
                  value={formulier.status ?? 'actief'}
                  onChange={e => setFormulier(f => ({ ...f, status: e.target.value as 'actief' | 'afgesloten' }))}
                  className="form-invoer"
                >
                  <option value="actief">Actief</option>
                  <option value="afgesloten">Afgesloten</option>
                </select>
              </div>
            </div>
            {fout && <div className="form-fout">{fout}</div>}
            <div className="form-acties">
              <button type="submit" className="btn-primair" disabled={opslaan}>
                {opslaan ? 'Opslaan...' : 'Project aanmaken'}
              </button>
              <button type="button" className="btn-secundair" onClick={() => setToonFormulier(false)}>
                Annuleer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="project-lijst">
        <table className="data-tabel">
          <thead>
            <tr>
              <th>Project</th>
              <th>Klant</th>
              <th>Periode</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {projecten.map(project => (
              <tr key={project.id} className={project.status === 'afgesloten' ? 'rij-afgesloten' : ''}>
                <td>
                  <span className="project-naam-tekst">{project.naam}</span>
                  {project.is_systeem && <span className="badge badge-systeem">systeem</span>}
                </td>
                <td>{project.klant ?? '—'}</td>
                <td>
                  {project.startdatum
                    ? `${project.startdatum} – ${project.einddatum ?? '…'}`
                    : '—'}
                </td>
                <td>
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                </td>
                <td>
                  {!project.is_systeem && (
                    <button
                      className="btn-tekst"
                      onClick={() => handleAfsluiten(project)}
                    >
                      {project.status === 'actief' ? 'Afsluiten' : 'Heropenen'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
