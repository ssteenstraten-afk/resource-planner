import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getKomendeWeken, type WeekInfo } from '../lib/weekUtils'
import { WeekHeader } from '../components/WeekHeader'
import type { Database } from '../lib/database.types'

type Consultant = Database['public']['Tables']['consultants']['Row']
type Bezetting = Database['public']['Tables']['bezetting']['Row']
type Project = Database['public']['Tables']['projecten']['Row']

const INITIEEL_WEKEN = 12

export function Dashboard() {
  const navigate = useNavigate()
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [bezettingen, setBezettingen] = useState<Bezetting[]>([])
  const [projecten, setProjecten] = useState<Project[]>([])
  const [laden, setLaden] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [filterNiveau, setFilterNiveau] = useState('alle')
  const [filterNaam, setFilterNaam] = useState('alle')
  const [tooltipInfo, setTooltipInfo] = useState<{
    consultantId: string
    weekKey: string
    x: number
    y: number
  } | null>(null)

  const weken: WeekInfo[] = useMemo(() => {
    const startDatum = new Date()
    startDatum.setDate(startDatum.getDate() + weekOffset * 7)
    return getKomendeWeken(INITIEEL_WEKEN, startDatum)
  }, [weekOffset])

  useEffect(() => {
    async function laad() {
      setLaden(true)
      const [consResult, bezResult, projResult] = await Promise.all([
        supabase.from('consultants').select('*').eq('actief', true).eq('rol', 'consultant').order('naam'),
        supabase.from('bezetting').select('*').gte('jaar', weken[0].jaar).lte('jaar', weken[weken.length - 1].jaar),
        supabase.from('projecten').select('*'),
      ])
      if (consResult.data) setConsultants(consResult.data)
      if (bezResult.data) setBezettingen(bezResult.data)
      if (projResult.data) setProjecten(projResult.data)
      setLaden(false)
    }
    laad()
  }, [weken[0].jaar, weken[0].week])

  const projectNaam = useMemo(
    () => new Map(projecten.map(p => [p.id, p.naam])),
    [projecten]
  )

  const niveaus = useMemo(
    () => ['alle', ...Array.from(new Set(consultants.map(c => c.functieniveau))).sort()],
    [consultants]
  )

  const gefilterdeConsultants = consultants.filter(c => {
    const niveauOk = filterNiveau === 'alle' || c.functieniveau === filterNiveau
    const naamOk = filterNaam === 'alle' || c.id === filterNaam
    return niveauOk && naamOk
  })

  function getBezettingPct(consultantId: string, weekKey: string, contractUren: number): number {
    const [jaar, week] = weekKey.split('-').map(Number)
    const totaal = bezettingen
      .filter(b => b.consultant_id === consultantId && b.jaar === jaar && b.week === week)
      .reduce((s, b) => s + b.uren, 0)
    return contractUren > 0 ? Math.round((totaal / contractUren) * 100) : 0
  }

  function getCelKleur(pct: number): string {
    if (pct > 100) return '#ede9fe'
    if (pct >= 80) return '#dcfce7'
    if (pct >= 60) return '#fff7ed'
    return '#fef2f2'
  }

  function getCelTekstKleur(pct: number): string {
    if (pct > 100) return '#5b21b6'
    if (pct >= 80) return '#15803d'
    if (pct >= 60) return '#c2410c'
    return '#b91c1c'
  }

  function getTooltipProjecten(consultantId: string, weekKey: string) {
    const [jaar, week] = weekKey.split('-').map(Number)
    return bezettingen.filter(
      b => b.consultant_id === consultantId && b.jaar === jaar && b.week === week && b.uren > 0
    )
  }

  if (laden) {
    return (
      <div className="laden-scherm">
        <div className="laden-spinner" />
        <p>Dashboard laden...</p>
      </div>
    )
  }

  return (
    <div className="pagina-wrapper" onClick={() => setTooltipInfo(null)}>
      <div className="pagina-header">
        <h1 className="pagina-titel">Bezettingsoverzicht</h1>
      </div>

      <div className="dashboard-filters">
        <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} className="filter-select">
          {niveaus.map(n => (
            <option key={n} value={n}>{n === 'alle' ? 'Alle niveaus' : n}</option>
          ))}
        </select>
        <select value={filterNaam} onChange={e => setFilterNaam(e.target.value)} className="filter-select" style={{ minWidth: 180 }}>
          <option value="alle">Alle consultants</option>
          {consultants.map(c => (
            <option key={c.id} value={c.id}>{c.naam}</option>
          ))}
        </select>
        <div className="week-navigatie">
          <button className="btn-icon" onClick={() => setWeekOffset(o => o - 1)} title="Vorige week">‹</button>
          <span className="week-nav-label">{weken[0].label} – {weken[weken.length - 1].label}</span>
          <button className="btn-icon" onClick={() => setWeekOffset(o => o + 1)} title="Volgende week">›</button>
          <button className="btn-tekst" onClick={() => setWeekOffset(0)}>Vandaag</button>
        </div>
      </div>

      <div className="tabel-scroll kaart">
        <table className="bezetting-tabel heatmap-tabel">
          <thead>
            <tr>
              <th className="project-kolom">Consultant</th>
              <WeekHeader weken={weken} />
            </tr>
          </thead>
          <tbody>
            {gefilterdeConsultants.map(consultant => (
              <tr key={consultant.id}>
                <td className="consultant-naam-cel">
                  <button
                    className="consultant-naam-link"
                    onClick={() => navigate(`/dashboard/consultant/${consultant.id}`)}
                  >
                    {consultant.naam}
                    <span className="consultant-niveau">({consultant.functieniveau.slice(0, 2)})</span>
                  </button>
                </td>
                {weken.map(w => {
                  const weekKey = `${w.jaar}-${w.week}`
                  const pct = getBezettingPct(consultant.id, weekKey, consultant.contract_uren)
                  return (
                    <td
                      key={weekKey}
                      className="heatmap-cel"
                      style={{ backgroundColor: getCelKleur(pct), color: getCelTekstKleur(pct) }}
                      onClick={e => {
                        e.stopPropagation()
                        setTooltipInfo({ consultantId: consultant.id, weekKey, x: e.clientX, y: e.clientY })
                      }}
                    >
                      {pct}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltipInfo && (() => {
        const bezRijen = getTooltipProjecten(tooltipInfo.consultantId, tooltipInfo.weekKey)
        const [jaar, week] = tooltipInfo.weekKey.split('-')
        return (
          <div
            className="tooltip"
            style={{ left: tooltipInfo.x + 8, top: tooltipInfo.y + 8 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="tooltip-header">wk{week} {jaar}</div>
            {bezRijen.length === 0 ? (
              <div className="tooltip-rij">Geen bezetting</div>
            ) : (
              bezRijen.map(b => (
                <div key={b.id} className="tooltip-rij">
                  <span>{projectNaam.get(b.project_id) ?? '—'}</span>
                  <span className="tooltip-uren">{b.uren}u</span>
                </div>
              ))
            )}
          </div>
        )
      })()}

      <div className="legenda">
        <span className="legenda-item legenda-rood">&lt; 60% — onderbezet</span>
        <span className="legenda-item legenda-oranje">60–79%</span>
        <span className="legenda-item legenda-groen">≥ 80% — goed bezet</span>
        <span className="legenda-item legenda-paars">&gt; 100% — overbezet</span>
      </div>
    </div>
  )
}
