import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getISOWeek, getISOWeekYear, addWeeks } from 'date-fns'
import type { Database } from '../lib/database.types'

type Project = Database['public']['Tables']['projecten']['Row']
type Consultant = Database['public']['Tables']['consultants']['Row']
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
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [laden, setLaden] = useState(true)
  const [formulier, setFormulier] = useState<ProjectInsert>(LEEG_FORMULIER)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  // Toewijzing state
  const [geselecteerdProject, setGeselecteerdProject] = useState<string | null>(null)
  const [toewijzingConsultant, setToewijzingConsultant] = useState('')
  const [toewijzingUren, setToewijzingUren] = useState('16')
  const [toewijzingBezig, setToewijzingBezig] = useState(false)
  const [toewijzingFout, setToewijzingFout] = useState<string | null>(null)

  async function laadData() {
    const [projRes, consRes] = await Promise.all([
      supabase.from('projecten').select('*').order('is_systeem', { ascending: false }).order('naam'),
      supabase.from('consultants').select('*').eq('actief', true).eq('rol', 'consultant').order('naam'),
    ])
    setProjecten(projRes.data ?? [])
    setConsultants(consRes.data ?? [])
    setLaden(false)
  }

  useEffect(() => { laadData() }, [])

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
    if (error) { setFout(error.message) }
    else { setFormulier(LEEG_FORMULIER); setToonFormulier(false); await laadData() }
    setOpslaan(false)
  }

  async function handleAfsluiten(project: Project) {
    if (project.is_systeem) return
    const nieuweStatus = project.status === 'actief' ? 'afgesloten' : 'actief'
    await supabase.from('projecten').update({ status: nieuweStatus }).eq('id', project.id)
    await laadData()
  }

  async function handleToewijzen(project: Project) {
    if (!toewijzingConsultant) return
    setToewijzingBezig(true)
    setToewijzingFout(null)

    const uren = parseFloat(toewijzingUren)
    if (isNaN(uren) || uren <= 0) {
      setToewijzingFout('Voer geldige uren in')
      setToewijzingBezig(false)
      return
    }

    // Bepaal wekenbereik op basis van project start/einddatum
    const vandaag = new Date()
    const start = project.startdatum ? new Date(project.startdatum) : vandaag
    const eind = project.einddatum ? new Date(project.einddatum) : addWeeks(vandaag, 12)

    const upserts: Database['public']['Tables']['bezetting']['Insert'][] = []
    let huidig = new Date(start)
    while (huidig <= eind) {
      upserts.push({
        consultant_id: toewijzingConsultant,
        project_id: project.id,
        jaar: getISOWeekYear(huidig),
        week: getISOWeek(huidig),
        uren,
      })
      huidig = addWeeks(huidig, 1)
    }

    if (upserts.length === 0) {
      setToewijzingFout('Geen weken gevonden in de projectperiode')
      setToewijzingBezig(false)
      return
    }

    const { error } = await supabase.from('bezetting').upsert(upserts, {
      onConflict: 'consultant_id,project_id,jaar,week',
    })

    if (error) setToewijzingFout(error.message)
    else { setToewijzingConsultant(''); setToewijzingUren('16') }
    setToewijzingBezig(false)
  }

  if (laden) {
    return <div className="laden-scherm"><div className="laden-spinner" /><p>Projecten laden...</p></div>
  }

  return (
    <div className="pagina-wrapper">
      <div className="pagina-header">
        <div>
          <button className="btn-terug" onClick={() => navigate('/dashboard')}>← Terug naar dashboard</button>
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
                <input type="text" required value={formulier.naam}
                  onChange={e => setFormulier(f => ({ ...f, naam: e.target.value }))}
                  className="form-invoer" placeholder="Naam van het project" />
              </div>
              <div className="form-veld">
                <label>Klant</label>
                <input type="text" value={formulier.klant ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, klant: e.target.value }))}
                  className="form-invoer" placeholder="Klantnaam" />
              </div>
            </div>
            <div className="form-rij">
              <div className="form-veld">
                <label>Startdatum</label>
                <input type="date" value={formulier.startdatum ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, startdatum: e.target.value }))}
                  className="form-invoer" />
              </div>
              <div className="form-veld">
                <label>Einddatum</label>
                <input type="date" value={formulier.einddatum ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, einddatum: e.target.value }))}
                  className="form-invoer" />
              </div>
              <div className="form-veld">
                <label>Status</label>
                <select value={formulier.status ?? 'actief'}
                  onChange={e => setFormulier(f => ({ ...f, status: e.target.value as 'actief' | 'afgesloten' }))}
                  className="form-invoer">
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
              <button type="button" className="btn-secundair" onClick={() => setToonFormulier(false)}>Annuleer</button>
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
              <>
                <tr key={project.id} className={project.status === 'afgesloten' ? 'rij-afgesloten' : ''}>
                  <td>
                    <span className="project-naam-tekst">{project.naam}</span>
                    {project.is_systeem && <span className="badge badge-systeem">systeem</span>}
                  </td>
                  <td>{project.klant ?? '—'}</td>
                  <td>{project.startdatum ? `${project.startdatum} – ${project.einddatum ?? '…'}` : '—'}</td>
                  <td><span className={`badge badge-${project.status}`}>{project.status}</span></td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {!project.is_systeem && (
                      <>
                        <button className="btn-tekst"
                          onClick={() => setGeselecteerdProject(p => p === project.id ? null : project.id)}>
                          {geselecteerdProject === project.id ? 'Sluiten' : 'Consultants toewijzen'}
                        </button>
                        <button className="btn-tekst" onClick={() => handleAfsluiten(project)}>
                          {project.status === 'actief' ? 'Afsluiten' : 'Heropenen'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>

                {geselecteerdProject === project.id && (
                  <tr key={`${project.id}-toewijzing`}>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="toewijzing-sectie">
                        <div className="toewijzing-titel">Consultant toewijzen aan {project.naam}</div>
                        <div className="toewijzing-rij">
                          <select
                            value={toewijzingConsultant}
                            onChange={e => setToewijzingConsultant(e.target.value)}
                            className="form-invoer"
                            style={{ width: 220 }}
                          >
                            <option value="">— Selecteer consultant —</option>
                            {consultants.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.naam} ({c.functieniveau})
                              </option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min="1" max="40" step="0.5"
                              value={toewijzingUren}
                              onChange={e => setToewijzingUren(e.target.value)}
                              className="form-invoer"
                              style={{ width: 80 }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--grijs-500)', whiteSpace: 'nowrap' }}>uur/week</span>
                          </div>
                          <button
                            className="btn-primair"
                            onClick={() => handleToewijzen(project)}
                            disabled={!toewijzingConsultant || toewijzingBezig}
                          >
                            {toewijzingBezig ? 'Bezig...' : 'Toewijzen'}
                          </button>
                        </div>
                        {!project.startdatum && (
                          <p style={{ fontSize: 12, color: 'var(--grijs-500)', marginTop: 6 }}>
                            Tip: stel een start- en einddatum in om de juiste weken te vullen. Zonder datum worden de komende 12 weken gebruikt.
                          </p>
                        )}
                        {toewijzingFout && <div className="form-fout" style={{ marginTop: 8 }}>{toewijzingFout}</div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
