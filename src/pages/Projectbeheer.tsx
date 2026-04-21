import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getISOWeek, getISOWeekYear, addWeeks } from 'date-fns'
import type { Database } from '../lib/database.types'

type Project = Database['public']['Tables']['projecten']['Row']
type Consultant = Database['public']['Tables']['consultants']['Row']
type Bezetting = Database['public']['Tables']['bezetting']['Row']
type ProjectInsert = Database['public']['Tables']['projecten']['Insert']

const LEEG_FORMULIER: ProjectInsert = {
  naam: '', klant: '', startdatum: null, einddatum: null, status: 'actief', is_systeem: false,
}

export function Projectbeheer() {
  const navigate = useNavigate()
  const [projecten, setProjecten] = useState<Project[]>([])
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [bezettingen, setBezettingen] = useState<Bezetting[]>([])
  const [laden, setLaden] = useState(true)
  const [formulier, setFormulier] = useState<ProjectInsert>(LEEG_FORMULIER)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const [geselecteerdProject, setGeselecteerdProject] = useState<string | null>(null)
  const [toewijzingConsultant, setToewijzingConsultant] = useState('')
  const [toewijzingBezig, setToewijzingBezig] = useState(false)
  const [toewijzingFout, setToewijzingFout] = useState<string | null>(null)

  async function laadData() {
    const [projRes, consRes, bezRes] = await Promise.all([
      supabase.from('projecten').select('*').order('is_systeem', { ascending: false }).order('naam'),
      supabase.from('consultants').select('*').eq('actief', true).eq('rol', 'consultant').order('naam'),
      supabase.from('bezetting').select('*'),
    ])
    setProjecten(projRes.data ?? [])
    setConsultants(consRes.data ?? [])
    setBezettingen(bezRes.data ?? [])
    setLaden(false)
  }

  useEffect(() => { laadData() }, [])

  const toegewezenPerProject = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const b of bezettingen) {
      if (!map.has(b.project_id)) map.set(b.project_id, new Set())
      map.get(b.project_id)!.add(b.consultant_id)
    }
    return map
  }, [bezettingen])

  const consultantNaam = useMemo(
    () => new Map(consultants.map(c => [c.id, c])),
    [consultants]
  )

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
    await supabase.from('projecten').update({ status: project.status === 'actief' ? 'afgesloten' : 'actief' }).eq('id', project.id)
    await laadData()
  }

  async function handleToewijzen(project: Project) {
    if (!toewijzingConsultant) return
    setToewijzingBezig(true)
    setToewijzingFout(null)

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
        uren: 0,
      })
      huidig = addWeeks(huidig, 1)
    }

    const { error } = await supabase.from('bezetting').upsert(upserts, {
      onConflict: 'consultant_id,project_id,jaar,week',
      ignoreDuplicates: true,
    })

    if (error) setToewijzingFout(error.message)
    else { setToewijzingConsultant(''); await laadData() }
    setToewijzingBezig(false)
  }

  async function handleVerwijderToewijzing(projectId: string, consultantId: string) {
    await supabase.from('bezetting').delete()
      .eq('project_id', projectId)
      .eq('consultant_id', consultantId)
    await laadData()
  }

  if (laden) {
    return <div className="laden-scherm"><div className="laden-spinner" /><p>Loading projects...</p></div>
  }

  return (
    <div className="pagina-wrapper">
      <div className="pagina-header">
        <div>
          <button className="btn-terug" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
          <h1 className="pagina-titel">Project management</h1>
        </div>
        <button className="btn-primair" onClick={() => setToonFormulier(t => !t)}>
          {toonFormulier ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {toonFormulier && (
        <div className="formulier-kaart">
          <h2 className="formulier-titel">Create new project</h2>
          <form onSubmit={handleOpslaan}>
            <div className="form-rij">
              <div className="form-veld">
                <label>Project name *</label>
                <input type="text" required value={formulier.naam}
                  onChange={e => setFormulier(f => ({ ...f, naam: e.target.value }))}
                  className="form-invoer" placeholder="Project name" />
              </div>
              <div className="form-veld">
                <label>Client</label>
                <input type="text" value={formulier.klant ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, klant: e.target.value }))}
                  className="form-invoer" placeholder="Client name" />
              </div>
            </div>
            <div className="form-rij">
              <div className="form-veld">
                <label>Start date</label>
                <input type="date" value={formulier.startdatum ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, startdatum: e.target.value }))}
                  className="form-invoer" />
              </div>
              <div className="form-veld">
                <label>End date</label>
                <input type="date" value={formulier.einddatum ?? ''}
                  onChange={e => setFormulier(f => ({ ...f, einddatum: e.target.value }))}
                  className="form-invoer" />
              </div>
              <div className="form-veld">
                <label>Status</label>
                <select value={formulier.status ?? 'actief'}
                  onChange={e => setFormulier(f => ({ ...f, status: e.target.value as 'actief' | 'afgesloten' }))}
                  className="form-invoer">
                  <option value="actief">Active</option>
                  <option value="afgesloten">Closed</option>
                </select>
              </div>
            </div>
            {fout && <div className="form-fout">{fout}</div>}
            <div className="form-acties" style={{ marginTop: 16 }}>
              <button type="submit" className="btn-primair" disabled={opslaan}>
                {opslaan ? 'Saving...' : 'Create project'}
              </button>
              <button type="button" className="btn-secundair" onClick={() => setToonFormulier(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="project-lijst">
        <table className="data-tabel">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projecten.map(project => {
              const toegewezen = toegewezenPerProject.get(project.id) ?? new Set()
              const isOpen = geselecteerdProject === project.id
              return (
                <>
                  <tr key={project.id} className={project.status === 'afgesloten' ? 'rij-afgesloten' : ''}>
                    <td>
                      <span className="project-naam-tekst">{project.naam}</span>
                      {project.is_systeem && <span className="badge badge-systeem">system</span>}
                    </td>
                    <td>{project.klant ?? '—'}</td>
                    <td>{project.startdatum ? `${project.startdatum} – ${project.einddatum ?? '…'}` : '—'}</td>
                    <td><span className={`badge badge-${project.status}`}>{project.status === 'actief' ? 'active' : 'closed'}</span></td>
                    <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!project.is_systeem && (
                        <>
                          <button className="btn-tekst"
                            onClick={() => { setGeselecteerdProject(isOpen ? null : project.id); setToewijzingFout(null) }}>
                            {isOpen ? 'Close' : `Consultants (${toegewezen.size})`}
                          </button>
                          <button className="btn-tekst" onClick={() => handleAfsluiten(project)}>
                            {project.status === 'actief' ? 'Close project' : 'Reopen'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr key={`${project.id}-toewijzing`}>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <div className="toewijzing-sectie">
                          <div className="toewijzing-titel">Assigned consultants</div>

                          {toegewezen.size === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--grijs-400)', marginBottom: 12 }}>No one assigned yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                              {Array.from(toegewezen).map(cId => {
                                const c = consultantNaam.get(cId)
                                return (
                                  <div key={cId} className="toewijzing-consultant">
                                    <span>{c?.naam ?? cId}</span>
                                    <span style={{ color: 'var(--grijs-400)', fontSize: 11 }}>{c?.functieniveau}</span>
                                    <button
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grijs-400)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
                                      onClick={() => handleVerwijderToewijzing(project.id, cId)}
                                      title="Remove assignment"
                                    >×</button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <div className="toewijzing-titel">Add consultant</div>
                          <div className="toewijzing-rij">
                            <select value={toewijzingConsultant}
                              onChange={e => setToewijzingConsultant(e.target.value)}
                              className="form-invoer" style={{ width: 220 }}>
                              <option value="">— Select consultant —</option>
                              {consultants
                                .filter(c => !toegewezen.has(c.id))
                                .map(c => (
                                  <option key={c.id} value={c.id}>{c.naam} ({c.functieniveau})</option>
                                ))}
                            </select>
                            <button className="btn-primair"
                              onClick={() => handleToewijzen(project)}
                              disabled={!toewijzingConsultant || toewijzingBezig}>
                              {toewijzingBezig ? 'Working...' : 'Assign'}
                            </button>
                          </div>
                          {!project.startdatum && (
                            <p style={{ fontSize: 12, color: 'var(--grijs-400)', marginTop: 6 }}>
                              Tip: set a start and end date for the correct weeks. Without a date, the next 12 weeks will be used.
                            </p>
                          )}
                          {toewijzingFout && <div className="form-fout" style={{ marginTop: 8 }}>{toewijzingFout}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
